import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Booking, Expense, Room, Employee, Tenant, GeneratedDocument, Attendance, Guest, MultiSheetExportPayload, SheetExportData } from '../types';
import { exportToGoogleSheets } from '../services/googleApiService';
import { DocumentIcon } from './icons/Icons';
import { generateReceiptHtml, generateTaxInvoiceHtml } from '../services/documentService';
import RevenueReportChart from './RevenueReportChart';

interface ReportsProps {
    bookings: Booking[];
    guests: Guest[];
    expenses: Expense[];
    rooms: Room[];
    employees: Employee[];
    tenants: Tenant[];
    documents: GeneratedDocument[];
    attendance: Attendance[];
    addDocument: (docType: GeneratedDocument['type'], title: string, content: string) => string;
}

const Reports: React.FC<ReportsProps> = ({ bookings, guests, expenses, rooms, employees, tenants, documents, attendance, addDocument }) => {
    const [activeTab, setActiveTab] = useState('สรุปรายได้');
    const [selectedDoc, setSelectedDoc] = useState<GeneratedDocument | null>(null);
    const [exportMessage, setExportMessage] = useState<{ type: 'success' | 'error', text: string, url?: string } | null>(null);
    const [isExporting, setIsExporting] = useState<string | null>(null);
    const [isExportingAll, setIsExportingAll] = useState(false);
    
    // State for document generator
    const [generatorMessage, setGeneratorMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [selectedBookingId, setSelectedBookingId] = useState<string>('');
    const [amount, setAmount] = useState<string>('');

    // State for document filtering
    const [docSearch, setDocSearch] = useState('');
    const [docTypeFilter, setDocTypeFilter] = useState('All');
    const [docDateFilter, setDocDateFilter] = useState({ start: '', end: '' });

    const iframeRef = useRef<HTMLIFrameElement>(null);

    const tabs = ['สรุปรายได้', 'เอกสารที่สร้าง', 'เครื่องมือส่งออก'];

    useEffect(() => {
        if (selectedBookingId) {
            const booking = bookings.find(b => b.id === selectedBookingId);
            if (booking) {
                setAmount(booking.totalPrice.toString());
            }
        } else {
            setAmount('');
        }
    }, [selectedBookingId, bookings]);

    const documentTypes: GeneratedDocument['type'][] = ['Invoice', 'Booking Confirmation', 'Employee Contract', 'Guest Welcome Letter', 'Lost and Found Notice', 'Maintenance Request', 'Receipt', 'Tax Invoice'];

    const filteredDocuments = useMemo(() => {
        return documents
            .filter(doc => {
                const docDate = new Date(doc.createdAt);
                docDate.setHours(0,0,0,0);
                const startDate = docDateFilter.start ? new Date(docDateFilter.start) : null;
                if(startDate) startDate.setHours(0,0,0,0);
                const endDate = docDateFilter.end ? new Date(docDateFilter.end) : null;
                if(endDate) endDate.setHours(23,59,59,999);

                const matchesSearch = doc.title.toLowerCase().includes(docSearch.toLowerCase());
                const matchesType = docTypeFilter === 'All' || doc.type === docTypeFilter;
                const matchesDate = (!startDate || docDate >= startDate) && (!endDate || docDate <= endDate);

                return matchesSearch && matchesType && matchesDate;
            })
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }, [documents, docSearch, docTypeFilter, docDateFilter]);
    
    const payrollDataForExport = useMemo(() => {
        const today = new Date();
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthYear = lastMonth.getFullYear();
        const lastMonthIndex = lastMonth.getMonth();

        return employees
            .filter(e => e.status === 'Active')
            .map(emp => {
                const empAttendance = attendance.filter(a => 
                    a.employeeId === emp.id &&
                    new Date(a.date).getFullYear() === lastMonthYear &&
                    new Date(a.date).getMonth() === lastMonthIndex
                );
                const presentDays = empAttendance.filter(a => a.status === 'Present').length;
                
                let calculatedPay = 0;
                let attendanceDetail = '-';
                if (emp.salaryType === 'Monthly') {
                    calculatedPay = emp.salaryRate;
                    attendanceDetail = `รายเดือน (${emp.salaryRate.toLocaleString()})`;
                } else {
                    calculatedPay = emp.salaryRate * presentDays;
                    attendanceDetail = `มาทำงาน ${presentDays} วัน (อัตรา: ${emp.salaryRate.toLocaleString()})`;
                }
            
                return [
                    emp.name,
                    emp.position,
                    emp.salaryType === 'Monthly' ? 'รายเดือน' : 'รายวัน',
                    attendanceDetail,
                    calculatedPay
                ];
        });
    }, [employees, attendance]);


    const exportConfigs = useMemo(() => [
        { 
            label: 'ส่งออกข้อมูลการจอง',
            type: 'bookings',
            title: 'Bookings Report',
            headers: ['ID', 'Guest ID', 'Guest Name', 'Room ID', 'Room Number', 'Check-In', 'Check-Out', 'Status', 'Total Price'],
            data: bookings.map(b => {
                const guest = guests.find(g => g.id === b.guestId);
                const room = rooms.find(r => r.id === b.roomId);
                return [
                    b.id,
                    b.guestId,
                    guest?.name || 'N/A',
                    b.roomId,
                    room?.number || 'N/A',
                    b.checkInDate.toISOString().split('T')[0],
                    b.checkOutDate.toISOString().split('T')[0],
                    b.status,
                    b.totalPrice
                ];
            })
        },
        {
            label: 'ส่งออกข้อมูลรายจ่าย',
            type: 'expenses',
            title: 'Expenses Report',
            headers: ['ID', 'Date', 'Category', 'Description', 'Amount'],
            data: expenses.map(e => [e.id, e.date.toISOString().split('T')[0], e.category, e.description, e.amount])
        },
        {
            label: 'ส่งออกสถานะห้องพัก',
            type: 'rooms',
            title: 'Room Status Report',
            headers: ['Number', 'Type', 'Price', 'Status'],
            data: rooms.map(r => [r.number, r.type, r.price, r.status])
        },
        {
            label: 'ส่งออกข้อมูลเงินเดือน',
            type: 'payroll',
            title: 'Payroll Report',
            headers: ['ชื่อพนักงาน', 'ตำแหน่ง', 'ประเภทเงินเดือน', 'การเข้างาน', 'เงินเดือน (บาท)'],
            data: payrollDataForExport
        },
    ], [bookings, guests, rooms, expenses, payrollDataForExport]);


    const handleExport = async (type: string, data: any[], headers: string[], title: string) => {
        const timestamp = new Date().toLocaleString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
        const sheetTitleWithTimestamp = `${title} (${timestamp})`;
        setIsExporting(title);
        setExportMessage(null);
        
        const exportPayload: MultiSheetExportPayload = {
            sheets: [{
                sheetTitle: sheetTitleWithTimestamp,
                headers: headers,
                rows: data,
            }]
        };

        const result = await exportToGoogleSheets(exportPayload);
        
        if (result.success && result.sheetUrl) {
            setExportMessage({ type: 'success', text: result.message, url: result.sheetUrl });
        } else {
            setExportMessage({ type: 'error', text: `เกิดข้อผิดพลาด: ${result.message}` });
        }
        setIsExporting(null);
    };

    const handleExportAll = async () => {
        setIsExportingAll(true);
        setExportMessage(null);

        const sheetsData: SheetExportData[] = exportConfigs.map(config => {
            const timestamp = new Date().toLocaleString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
            return {
                sheetTitle: `${config.title} (${timestamp})`,
                headers: config.headers,
                rows: config.data,
            };
        });
        
        const exportPayload: MultiSheetExportPayload = { sheets: sheetsData };
        const result = await exportToGoogleSheets(exportPayload);

        if (result.success && result.sheetUrl) {
            setExportMessage({ type: 'success', text: 'ส่งออกรายงานทั้งหมดสำเร็จแล้ว', url: result.sheetUrl });
        } else {
            setExportMessage({ type: 'error', text: `เกิดข้อผิดพลาด: ${result.message}` });
        }
        
        setIsExportingAll(false);
    };

    const handleGenerateDoc = async (docType: 'Receipt' | 'Tax Invoice') => {
        if (!selectedBookingId || !amount) {
            setGeneratorMessage({ type: 'error', text: 'กรุณาเลือกการจองและระบุจำนวนเงิน' });
            return;
        }

        const booking = bookings.find(b => b.id === selectedBookingId);
        const guest = guests.find(g => g.id === booking?.guestId);
        const room = rooms.find(r => r.id === booking?.roomId);
        const totalAmount = parseFloat(amount);

        if (!booking || !guest || !room || isNaN(totalAmount)) {
            setGeneratorMessage({ type: 'error', text: 'ข้อมูลการจองไม่สมบูรณ์ ไม่สามารถสร้างเอกสารได้' });
            return;
        }
        
        setGeneratorMessage(null);

        try {
            let htmlContent: string;
            let title: string;

            if (docType === 'Receipt') {
                htmlContent = await generateReceiptHtml({ booking, guest, room, totalAmount });
                title = `ใบเสร็จสำหรับคุณ ${guest.name} (${booking.id})`;
            } else {
                htmlContent = await generateTaxInvoiceHtml({ booking, guest, room, totalAmount });
                title = `ใบกำกับภาษีสำหรับคุณ ${guest.name} (${booking.id})`;
            }
            
            const result = addDocument(docType, title, htmlContent);
            setGeneratorMessage({ type: 'success', text: result });
            setSelectedBookingId(''); // Reset form
            
        } catch (error: any) {
            setGeneratorMessage({ type: 'error', text: `เกิดข้อผิดพลาด: ${error.message}` });
        }
    };

    const handlePrint = () => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.focus();
            iframeRef.current.contentWindow.print();
        }
    };


    const renderTabContent = () => {
        switch (activeTab) {
            case 'สรุปรายได้':
                return <RevenueReportChart bookings={bookings} />;

            case 'เอกสารที่สร้าง':
                return (
                    <div>
                        <div className="p-4 mb-6 bg-gray-50 rounded-xl border">
                            <h4 className="font-semibold text-gray-700 mb-3">ตัวกรองเอกสาร</h4>
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex-grow min-w-[200px] sm:min-w-[250px]">
                                    <label htmlFor="doc-search" className="sr-only">ค้นหาตามชื่อ</label>
                                    <input 
                                        id="doc-search" type="text" placeholder="ค้นหาตามชื่อเอกสาร..." value={docSearch} 
                                        onChange={e => setDocSearch(e.target.value)} 
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="min-w-[180px]">
                                    <label htmlFor="doc-type" className="sr-only">ประเภทเอกสาร</label>
                                    <select 
                                        id="doc-type" value={docTypeFilter} onChange={e => setDocTypeFilter(e.target.value)} 
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="All">เอกสารทุกประเภท</option>
                                        {documentTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <label htmlFor="doc-date-start" className="text-sm text-gray-600 shrink-0">วันที่สร้าง:</label>
                                    <input id="doc-date-start" type="date" value={docDateFilter.start} onChange={e => setDocDateFilter({...docDateFilter, start: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"/>
                                    <span className="text-gray-500">-</span>
                                    <input id="doc-date-end" type="date" value={docDateFilter.end} onChange={e => setDocDateFilter({...docDateFilter, end: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"/>
                                </div>
                            </div>
                        </div>

                        {filteredDocuments.length > 0 ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredDocuments.map(doc => (
                                    <div key={doc.id} className="p-4 bg-white rounded-lg border flex flex-col justify-between transition hover:shadow-md hover:border-blue-300">
                                        <div className="flex items-start">
                                            <DocumentIcon className="w-8 h-8 mr-4 text-blue-500 flex-shrink-0 mt-1" />
                                            <div>
                                                <p className="font-semibold text-gray-800 break-words leading-tight">{doc.title}</p>
                                                <p className="text-sm text-gray-500">{doc.type}</p>
                                                <p className="text-xs text-gray-400 mt-1">สร้างเมื่อ: {new Date(doc.createdAt).toLocaleDateString('th-TH')}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setSelectedDoc(doc)} 
                                            className="mt-4 w-full px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                                        >
                                            ดูตัวอย่าง
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-gray-50 rounded-lg">
                                <DocumentIcon className="w-12 h-12 mx-auto text-gray-400" />
                                <h4 className="mt-2 text-lg font-medium text-gray-700">ไม่พบเอกสาร</h4>
                                <p className="text-gray-500">ไม่พบเอกสารที่ตรงกับเงื่อนไขการค้นหาของคุณ</p>
                            </div>
                        )}
                    </div>
                );
            case 'เครื่องมือส่งออก':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="p-4 border rounded-lg bg-white">
                            <h3 className="text-lg font-semibold mb-4 text-gray-700">สร้างเอกสารการเงิน</h3>
                            {generatorMessage && (
                                <div className={`p-3 mb-4 rounded-lg text-sm ${generatorMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {generatorMessage.text}
                                </div>
                            )}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">เลือกการจอง</label>
                                    <select
                                        value={selectedBookingId}
                                        onChange={(e) => setSelectedBookingId(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">-- กรุณาเลือก --</option>
                                        {bookings.sort((a, b) => b.checkInDate.getTime() - a.checkInDate.getTime()).map(b => {
                                            const guest = guests.find(g => g.id === b.guestId);
                                            const room = rooms.find(r => r.id === b.roomId);
                                            return <option key={b.id} value={b.id}>
                                                {`ID: ${b.id} - ${guest?.name} (ห้อง ${room?.number})`}
                                            </option>
                                        })}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">จำนวนเงิน (บาท)</label>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="flex space-x-3 mt-4">
                                <button
                                    onClick={() => handleGenerateDoc('Receipt')}
                                    disabled={!selectedBookingId}
                                    className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-gray-400"
                                >
                                    สร้างใบเสร็จ
                                </button>
                                <button
                                    onClick={() => handleGenerateDoc('Tax Invoice')}
                                    disabled={!selectedBookingId}
                                    className="px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700 disabled:bg-gray-400"
                                >
                                    สร้างใบกำกับภาษี
                                </button>
                            </div>
                        </div>

                        <div className="p-4 border rounded-lg bg-white">
                            <h3 className="text-lg font-semibold mb-4 text-gray-700">ส่งออกข้อมูลไปยัง Google Sheets</h3>
                            {exportMessage && (
                                <div className={`p-3 mb-4 rounded-lg text-sm ${exportMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    <p className="font-semibold">{exportMessage.type === 'success' ? 'สำเร็จ!' : 'ข้อผิดพลาด'}</p>
                                    <p>
                                        {exportMessage.text}
                                        {exportMessage.url && (
                                            <>
                                                {' '}
                                                <a href={exportMessage.url} target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-green-900">
                                                    สามารถดูได้ที่นี่
                                                </a>
                                            </>
                                        )}
                                    </p>
                                </div>
                            )}
                            <button
                                onClick={handleExportAll}
                                disabled={isExportingAll || !!isExporting}
                                className="w-full mb-4 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-wait flex items-center justify-center transition-colors"
                            >
                                {isExportingAll ? 'กำลังส่งออกทั้งหมด...' : 'ส่งออกรายงานทั้งหมด'}
                            </button>
                            <div className="space-y-3">
                                {exportConfigs.map(config => (
                                    <button
                                        key={config.type}
                                        onClick={() => handleExport(config.type, config.data, config.headers, config.title)}
                                        disabled={isExportingAll || !!isExporting}
                                        className="w-full text-left p-4 bg-white border border-gray-200 rounded-lg flex items-center justify-between hover:bg-gray-50 disabled:opacity-50 disabled:cursor-wait transition-colors"
                                    >
                                        <span className="font-medium text-gray-700">{config.label}</span>
                                        <span className="text-sm text-gray-500">
                                            {isExporting === config.title ? 'กำลังส่งออก...' : `(${config.data.length} รายการ)`}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg">
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                    activeTab === tab
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>
                <div>{renderTabContent()}</div>
            </div>

            {selectedDoc && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedDoc(null)}>
                    <div className="bg-white p-6 rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                         <div className="flex justify-between items-center mb-4 pb-4 border-b">
                            <h2 className="text-xl font-bold text-gray-800">{selectedDoc.title}</h2>
                            <button onClick={() => setSelectedDoc(null)} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                         </div>
                         <div className="overflow-y-auto flex-1">
                            {selectedDoc.type === 'Tax Invoice' || selectedDoc.type === 'Receipt' ? (
                                <iframe 
                                    ref={iframeRef}
                                    srcDoc={selectedDoc.content} 
                                    title={selectedDoc.title}
                                    className="w-full h-full border-0"
                                />
                            ) : (
                                <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md text-sm text-gray-700 font-sans">{selectedDoc.content}</pre>
                            )}
                         </div>
                         <div className="flex justify-end space-x-3 mt-6">
                            <button onClick={() => setSelectedDoc(null)} className="px-5 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">
                                ปิด
                            </button>
                            {(selectedDoc.type === 'Tax Invoice' || selectedDoc.type === 'Receipt') && (
                                <button onClick={handlePrint} className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">
                                    พิมพ์ / ส่งออกเป็น PDF
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Reports;
