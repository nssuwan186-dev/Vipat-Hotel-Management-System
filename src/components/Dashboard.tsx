import React, { useMemo, useState } from 'react';
import type { Page, Booking, Room, Expense, Task, Invoice, Guest, Income, RoomStatusFilter } from '../types';
import InteractiveCalendar from './InteractiveCalendar';
import { BedIcon } from './icons/Icons';


const CardIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="mr-3 p-2 bg-white/20 rounded-full">{children}</div>
);

const DashboardCard: React.FC<{ title: string; value: string; subtext?: string; gradient: string; icon: React.ReactNode, onClick?: () => void }> = ({ title, value, subtext, gradient, icon, onClick }) => (
    <div 
        className={`p-3 rounded-xl shadow-lg text-white bg-gradient-to-br ${gradient} flex items-center transition-transform duration-300 ease-in-out hover:scale-105 ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
    >
        <CardIcon>{icon}</CardIcon>
        <div>
            <h3 className="text-xs font-semibold">{title}</h3>
            <p className="text-xl font-bold mt-1">{value}</p>
            {subtext && <p className="text-xs opacity-90">{subtext}</p>}
        </div>
    </div>
);

interface DashboardProps {
    bookings: Booking[];
    rooms: Room[];
    guests: Guest[];
    expenses: Expense[];
    tasks: Task[];
    invoices: Invoice[];
    income: Income[];
    setCurrentPage: (page: Page) => void;
    setFinanceDateFilter: (date: Date | null) => void;
    latestAiBookingId: string | null;
    setLatestAiBookingId: (id: string | null) => void;
    setBookingRoomFilter: (roomId: string | null) => void;
    setRoomStatusFilter: (filter: RoomStatusFilter) => void;
    addBooking: (guestName: string, phone: string, roomNumber: string, checkIn: string, checkOut: string) => Promise<string>;
}

const Dashboard: React.FC<DashboardProps> = ({ bookings, rooms, guests, expenses, tasks, invoices, income, setCurrentPage, setFinanceDateFilter, latestAiBookingId, setLatestAiBookingId, setBookingRoomFilter, setRoomStatusFilter, addBooking }) => {
    
    const { 
        todaysTotalRevenue,
        overdueTasksCount, unpaidInvoicesCount, totalAlerts, alertSubtext,
        availableRooms, occupiedRooms
    } = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of day
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999); // End of day

        const todaysIncome = income.filter(i => {
            const itemDate = new Date(i.date);
            return itemDate >= today && itemDate <= endOfToday;
        });
        const totalRevenue = todaysIncome.reduce((sum, i) => sum + i.amount, 0);

        const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < today && t.status !== 'เสร็จแล้ว').length;
        const unpaidInvoices = invoices.filter(i => i.status === 'ยังไม่ชำระ' && new Date(i.dueDate) < today).length;
        const totalAlerts = overdueTasks + unpaidInvoices;
        
        let subtext = [];
        if (overdueTasks > 0) subtext.push(`${overdueTasks} งานค้าง`);
        if (unpaidInvoices > 0) subtext.push(`${unpaidInvoices} ใบแจ้งหนี้`);
        if (subtext.length === 0) subtext.push('ไม่มีการแจ้งเตือน');

        const dailyRoomIds = new Set(rooms.filter(r => r.status !== 'เช่ารายเดือน').map(r => r.id));

        const currentlyOccupiedRoomIds = new Set<string>();
        bookings.forEach(b => {
             const checkIn = new Date(b.checkInDate);
             const checkOut = new Date(b.checkOutDate);
             if (today >= checkIn && today < checkOut && dailyRoomIds.has(b.roomId)) {
                 currentlyOccupiedRoomIds.add(b.roomId);
             }
        });

        const occupied = currentlyOccupiedRoomIds.size;
        const available = dailyRoomIds.size - occupied;

        const monthlyRentals = rooms.filter(r => r.status === 'เช่ารายเดือน').length;


        return {
            todaysTotalRevenue: totalRevenue,
            overdueTasksCount: overdueTasks,
            unpaidInvoicesCount: unpaidInvoices,
            totalAlerts: totalAlerts,
            alertSubtext: subtext.join(', '),
            availableRooms: available,
            occupiedRooms: occupied + monthlyRentals,
        };
    }, [tasks, invoices, income, rooms, bookings]);
    
    const latestAiBooking = useMemo(() => {
        if (!latestAiBookingId) return null;
        const booking = bookings.find(b => b.id === latestAiBookingId);
        if (!booking) return null;
        const guest = guests.find(g => g.id === booking.guestId);
        const room = rooms.find(r => r.id === booking.roomId);
        if (!guest || !room) return null;
        return { ...booking, guest, room };
    }, [latestAiBookingId, bookings, guests, rooms]);
    
    const handleAlertsClick = () => {
        if (unpaidInvoicesCount > 0) {
            setCurrentPage('ข้อมูลบุคคล');
        } else if (overdueTasksCount > 0) {
            setCurrentPage('การดำเนินงาน');
        }
    };
    
    const handleViewBooking = () => {
        if (latestAiBooking) {
            setBookingRoomFilter(latestAiBooking.roomId);
            setCurrentPage('การดำเนินงาน');
            setLatestAiBookingId(null);
        }
    };

    const handleDismissNotification = () => {
        setLatestAiBookingId(null);
    };

    const handleRevenueClick = () => {
        setFinanceDateFilter(new Date());
        setCurrentPage('การเงิน');
    };

    const handleAvailableRoomsClick = () => {
        setRoomStatusFilter('available');
        setCurrentPage('การดำเนินงาน');
    };
    
    const handleOccupiedRoomsClick = () => {
        setRoomStatusFilter('occupied');
        setCurrentPage('การดำเนินงาน');
    };
    
    const formatCurrency = (amount: number) => '฿' + amount.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    return (
        <div className="space-y-6 animate-fadeInUp">

            {latestAiBooking && (
                <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-800 p-4 rounded-lg shadow-md flex justify-between items-center" role="alert">
                    <div>
                        <p className="font-bold">สร้างการจองใหม่โดย AI สำเร็จ</p>
                        <p>การจองสำหรับคุณ {latestAiBooking.guest.name} ในห้อง {latestAiBooking.room.number} ได้ถูกสร้างขึ้นแล้ว</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button onClick={handleViewBooking} className="font-semibold underline hover:text-blue-900 transition-colors">ดูการจอง</button>
                        <button onClick={handleDismissNotification} className="text-xl font-bold hover:text-blue-900 transition-colors" aria-label="Dismiss">&times;</button>
                    </div>
                </div>
            )}

            {/* Interactive Calendar Section */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg">
                 <InteractiveCalendar 
                    bookings={bookings} 
                    rooms={rooms}
                    guests={guests}
                    setBookingRoomFilter={setBookingRoomFilter}
                    setCurrentPage={setCurrentPage}
                    addBooking={addBooking}
                 />
            </div>
            
            {/* Dashboard Cards Section */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                 <DashboardCard 
                    title="รายรับรวมวันนี้" 
                    value={formatCurrency(todaysTotalRevenue)} 
                    subtext="คลิกเพื่อดูรายละเอียด"
                    gradient="from-blue-500 to-indigo-600"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>}
                    onClick={handleRevenueClick}
                />
                <DashboardCard 
                    title="ห้องว่าง" 
                    value={`${availableRooms} ห้อง`}
                    subtext="พร้อมให้บริการ"
                    gradient="from-green-500 to-emerald-600"
                    icon={<BedIcon className="w-5 h-5" />}
                    onClick={handleAvailableRoomsClick}
                />
                 <DashboardCard 
                    title="ห้องไม่ว่าง" 
                    value={`${occupiedRooms} ห้อง`}
                    subtext="มีการเข้าพัก/เช่า"
                    gradient="from-sky-500 to-cyan-600"
                    icon={<BedIcon className="w-5 h-5" />}
                    onClick={handleOccupiedRoomsClick}
                />
                <DashboardCard 
                    title="แจ้งเตือนสำคัญ" 
                    value={totalAlerts.toString()}
                    subtext={alertSubtext}
                    gradient="from-red-500 to-rose-600"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
                    onClick={handleAlertsClick}
                />
            </div>
        </div>
    );
};

export default Dashboard;
