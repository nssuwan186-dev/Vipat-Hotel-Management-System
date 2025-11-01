import React, { useState, useMemo, FC, useEffect } from 'react';
import type { Booking, Guest, Room } from '../types';
import ConfirmationDialog from './ConfirmationDialog';

interface BookingsProps {
    bookings: Booking[];
    guests: Guest[];
    rooms: Room[];
    updateBooking: (bookingId: string, newDetails: any) => Promise<string>;
    deleteBooking: (bookingId: string) => Promise<string>;
    bookingRoomFilter: string | null;
    setBookingRoomFilter: (roomId: string | null) => void;
}

const BookingRow: FC<{booking: Booking, guest?: Guest, room?: Room, onEdit: () => void, onDelete: () => void}> = ({ booking, guest, room, onEdit, onDelete }) => {
    const statusClasses: Record<Booking['status'], string> = {
        'เช็คอิน': 'bg-blue-100 text-blue-800',
        'เช็คเอาท์': 'bg-gray-100 text-gray-800',
        'ยืนยันแล้ว': 'bg-green-100 text-green-800',
        'ยกเลิก': 'bg-red-100 text-red-800'
    };
    return (
        <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200">
            <td className="py-3 px-4 text-sm text-gray-800 font-medium">{guest?.name || 'N/A'}</td>
            <td className="py-3 px-4 text-sm text-gray-700">{booking.checkInDate.toLocaleDateString('th-TH')}</td>
            <td className="py-3 px-4 text-sm text-gray-700">{booking.checkOutDate.toLocaleDateString('th-TH')}</td>
            <td className="py-3 px-4 text-sm text-gray-700">{room?.number || 'N/A'}</td>
            <td className="py-3 px-4">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusClasses[booking.status]}`}>
                    {booking.status}
                </span>
            </td>
            <td className="py-3 px-4 text-sm">
                <button onClick={onEdit} className="text-blue-600 hover:text-blue-800 font-medium transition-colors">แก้ไข</button>
                <button onClick={onDelete} className="text-red-600 hover:text-red-800 font-medium ml-4 transition-colors">ลบ</button>
            </td>
        </tr>
    );
}

interface EditBookingModalProps {
    booking: Booking;
    guests: Guest[];
    rooms: Room[];
    onClose: () => void;
    onUpdate: (bookingId: string, details: any) => Promise<string>;
}

const EditBookingModal: FC<EditBookingModalProps> = ({ booking, guests, rooms, onClose, onUpdate }) => {
    const [formState, setFormState] = useState({
        guestName: '',
        phone: '',
        roomNumber: '',
        checkIn: '',
        checkOut: ''
    });
    const [message, setMessage] = useState('');

    useEffect(() => {
        const guest = guests.find(g => g.id === booking.guestId);
        const room = rooms.find(r => r.id === booking.roomId);
        setFormState({
            guestName: guest?.name || '',
            phone: guest?.phone || '',
            roomNumber: room?.number || '',
            checkIn: booking.checkInDate.toISOString().split('T')[0],
            checkOut: booking.checkOutDate.toISOString().split('T')[0]
        });
    }, [booking, guests, rooms]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormState({ ...formState, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = await onUpdate(booking.id, {
            guestName: formState.guestName,
            phone: formState.phone,
            roomNumber: formState.roomNumber,
            checkInStr: formState.checkIn,
            checkOutStr: formState.checkOut
        });
        setMessage(result);
        if (!result.startsWith('ข้อผิดพลาด')) {
            setTimeout(() => onClose(), 1500);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 text-gray-800">แก้ไขการจอง ID: {booking.id}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {message && <p className={`p-3 rounded-lg text-sm ${message.startsWith('ข้อผิดพลาด') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message}</p>}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">ชื่อผู้เข้าพัก</label>
                        <input type="text" name="guestName" value={formState.guestName} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
                        <input type="tel" name="phone" value={formState.phone} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">หมายเลขห้อง</label>
                        <input type="text" name="roomNumber" value={formState.roomNumber} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">วันที่เช็คอิน</label>
                        <input type="date" name="checkIn" value={formState.checkIn} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">วันที่เช็คเอาท์</label>
                        <input type="date" name="checkOut" value={formState.checkOut} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">ยกเลิก</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">บันทึกการเปลี่ยนแปลง</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const Bookings: React.FC<BookingsProps> = ({ bookings, guests, rooms, updateBooking, deleteBooking, bookingRoomFilter, setBookingRoomFilter }) => {
    const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
    const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
    const [sortOption, setSortOption] = useState('checkIn-desc');
    const [message, setMessage] = useState('');

    const roomForFilter = useMemo(() => {
        if (!bookingRoomFilter) return null;
        return rooms.find(r => r.id === bookingRoomFilter);
    }, [bookingRoomFilter, rooms]);

    const sortedBookings = useMemo(() => {
        const filtered = bookingRoomFilter 
            ? bookings.filter(b => b.roomId === bookingRoomFilter)
            : [...bookings];

        filtered.sort((a, b) => {
          switch (sortOption) {
            case 'checkIn-asc':
              return new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime();
            case 'checkOut-desc':
              return new Date(b.checkOutDate).getTime() - new Date(a.checkOutDate).getTime();
            case 'checkOut-asc':
              return new Date(a.checkOutDate).getTime() - new Date(b.checkOutDate).getTime();
            case 'price-desc':
              return b.totalPrice - a.totalPrice;
            case 'price-asc':
              return a.totalPrice - b.totalPrice;
            case 'checkIn-desc':
            default:
              return new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime();
          }
        });
        return filtered;
      }, [bookings, sortOption, bookingRoomFilter]);

    const handleDeleteBooking = async () => {
        if (bookingToDelete) {
            const result = await deleteBooking(bookingToDelete.id);
            setMessage(result);
            setBookingToDelete(null);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    return (
        <>
            <div>
                {roomForFilter && (
                    <div className="p-3 mb-4 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
                        <p className="text-sm text-blue-800">
                            <span className="font-semibold">กำลังแสดงการจองสำหรับห้อง:</span> {roomForFilter.number} ({roomForFilter.type})
                        </p>
                        <button
                            onClick={() => setBookingRoomFilter(null)}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        >
                            ล้างตัวกรอง
                        </button>
                    </div>
                )}
                <div className="flex justify-end mb-4">
                        <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                        className="px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        aria-label="Sort bookings"
                    >
                        <option value="checkIn-desc">เรียงตามวันเช็คอิน (ใหม่สุด)</option>
                        <option value="checkIn-asc">เรียงตามวันเช็คอิน (เก่าสุด)</option>
                        <option value="checkOut-desc">เรียงตามวันเช็คเอาท์ (ใหม่สุด)</option>
                        <option value="checkOut-asc">เรียงตามวันเช็คเอาท์ (เก่าสุด)</option>
                        <option value="price-desc">เรียงตามราคา (สูงสุด-ต่ำสุด)</option>
                        <option value="price-asc">เรียงตามราคา (ต่ำสุด-สูงสุด)</option>
                    </select>
                </div>
                    {message && <p className="p-3 my-2 rounded-lg bg-green-100 text-green-700">{message}</p>}
                <div className="overflow-x-auto">
                    <table className="w-full whitespace-nowrap">
                        <thead className="bg-gray-100/70">
                            <tr>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">ผู้เข้าพัก</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">เช็คอิน</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">เช็คเอาท์</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">ห้อง</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">สถานะ</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">การกระทำ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedBookings.map(b => (
                                <BookingRow 
                                    key={b.id} 
                                    booking={b} 
                                    guest={guests.find(g => g.id === b.guestId)} 
                                    room={rooms.find(r => r.id === b.roomId)}
                                    onEdit={() => setEditingBooking(b)}
                                    onDelete={() => setBookingToDelete(b)}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {editingBooking && (
                <EditBookingModal
                    booking={editingBooking}
                    guests={guests}
                    rooms={rooms}
                    onClose={() => setEditingBooking(null)}
                    onUpdate={updateBooking}
                />
            )}
            {bookingToDelete && (
                <ConfirmationDialog
                    isOpen={!!bookingToDelete}
                    onClose={() => setBookingToDelete(null)}
                    onConfirm={handleDeleteBooking}
                    title="ยืนยันการลบการจอง"
                    message={`คุณแน่ใจหรือไม่ว่าต้องการลบการจอง ID: ${bookingToDelete.id} ของคุณ ${guests.find(g => g.id === bookingToDelete.guestId)?.name}? การกระทำนี้ไม่สามารถย้อนกลับได้`}
                />
            )}
        </>
    );
};

export default Bookings;