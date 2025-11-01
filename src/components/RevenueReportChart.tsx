import React, { useState, useMemo } from 'react';
import type { Booking } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RevenueReportChartProps {
    bookings: Booking[];
}

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

const RevenueReportChart: React.FC<RevenueReportChartProps> = ({ bookings }) => {
    const [period, setPeriod] = useState<Period>('monthly');

    const chartData = useMemo(() => {
        const revenueByDate: { [key: string]: number } = {};
        
        // Use check-out date for revenue calculation, consistent with dashboard
        bookings.forEach(booking => {
            if (booking.status === 'เช็คเอาท์' || booking.status === 'เช็คอิน' || booking.status === 'ยืนยันแล้ว') {
                const dateStr = booking.checkOutDate.toISOString().split('T')[0];
                revenueByDate[dateStr] = (revenueByDate[dateStr] || 0) + booking.totalPrice;
            }
        });

        const sortedDates = Object.keys(revenueByDate).sort();
        if (sortedDates.length === 0) return [];

        const aggregatedData: { [key: string]: number } = {};
        
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        switch (period) {
            case 'daily': {
                const thirtyDaysAgo = new Date(today);
                thirtyDaysAgo.setDate(today.getDate() - 29);
                thirtyDaysAgo.setHours(0, 0, 0, 0);

                for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
                    const dateKey = d.toISOString().split('T')[0];
                    const formattedDate = d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' });
                    aggregatedData[formattedDate] = (aggregatedData[formattedDate] || 0) + (revenueByDate[dateKey] || 0);
                }
                break;
            }
            case 'weekly': {
                 const twelveWeeksAgo = new Date(today);
                 twelveWeeksAgo.setDate(today.getDate() - 83); // Approx 12 weeks
                 
                 for (let d = new Date(twelveWeeksAgo); d <= today; d.setDate(d.getDate() + 7)) {
                    const weekStart = new Date(d);
                    weekStart.setDate(d.getDate() - d.getDay()); // Start of week (Sunday)
                    weekStart.setHours(0,0,0,0);
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    weekEnd.setHours(23,59,59,999);

                    const weekKey = `${weekStart.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' })}`;
                    aggregatedData[weekKey] = 0;

                    sortedDates.forEach(dateStr => {
                        const date = new Date(dateStr);
                        if(date >= weekStart && date <= weekEnd) {
                            aggregatedData[weekKey] += revenueByDate[dateStr];
                        }
                    });
                 }
                break;
            }
            case 'monthly': {
                const twelveMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 11, 1);
                for (let i = 0; i < 12; i++) {
                    const monthDate = new Date(twelveMonthsAgo.getFullYear(), twelveMonthsAgo.getMonth() + i, 1);
                    const monthKey = monthDate.toLocaleString('th-TH', { month: 'short', year: '2-digit' });
                    aggregatedData[monthKey] = 0;

                    sortedDates.forEach(dateStr => {
                        const date = new Date(dateStr);
                        if (date.getFullYear() === monthDate.getFullYear() && date.getMonth() === monthDate.getMonth()) {
                            aggregatedData[monthKey] += revenueByDate[dateStr];
                        }
                    });
                }
                break;
            }
            case 'yearly': {
                sortedDates.forEach(dateStr => {
                    const year = new Date(dateStr).getFullYear();
                    const yearKey = (year + 543).toString(); // Thai year
                    aggregatedData[yearKey] = (aggregatedData[yearKey] || 0) + revenueByDate[dateStr];
                });
                break;
            }
        }

        return Object.entries(aggregatedData).map(([name, revenue]) => ({ name, 'รายรับ': revenue }));
    }, [bookings, period]);

    const PeriodButton: React.FC<{ value: Period, label: string }> = ({ value, label }) => (
        <button
            onClick={() => setPeriod(value)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                period === value ? 'bg-blue-600 text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="p-4 bg-white border rounded-2xl shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 sm:mb-0">สรุปภาพรวมรายรับ</h3>
                <div className="flex space-x-2">
                    <PeriodButton value="daily" label="รายวัน" />
                    <PeriodButton value="weekly" label="รายสัปดาห์" />
                    <PeriodButton value="monthly" label="รายเดือน" />
                    <PeriodButton value="yearly" label="รายปี" />
                </div>
            </div>
            <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 12 }} />
                        <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(value: number) => `฿${(value / 1000).toFixed(0)}k`} />
                        <Tooltip
                            contentStyle={{ borderRadius: '0.75rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            formatter={(value: number) => [value.toLocaleString('th-TH', { style: 'currency', currency: 'THB' }), 'รายรับ']}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Line type="monotone" dataKey="รายรับ" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default RevenueReportChart;
