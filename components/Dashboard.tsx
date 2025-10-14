import React, { useMemo, useState } from 'react';
import type { Page, Booking, Room, Expense, Task, Invoice, Guest } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CardIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="mr-3 p-2 bg-white/20 rounded-full">{children}</div>
);

const DashboardCard: React.FC<{ title: string; value: string; subtext: string; gradient: string; icon: React.ReactNode, onClick?: () => void }> = ({ title, value, subtext, gradient, icon, onClick }) => (
    <div 
        className={`p-4 rounded-2xl shadow-lg text-white bg-gradient-to-br ${gradient} flex items-center transition-transform duration-300 ease-in-out hover:scale-105 ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
    >
        <CardIcon>{icon}</CardIcon>
        <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <p className="text-xs opacity-90">{subtext}</p>
        </div>
    </div>
);

// Add DashboardProps interface to fix missing type error
interface DashboardProps {
    bookings: Booking[];
    rooms: Room[];
    guests: Guest[];
    expenses: Expense[];
    tasks: Task[];
    invoices: Invoice[];
    setCurrentPage: (page: Page) => void;
    setFinanceDateFilter: (date: Date | null) => void;
    latestAiBookingId: string | null;
    setLatestAiBookingId: (id: string | null) => void;
    setBookingRoomFilter: (roomId: string | null) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ bookings, rooms, guests, expenses, tasks, invoices, setCurrentPage, setFinanceDateFilter, latestAiBookingId, setLatestAiBookingId, setBookingRoomFilter }) => {
    const today = new Date();
    today.setHours(0,0,0,0);

    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');

    const { 
        todaysRevenue, todaysCheckIns, todaysCheckOuts, 
        availableRooms, occupiedRooms, totalRooms,
        overdueTasksCount, unpaidInvoicesCount, totalAlerts, alertSubtext 
    } = useMemo(() => {
        const revenue = bookings
            .filter(b => {
                const checkOutDate = new Date(b.checkOutDate);
                checkOutDate.setHours(0,0,0,0);
                return checkOutDate.getTime() === today.getTime() && (b.status === 'Check-Out');
            })
            .reduce((acc, b) => acc + b.totalPrice, 0);

        const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < today && t.status !== 'Done').length;
        const unpaidInvoices = invoices.filter(i => i.status === 'Unpaid').length;
        const totalAlerts = overdueTasks + unpaidInvoices;
        
        let subtext = [];
        if (overdueTasks > 0) subtext.push(`${overdueTasks} งานค้าง`);
        if (unpaidInvoices > 0) subtext.push(`${unpaidInvoices} ใบแจ้งหนี้`);
        if (subtext.length === 0) subtext.push('ไม่มีการแจ้งเตือน');

        return {
            todaysRevenue: '฿' + revenue.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            todaysCheckIns: bookings.filter(b => new Date(b.checkInDate).toDateString() === today.toDateString() && (b.status === 'Check-In' || b.status === 'Confirmed')).length,
            todaysCheckOuts: bookings.filter(b => new Date(b.checkOutDate).toDateString() === today.toDateString() && b.status !== 'Cancelled').length,
            availableRooms: rooms.filter(r => r.status === 'Available').length,
            occupiedRooms: rooms.filter(r => r.status === 'Occupied' || r.status === 'Monthly Rental').length,
            totalRooms: rooms.length,
            overdueTasksCount: overdueTasks,
            unpaidInvoicesCount: unpaidInvoices,
            totalAlerts: totalAlerts,
            alertSubtext: subtext.join(', '),
        };
    }, [bookings, rooms, tasks, invoices]);
    
    const latestAiBooking = useMemo(() => {
        if (!latestAiBookingId) return null;
        const booking = bookings.find(b => b.id === latestAiBookingId);
        if (!booking) return null;
        const guest = guests.find(g => g.id === booking.guestId);
        const room = rooms.find(r => r.id === booking.roomId);
        if (!guest || !room) return null;
        return { ...booking, guest, room };
    }, [latestAiBookingId, bookings, guests, rooms]);

    const chartData = useMemo(() => {
        const revenueByDate: { [key: string]: number } = {};
        bookings.forEach(b => {
            const duration = Math.ceil((new Date(b.checkOutDate).getTime() - new Date(b.checkInDate).getTime()) / (1000 * 3600 * 24)) || 1;
            const dailyRate = b.totalPrice / duration;
            
            for (let d = new Date(b.checkInDate); d < new Date(b.checkOutDate); d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                revenueByDate[dateStr] = (revenueByDate[dateStr] || 0) + dailyRate;
            }
        });

        const result: { name: string; 'รายรับ': number; date: Date }[] = [];
        const todayForCalc = new Date();
        todayForCalc.setHours(0,0,0,0);

        switch (period) {
            case 'daily': {
                for (let i = 29; i >= 0; i--) {
                    const date = new Date(todayForCalc);
                    date.setDate(todayForCalc.getDate() - i);
                    const dateStr = date.toISOString().split('T')[0];
                    const name = date.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' });
                    result.push({ name, 'รายรับ': Math.round(revenueByDate[dateStr] || 0), date });
                }
                return result;
            }
            case 'weekly': {
                for (let i = 11; i >= 0; i--) {
                    const weekStartDate = new Date(todayForCalc);
                    // Set to the Sunday of the week `i` weeks ago
                    weekStartDate.setDate(todayForCalc.getDate() - (i * 7) - todayForCalc.getDay());
                    
                    let weeklyRevenue = 0;
                    for (let j = 0; j < 7; j++) {
                        const date = new Date(weekStartDate);
                        date.setDate(weekStartDate.getDate() + j);
                        const dateStr = date.toISOString().split('T')[0];
                        weeklyRevenue += revenueByDate[dateStr] || 0;
                    }
                    
                    const name = `สัปดาห์ที่ ${weekStartDate.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' })}`;
                    result.push({ name, 'รายรับ': Math.round(weeklyRevenue), date: weekStartDate });
                }
                return result;
            }
            case 'monthly': {
                for (let i = 11; i >= 0; i--) {
                    const date = new Date(todayForCalc.getFullYear(), todayForCalc.getMonth() - i, 1);
                    const year = date.getFullYear();
                    const month = date.getMonth();
                    const name = date.toLocaleString('th-TH', { month: 'short', year: '2-digit' });
                    
                    let monthlyRevenue = 0;
                    for (const dateStr in revenueByDate) {
                        const d = new Date(dateStr);
                        if (d.getFullYear() === year && d.getMonth() === month) {
                            monthlyRevenue += revenueByDate[dateStr];
                        }
                    }
                    result.push({ name, 'รายรับ': Math.round(monthlyRevenue), date });
                }
                return result;
            }
            case 'yearly': {
                const yearlyRevenue: { [key: string]: number } = {};
                for (const dateStr in revenueByDate) {
                    const year = new Date(dateStr).getFullYear();
                    yearlyRevenue[year] = (yearlyRevenue[year] || 0) + revenueByDate[dateStr];
                }
                
                return Object.entries(yearlyRevenue).sort(([yearA], [yearB]) => parseInt(yearA) - parseInt(yearB)).map(([year, revenue]) => ({
                    name: (parseInt(year) + 543).toString(),
                    'รายรับ': Math.round(revenue),
                    date: new Date(parseInt(year), 0, 1)
                }));
            }
        }
    }, [bookings, period]);

    const handleBarClick = (data: any) => {
        if (data && data.date) {
            setFinanceDateFilter(data.date);
            setCurrentPage('การเงิน');
        }
    };

    const handleAlertsClick = () => {
        if (unpaidInvoicesCount > 0) {
            setCurrentPage('ลูกค้า');
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
            <div className="grid grid-cols-2 gap-4">
                <DashboardCard 
                    title="รายรับวันนี้" 
                    value={todaysRevenue} 
                    subtext="เงินสด + โอน" 
                    gradient="from-blue-500 to-indigo-600"
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>} 
                />
                <DashboardCard 
                    title="การจองวันนี้" 
                    value={`${todaysCheckIns} / ${todaysCheckOuts}`} 
                    subtext="เช็คอิน / เช็คเอาท์" 
                    gradient="from-green-500 to-emerald-600"
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                />
                <DashboardCard 
                    title="สถานะห้องพัก" 
                    value={`${occupiedRooms} / ${totalRooms}`} 
                    subtext="ห้องพักที่มีผู้เข้าพัก" 
                    gradient="from-yellow-500 to-amber-600"
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                />
                <DashboardCard 
                    title="แจ้งเตือนสำคัญ" 
                    value={totalAlerts.toString()}
                    subtext={alertSubtext}
                    gradient="from-red-500 to-rose-600"
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
                    onClick={handleAlertsClick}
                />
            </div>
            
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                     <h3 className="text-xl font-semibold text-gray-800 mb-3 sm:mb-0">สรุปรายรับ</h3>
                     <div className="relative">
                         <select
                             value={period}
                             onChange={(e) => setPeriod(e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly')}
                             className="appearance-none w-full sm:w-auto bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
                             aria-label="Select time period for revenue chart"
                         >
                             <option value="daily">รายวัน</option>
                             <option value="weekly">รายสัปดาห์</option>
                             <option value="monthly">รายเดือน</option>
                             <option value="yearly">รายปี</option>
                         </select>
                         <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                             <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                         </div>
                     </div>
                </div>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fill: '#6B7280' }} />
                            <YAxis tick={{ fill: '#6B7280' }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '0.75rem',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                                labelStyle={{ fontWeight: 'bold', color: '#1F2937' }}
                                formatter={(value: number) => [value.toLocaleString('th-TH'), 'รายรับ']}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar dataKey="รายรับ" fill="#3B82F6" barSize={30} radius={[8, 8, 0, 0]} name="รายรับ" onClick={(data) => handleBarClick(data.payload)} style={{ cursor: 'pointer' }} animationDuration={800} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;