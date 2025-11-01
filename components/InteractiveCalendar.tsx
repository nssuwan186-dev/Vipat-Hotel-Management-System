import React, { useState, useMemo, FC } from 'react';
import type { Booking, Room, Guest, Page } from '../types';
import NewBookingModal from './NewBookingModal';

interface CalendarDay {
    key: string;
    date: Date | null;
    isCurrentMonth: boolean;
    isToday: boolean;
    availableRooms: number;
    occupiedRooms: number;
    bookingsForDay: Booking[];
}

interface DayDetailModalProps {
    date: Date;
    bookings: Booking[];
    guests: Guest[];
    rooms: Room[];
    onClose: () => void;
    setBookingRoomFilter: (roomId: string | null) => void;
    setCurrentPage: (page: Page) => void;
    addBooking: (guestName: string, phone: string, roomNumber: string, checkIn: string, checkOut: string) => Promise<string>;
}

const DayDetailModal: FC<DayDetailModalProps> = ({ date, bookings, guests, rooms, onClose, setBookingRoomFilter, setCurrentPage, addBooking }) => {
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    
    const { checkIns, checkOuts, stayOvers } = useMemo(() => {
        const todayStr = date.toDateString();
        const checkIns = bookings.filter(b => new Date(b.checkInDate).toDateString() === todayStr);
        const checkOuts = bookings.filter(b => new Date(b.checkOutDate).toDateString() === todayStr);
        const stayOvers = bookings.filter(b => {
            const checkIn = new Date(b.checkInDate);
            const checkOut = new Date(b.checkOutDate);
            return date > checkIn && date < checkOut && new Date(b.checkInDate).toDateString() !== todayStr;
        });
        return { checkIns, checkOuts, stayOvers };
    }, [date, bookings]);

    const handleRoomClick = (roomId: string) => {
        setBookingRoomFilter(roomId);
        setCurrentPage('การดำเนินงาน');
        onClose();
    };

    const renderBookingList = (title: string, bookingList: Booking[], color: string) => (
        <div>
            <h4 className={`font-semibold text-md mb-2 ${color}`}>{title} ({bookingList.length})</h4>
            {bookingList.length > 0 ? (
                <div className="space-y-2">
                    {bookingList.map(b => {
                        const guest = guests.find(g => g.id === b.guestId);
                        const room = rooms.find(r => r.id === b.roomId);
                        return (
                            <div key={b.id} className="p-2 bg-gray-50 rounded-md text-sm flex justify-between items-center">
                                <span>{guest?.name || 'N/A'}</span>
                                <button onClick={() => handleRoomClick(b.roomId)} className="font-semibold text-blue-600 hover:underline">
                                    ห้อง {room?.number || 'N/A'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            ) : <p className="text-sm text-gray-500 italic">ไม่มีรายการ</p>}
        </div>
    );

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
                <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-bold mb-4 text-gray-800">
                        สรุปวันที่ {date.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </h3>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {renderBookingList('เช็คอิน', checkIns, 'text-green-600')}
                        {renderBookingList('เช็คเอาท์', checkOuts, 'text-red-600')}
                        {renderBookingList('เข้าพักอยู่', stayOvers, 'text-yellow-600')}
                    </div>
                    <div className="flex justify-between items-center pt-4 mt-4 border-t">
                        <button onClick={() => setIsBookingModalOpen(true)} className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">
                            ลงทะเบียน
                        </button>
                        <button onClick={onClose} className="px-5 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">
                            ปิด
                        </button>
                    </div>
                </div>
            </div>
            {isBookingModalOpen && (
                <NewBookingModal
                    isOpen={isBookingModalOpen}
                    onClose={(bookingMade) => {
                        setIsBookingModalOpen(false);
                        if (bookingMade) {
                            onClose(); // Also close the details modal
                        }
                    }}
                    addBooking={addBooking}
                    selectedDate={date}
                />
            )}
        </>
    );
};


interface InteractiveCalendarProps {
    bookings: Booking[];
    rooms: Room[];
    guests: Guest[];
    setBookingRoomFilter: (roomId: string | null) => void;
    setCurrentPage: (page: Page) => void;
    addBooking: (guestName: string, phone: string, roomNumber: string, checkIn: string, checkOut: string) => Promise<string>;
}

const InteractiveCalendar: FC<InteractiveCalendarProps> = ({ bookings, rooms, guests, setBookingRoomFilter, setCurrentPage, addBooking }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const weekDays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
    const totalRooms = rooms.length;

    const calendarDays = useMemo((): CalendarDay[] => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date(); today.setHours(0, 0, 0, 0);

        const days: CalendarDay[] = [];

        // Add padding for days from previous month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push({ key: `empty-start-${i}`, date: null, isCurrentMonth: false, isToday: false, availableRooms: 0, occupiedRooms: 0, bookingsForDay: [] });
        }

        // Add days of the current month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            
            const occupiedRoomIds = new Set<string>();
            const bookingsForDay: Booking[] = [];

            bookings.forEach(b => {
                const checkIn = new Date(b.checkInDate); checkIn.setHours(0,0,0,0);
                const checkOut = new Date(b.checkOutDate); checkOut.setHours(0,0,0,0);
                if (date >= checkIn && date < checkOut && b.status !== 'ยกเลิก') {
                    occupiedRoomIds.add(b.roomId);
                    bookingsForDay.push(b);
                }
            });
            
            const monthlyRentalRooms = rooms.filter(r => r.status === 'เช่ารายเดือน').length;
            const occupiedCount = occupiedRoomIds.size + monthlyRentalRooms;

            days.push({
                key: `day-${day}`,
                date,
                isCurrentMonth: true,
                isToday: date.getTime() === today.getTime(),
                availableRooms: totalRooms - occupiedCount,
                occupiedRooms: occupiedCount,
                bookingsForDay
            });
        }
        
        // Add padding for days from next month to fill grid
        const totalCells = days.length;
        const cellsToFill = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
         for (let i = 0; i < cellsToFill; i++) {
            days.push({ key: `empty-end-${i}`, date: null, isCurrentMonth: false, isToday: false, availableRooms: 0, occupiedRooms: 0, bookingsForDay: [] });
        }

        return days;
    }, [currentDate, bookings, rooms]);

    const handleDayClick = (day: CalendarDay) => {
        if(day.date) {
            setSelectedDate(day.date);
        }
    }

    return (
        <>
            <div className="flex justify-between items-center mb-4">
                <button 
                    onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} 
                    className="p-2 rounded-full hover:bg-gray-100"
                    aria-label="Previous month"
                >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h3 className="text-lg font-semibold text-gray-800">
                    {currentDate.toLocaleString('th-TH', { month: 'long', year: 'numeric' })}
                </h3>
                <button 
                    onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} 
                    className="p-2 rounded-full hover:bg-gray-100"
                    aria-label="Next month"
                >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-sm font-semibold text-gray-500 mb-2">
                {weekDays.map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map(day => (
                    <div
                        key={day.key}
                        onClick={() => handleDayClick(day)}
                        className={`h-24 p-2 border rounded-lg flex flex-col justify-between transition-colors duration-200 ${
                            day.isCurrentMonth ? 'bg-white border-gray-200 cursor-pointer hover:bg-blue-50 hover:border-blue-300' : 'bg-gray-50 border-gray-100'
                        } ${day.isToday ? 'border-2 border-blue-500' : ''}`}
                    >
                        {day.date && (
                            <>
                                <div className={`text-sm font-semibold self-end ${day.isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                                    {day.date.getDate()}
                                </div>
                                <div className="text-xs text-left space-y-1">
                                    <div className="flex items-center">
                                        <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                                        <span className="font-medium text-gray-600">{day.availableRooms} ว่าง</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
                                        <span className="font-medium text-gray-600">{day.occupiedRooms} จอง</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
            {selectedDate && (
                <DayDetailModal 
                    date={selectedDate}
                    bookings={calendarDays.find(d => d.date?.getTime() === selectedDate.getTime())?.bookingsForDay || []}
                    guests={guests}
                    rooms={rooms}
                    onClose={() => setSelectedDate(null)}
                    setBookingRoomFilter={setBookingRoomFilter}
                    setCurrentPage={setCurrentPage}
                    addBooking={addBooking}
                />
            )}
        </>
    );
}

export default InteractiveCalendar;