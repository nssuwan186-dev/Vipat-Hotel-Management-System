import React, { useState } from 'react';
import type { Booking, Room, Guest, Tenant, Employee, Expense, Income, Invoice, GeneratedDocument, SheetData } from '../types';
import RevenueReportChart from './RevenueReportChart';

interface ReportsProps {
    bookings: Booking[];
    rooms: Room[];
    guests: Guest[];
    tenants: Tenant[];
    employees: Employee[];
    expenses: Expense[];
    income: Income[];
    invoices: Invoice[];
    documents: GeneratedDocument[];
}

const Reports: React.FC<ReportsProps> = ({ bookings, rooms, guests, tenants, employees, expenses, income, invoices, documents }) => {
    
    // Note: Google Sheets export functionality has been removed as it requires a backend service.
    // This component now focuses on client-side reporting.

    return (
        <div className="space-y-6">
            <RevenueReportChart bookings={bookings} />

            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">ส่งออกข้อมูล</h3>
                <p className="text-gray-600 mb-6">ฟังก์ชันการส่งออกข้อมูลไปยัง Google Sheets ถูกปิดใช้งานในเวอร์ชันนี้</p>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">เอกสารที่สร้างโดย AI</h3>
                 {documents.length > 0 ? (
                    <div className="space-y-3">
                        {documents.map((doc, index) => (
                            <div key={index} className="p-3 border rounded-lg">
                                <h4 className="font-semibold">{doc.title} ({doc.type})</h4>
                                <button className="text-sm text-blue-600 hover:underline mt-1">ดูเอกสาร</button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 italic">ยังไม่มีเอกสารที่สร้างโดย AI</p>
                )}
            </div>
        </div>
    );
};

export default Reports;
