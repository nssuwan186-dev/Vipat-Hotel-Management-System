import React, { useMemo } from 'react';
import type { Page, Booking, Room, Expense } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CardIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="mr-4 p-3 bg-white/20 rounded-full">{children}</div>
);

const DashboardCard: React.FC<{ title: string; value: string; subtext: string; gradient: string; icon: React.ReactNode }> = ({ title, value, subtext, gradient, icon }) => (
    <div className={`p-5 rounded-2xl shadow-lg text-white bg-gradient-to-br ${gradient} flex items-center`}>
        <CardIcon>{icon}</CardIcon>
        <div>
            <h3 className="text-md font-semibold">{title}</h3>
            <p className="text-3xl font-bold mt-1">{value}</p>
            <p className="text-sm opacity-90">{subtext}</p>
        </div>
    </div>
);

// Add DashboardProps interface to fix missing type error
interface DashboardProps {
    bookings: Booking[];
    rooms: Room[];
    expenses: Expense[];
    setCurrentPage: (page: Page) => void;
    setFinanceDateFilter: (date: Date | null) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ bookings, rooms, expenses, setCurrentPage, setFinanceDateFilter }) => {
    const today = new Date();
    today.setHours(0,0,0,0);

    const { todaysRevenue, todaysCheckIns, todaysCheckOuts, availableRooms, occupiedRooms, totalRooms } = useMemo(() => {
        const revenue = bookings
            .filter(b => {
                const checkOutDate = new Date(b.checkOutDate);
                checkOutDate.setHours(0,0,0,0);
                // Assumption: Revenue is counted on check-out day.
                // Alternative: Count revenue on check-in day or spread over stay duration.
                // For simplicity, we'll stick to check-out day.
                return checkOutDate.getTime() === today.getTime() && (b.status === 'Check-Out');
            })
            .reduce((acc, b) => acc + b.totalPrice, 0);

        return {
            todaysRevenue: '฿' + revenue.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            todaysCheckIns: bookings.filter(b => new Date(b.checkInDate).toDateString() === today.toDateString() && (b.status === 'Check-In' || b.status === 'Confirmed')).length,
            todaysCheckOuts: bookings.filter(b => new Date(b.checkOutDate).toDateString() === today.toDateString() && b.status !== 'Cancelled').length,
            availableRooms: rooms.filter(r => r.status === 'Available').length,
            occupiedRooms: rooms.filter(r => r.status === 'Occupied' || r.status === 'Monthly Rental').length,
            totalRooms: rooms.length,
        };
    }, [bookings, rooms]);
    
    const weeklyChartData = useMemo(() => {
        const data = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dayStr = date.toLocaleDateString('th-TH', { weekday: 'short' });
            
            const dailyRevenue = bookings
                .filter(b => {
                    const checkIn = new Date(b.checkInDate);
                    const checkOut = new Date(b.checkOutDate);
                    return checkIn <= date && date < checkOut;
                })
                .reduce((sum, b) => {
                    const duration = (b.checkOutDate.getTime() - b.checkInDate.getTime()) / (1000 * 3600 * 24);
                    return sum + b.totalPrice / (duration || 1);
                }, 0);
                
            data.push({ name: dayStr, 'รายรับ': Math.round(dailyRevenue), date: date });
        }
        return data;
    }, [bookings]);

    const handleBarClick = (data: any) => {
        if (data && data.date) {
            setFinanceDateFilter(data.date);
            setCurrentPage('การเงิน');
        }
    };


    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
                    value="2" 
                    subtext="รอชำระเงิน" 
                    gradient="from-red-500 to-rose-600"
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
                />
            </div>
            
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">สรุปรายรับรายสัปดาห์</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart data={weeklyChartData}>
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
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar dataKey="รายรับ" fill="#3B82F6" barSize={30} radius={[8, 8, 0, 0]} name="รายรับ" onClick={handleBarClick} style={{ cursor: 'pointer' }} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;