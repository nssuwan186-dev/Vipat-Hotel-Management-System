import React, { useState, useMemo } from 'react';
import type { Room, Employee, Booking, Tenant, Task, Guest, Expense, Attendance, ExpenseCategory, MultiSheetExportPayload, SheetExportData, Page } from '../types';
import ConfirmationDialog from './ConfirmationDialog';
import DataFormModal, { FormField } from './DataFormModal';
import { exportToGoogleSheets } from '../services/googleApiService';


interface DataManagementProps {
    rooms: Room[];
    employees: Employee[];
    bookings: Booking[];
    tenants: Tenant[];
    tasks: Task[];
    guests: Guest[];
    expenses: Expense[];
    attendance: Attendance[];
    expenseCategories: ExpenseCategory[];
    addRoom: (number: string, type: Room['type'], price: number) => string;
    updateRoom: (roomId: string, details: { number: string, type: Room['type'], price: number }) => string;
    deleteRoom: (roomId: string) => string;
    addEmployee: (name: string, position: Employee['position'], hireDate: string, salaryType: Employee['salaryType'], salaryRate: number) => string;
    updateEmployee: (employeeId: string, details: any) => string;
    deleteEmployee: (employeeId: string) => string;
    setCurrentPage: (page: Page) => void;
    setBookingRoomFilter: (roomId: string | null) => void;
}

const DataManagement: React.FC<DataManagementProps> = (props) => {
    const { rooms, employees, bookings, tenants, tasks, guests, expenses, attendance, expenseCategories, addRoom, updateRoom, deleteRoom, addEmployee, updateEmployee, deleteEmployee, setCurrentPage, setBookingRoomFilter } = props;
    const [activeTab, setActiveTab] = useState('ข้อมูลห้องพัก');
    const tabs = ['ข้อมูลห้องพัก', 'ข้อมูลพนักงาน', 'ส่งออกข้อมูล'];
    const [message, setMessage] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState<any>(null);
    const [itemToDelete, setItemToDelete] = useState<any>(null);

    // State for Exporting
    const [exportMessage, setExportMessage] = useState<{ type: 'success' | 'error', text: string, url?: string } | null>(null);
    const [isExporting, setIsExporting] = useState<string | null>(null);
    const [isExportingAll, setIsExportingAll] = useState(false);
    
    const availableRooms = useMemo(() => rooms.filter(r => r.status === 'Available'), [rooms]);

    const roomStatusClasses: Record<Room['status'], string> = {
        'Available': 'bg-green-100 text-green-800', 'Occupied': 'bg-yellow-100 text-yellow-800',
        'Cleaning': 'bg-blue-100 text-blue-800', 'Monthly Rental': 'bg-purple-100 text-purple-800'
    };
    const employeeStatusClasses: Record<Employee['status'], string> = {
        'Active': 'bg-green-100 text-green-800', 'Inactive': 'bg-gray-100 text-gray-800'
    };

    const roomFields: FormField[] = [
        { name: 'number', label: 'หมายเลขห้อง', type: 'text', required: true },
        { name: 'type', label: 'ประเภท', type: 'select', options: [{value: 'Standard', label: 'Standard'}, {value: 'Standard Twin', label: 'Standard Twin'}], required: true },
        { name: 'price', label: 'ราคา (บาท/คืน)', type: 'number', required: true },
    ];
    const employeeFields: FormField[] = [
        { name: 'name', label: 'ชื่อพนักงาน', type: 'text', required: true },
        { name: 'position', label: 'ตำแหน่ง', type: 'select', options: [{value: 'Manager', label: 'Manager'}, {value: 'Receptionist', label: 'Receptionist'}, {value: 'Housekeeping', label: 'Housekeeping'}], required: true },
        { name: 'salaryType', label: 'ประเภทเงินเดือน', type: 'select', options: [{value: 'Monthly', label: 'รายเดือน'}, {value: 'Daily', label: 'รายวัน'}], required: true },
        { name: 'salaryRate', label: 'อัตราเงินเดือน/ค่าจ้าง', type: 'number', required: true },
        { name: 'hireDate', label: 'วันที่เริ่มงาน', type: 'date', required: true },
    ];
    const employeeUpdateFields: FormField[] = [
        ...employeeFields.filter(f => f.name !== 'hireDate'),
        { name: 'status', label: 'สถานะ', type: 'select', options: [{value: 'Active', label: 'ทำงานอยู่'}, {value: 'Inactive', label: 'ลาออกแล้ว'}], required: true },
    ];
    
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
            data: expenses.map(e => {
                const category = expenseCategories.find(c => c.id === e.categoryId);
                return [e.id, e.date.toISOString().split('T')[0], category?.name || e.categoryId, e.description, e.amount];
            })
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
    ], [bookings, guests, rooms, expenses, expenseCategories, payrollDataForExport]);


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

    const handleAddClick = () => {
        switch(activeTab) {
            case 'ข้อมูลห้องพัก':
                setModalConfig({ title: 'เพิ่มห้องพักใหม่', fields: roomFields, initialData: null, onSubmit: (data: any) => addRoom(data.number, data.type, data.price) });
                break;
            case 'ข้อมูลพนักงาน':
                 setModalConfig({ title: 'เพิ่มพนักงานใหม่', fields: employeeFields, initialData: null, onSubmit: (data: any) => addEmployee(data.name, data.position, data.hireDate, data.salaryType, data.salaryRate) });
                break;
        }
        setIsModalOpen(true);
    };

    const handleEditClick = (item: any) => {
        switch(activeTab) {
            case 'ข้อมูลห้องพัก':
                setModalConfig({ title: 'แก้ไขข้อมูลห้องพัก', fields: roomFields, initialData: item, onSubmit: (data: any) => updateRoom(item.id, data) });
                break;
            case 'ข้อมูลพนักงาน':
                 setModalConfig({ title: 'แก้ไขข้อมูลพนักงาน', fields: employeeUpdateFields, initialData: item, onSubmit: (data: any) => updateEmployee(item.id, data) });
                break;
        }
        setIsModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!itemToDelete) return;
        let result = '';
        switch(itemToDelete.type) {
            case 'room': result = deleteRoom(itemToDelete.data.id); break;
            case 'employee': result = deleteEmployee(itemToDelete.data.id); break;
        }
        setMessage(result);
        setItemToDelete(null);
        setTimeout(() => setMessage(''), 3000);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'ข้อมูลห้องพัก': return (
                <div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-100"><tr>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600">หมายเลขห้อง</th><th className="p-3 text-left text-sm font-semibold text-gray-600">ประเภท</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600">ราคา</th><th className="p-3 text-left text-sm font-semibold text-gray-600">สถานะ</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600">การกระทำ</th>
                            </tr></thead><tbody>
                            {rooms.map(room => (<tr key={room.id} className="border-b hover:bg-gray-50">
                                <td className="p-3 text-sm">{room.number}</td><td className="p-3 text-sm">{room.type}</td>
                                <td className="p-3 text-sm">{room.price.toLocaleString()}</td><td className="p-3"><span className={`px-2 py-1 text-xs rounded-full ${roomStatusClasses[room.status]}`}>{room.status}</span></td>
                                <td className="p-3 text-sm whitespace-nowrap">
                                    <button onClick={() => handleEditClick(room)} className="text-blue-600 hover:text-blue-800 font-medium">แก้ไข</button>
                                    <button onClick={() => setItemToDelete({type: 'room', data: room})} className="text-red-600 hover:text-red-800 font-medium ml-4">ลบ</button>
                                    <button onClick={() => { setBookingRoomFilter(room.id); setCurrentPage('การดำเนินงาน'); }} className="text-green-600 hover:text-green-800 font-medium ml-4">ดูการจอง</button>
                                </td>
                            </tr>))}</tbody>
                        </table>
                    </div>
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">
                            ห้องที่ว่างอยู่ตอนนี้ ({availableRooms.length})
                        </h3>
                        {availableRooms.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-4">
                                {availableRooms.map(room => (
                                    <div key={room.id} className="p-3 bg-green-50 border-2 border-green-200 rounded-lg text-center shadow-sm transition-transform hover:scale-105">
                                        <p className="font-bold text-lg text-green-800">{room.number}</p>
                                        <p className="text-sm text-green-600">{room.type}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-gray-50 rounded-lg">
                                <p className="text-gray-500">ไม่มีห้องว่างในขณะนี้</p>
                            </div>
                        )}
                    </div>
                </div>
            );
            case 'ข้อมูลพนักงาน': return (
                <div className="overflow-x-auto"><table className="w-full">
                    <thead className="bg-gray-100"><tr>
                        <th className="p-3 text-left text-sm font-semibold text-gray-600">ชื่อ</th><th className="p-3 text-left text-sm font-semibold text-gray-600">ตำแหน่ง</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-600">ค่าจ้าง</th><th className="p-3 text-left text-sm font-semibold text-gray-600">สถานะ</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-600">การกระทำ</th>
                    </tr></thead><tbody>
                    {employees.map(emp => (<tr key={emp.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 text-sm">{emp.name}</td><td className="p-3 text-sm">{emp.position}</td>
                        <td className="p-3 text-sm">{emp.salaryType === 'Monthly' ? `รายเดือน (${emp.salaryRate.toLocaleString()})` : `รายวัน (${emp.salaryRate.toLocaleString()})`}</td>
                        <td className="p-3"><span className={`px-2 py-1 text-xs rounded-full ${employeeStatusClasses[emp.status]}`}>{emp.status}</span></td>
                        <td className="p-3 text-sm"><button onClick={() => handleEditClick(emp)} className="text-blue-600">แก้ไข</button><button onClick={() => setItemToDelete({type: 'employee', data: emp})} className="text-red-600 ml-4">ลบ</button></td>
                    </tr>))}</tbody>
                </table></div>
            );
            case 'ส่งออกข้อมูล':
                return (
                    <div className="p-4 border rounded-lg bg-white">
                        <h3 className="text-lg font-semibold mb-4 text-gray-700">ส่งออกข้อมูลไปยัง Google Sheets</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            ใช้ฟังก์ชันนี้เพื่อสำรองข้อมูลหรือนำข้อมูลไปวิเคราะห์ต่อใน Google Sheets
                        </p>
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
                            {isExportingAll ? 'กำลังส่งออกทั้งหมด...' : 'ส่งออกข้อมูลทั้งหมด'}
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
                );
            default: return null;
        }
    };

    return (
        <>
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg space-y-6">
            <div className="flex justify-between items-center">
                <nav className="border-b"><div className="-mb-px flex space-x-6">
                    {tabs.map(tab => <button key={tab} onClick={() => setActiveTab(tab)} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>{tab}</button>)}
                </div></nav>
                {activeTab !== 'ส่งออกข้อมูล' && (
                    <button onClick={handleAddClick} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg">+ เพิ่ม</button>
                )}
            </div>
            {message && <div className="p-3 rounded-lg bg-green-100 text-green-700">{message}</div>}
            <div>{renderTabContent()}</div>
        </div>
        {isModalOpen && modalConfig && <DataFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} {...modalConfig} />}
        {itemToDelete && <ConfirmationDialog isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} onConfirm={handleDeleteConfirm} title="ยืนยันการลบ" message={`คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?`} />}
        </>
    );
};

export default DataManagement;