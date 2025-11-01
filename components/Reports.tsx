import React, { useState } from 'react';
import type { Booking, Room, Guest, Tenant, Employee, Expense, Income, Invoice, GeneratedDocument, SheetData } from '../types';
import RevenueReportChart from './RevenueReportChart';
import { exportToGoogleSheets } from '../services/googleApiService';

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
    const [exportStatus, setExportStatus] = useState<{ loading: boolean, message: string, url?: string }>({ loading: false, message: '' });

    const handleExport = async (dataType: string) => {
        setExportStatus({ loading: true, message: `กำลังส่งออกข้อมูล ${dataType}...`, url: '' });

        let sheets: SheetData[] = [];
        const spreadsheetName = `VIPAT_HMS_Export_${dataType}_${new Date().toISOString().split('T')[0]}`;
        
        try {
            switch (dataType) {
                case 'Financials':
                    sheets = [
                        {
                            sheetName: 'รายรับ',
                            headers: ['ID', 'วันที่', 'รายละเอียด', 'ช่องทาง', 'จำนวนเงิน'],
                            data: income.map(i => [i.id, i.date, i.description, i.paymentMethod, i.amount])
                        },
                        {
                            sheetName: 'รายจ่าย',
                            headers: ['ID', 'วันที่', 'หมวดหมู่', 'รายละเอียด', 'จำนวนเงิน'],
                            data: expenses.map(e => [e.id, e.date, e.category, e.description, e.amount])
                        }
                    ];
                    break;
                case 'Bookings':
                    sheets = [{
                        sheetName: 'การจองทั้งหมด',
                        headers: ['ID การจอง', 'ชื่อแขก', 'เบอร์โทร', 'ห้อง', 'เช็คอิน', 'เช็คเอาท์', 'ราคา', 'สถานะ'],
                        data: bookings.map(b => {
                            const guest = guests.find(g => g.id === b.guestId);
                            const room = rooms.find(r => r.id === b.roomId);
                            return [b.id, guest?.name || '', guest?.phone || '', room?.number || '', b.checkInDate, b.checkOutDate, b.totalPrice, b.status];
                        })
                    }];
                    break;
                 case 'Personnel':
                    sheets = [
                        {
                            sheetName: 'พนักงาน',
                            headers: ['ID', 'ชื่อ', 'ตำแหน่ง', 'วันที่เริ่มงาน', 'สถานะ', 'ประเภทเงินเดือน', 'อัตรา'],
                            data: employees.map(e => [e.id, e.name, e.position, e.hireDate, e.status, e.salaryType, e.salaryRate])
                        },
                        {
                            sheetName: 'ผู้เช่ารายเดือน',
                            headers: ['ID', 'ชื่อ', 'เบอร์โทร', 'ห้อง', 'ค่าเช่า', 'วันเริ่มสัญญา', 'วันสิ้นสุดสัญญา'],
                            data: tenants.map(t => {
                                const room = rooms.find(r => r.id === t.roomId);
                                return [t.id, t.name, t.phone, room?.number || '', t.monthlyRent, t.contractStartDate, t.contractEndDate];
                            })
                        }
                    ];
                    break;
                default:
                    throw new Error("Invalid data type for export");
            }

            const result = await exportToGoogleSheets({ spreadsheetName, sheets });
            
            if(result.success && result.data?.sheetUrl) {
                setExportStatus({ loading: false, message: `ส่งออกข้อมูลสำเร็จ!`, url: result.data.sheetUrl });
            } else {
                setExportStatus({ loading: false, message: `เกิดข้อผิดพลาด: ${result.error || 'Unknown error'}`, url: '' });
            }

        } catch (error: any) {
            setExportStatus({ loading: false, message: `เกิดข้อผิดพลาดในการส่งออก: ${error.message}`, url: '' });
        }
    };
    
    const ExportCard: React.FC<{ title: string, description: string, dataType: string }> = ({ title, description, dataType }) => (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
                <h4 className="font-semibold text-gray-800">{title}</h4>
                <p className="text-sm text-gray-600 mt-1">{description}</p>
            </div>
            <button
                onClick={() => handleExport(dataType)}
                disabled={exportStatus.loading}
                className="mt-3 sm:mt-0 px-4 py-2 bg-gray-700 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:bg-gray-400 shrink-0"
            >
                ส่งออก
            </button>
        </div>
    );

    return (
        <div className="space-y-6">
            <RevenueReportChart bookings={bookings} />

            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">ส่งออกข้อมูล</h3>
                <p className="text-gray-600 mb-6">เลือกชุดข้อมูลที่ต้องการส่งออกเป็น Google Sheet ใน Google Drive ของคุณ</p>
                
                {exportStatus.message && (
                    <div className={`p-4 mb-6 rounded-lg text-sm ${exportStatus.url ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
                        {exportStatus.message}
                        {exportStatus.url && (
                            <a href={exportStatus.url} target="_blank" rel="noopener noreferrer" className="font-bold underline ml-2">เปิดไฟล์</a>
                        )}
                         {exportStatus.loading && (
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                <div className="bg-blue-600 h-1.5 rounded-full animate-pulse"></div>
                            </div>
                        )}
                    </div>
                )}

                <div className="space-y-4">
                    <ExportCard title="ข้อมูลการเงิน" description="ส่งออกรายการรับ-จ่ายทั้งหมด" dataType="Financials" />
                    <ExportCard title="ข้อมูลการจอง" description="ส่งออกประวัติการจองทั้งหมดพร้อมข้อมูลแขก" dataType="Bookings" />
                    <ExportCard title="ข้อมูลบุคคล" description="ส่งออกข้อมูลพนักงานและผู้เช่ารายเดือน" dataType="Personnel" />
                </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">เอกสารที่สร้างโดย AI</h3>
                 {documents.length > 0 ? (
                    <div className="space-y-3">
                        {documents.map((doc, index) => (
                            <div key={index} className="p-3 border rounded-lg">
                                <h4 className="font-semibold">{doc.title} ({doc.type})</h4>
                                {/* In a real app, you'd have a button to view/print the doc.content (HTML) */}
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
