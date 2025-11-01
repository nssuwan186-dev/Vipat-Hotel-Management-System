import React, { useState, useMemo, FC } from 'react';
import type { Guest, Tenant, Room, Invoice, Employee, FormField, Booking } from '../types';
import ConfirmationDialog from './ConfirmationDialog';
import DataFormModal from './DataFormModal';

interface PeopleProps {
    guests: Guest[];
    tenants: Tenant[];
    rooms: Room[];
    invoices: Invoice[];
    employees: Employee[];
    bookings: Booking[];
    addGuest: (name: string, phone: string) => Promise<string>;
    updateGuest: (guestId: string, details: { name: string, phone: string }) => Promise<string>;
    deleteGuest: (guestId: string) => Promise<string>;
    addTenant: (name: string, phone: string, roomId: string, contractStartDate: string, contractEndDate: string, monthlyRent: number) => Promise<string>;
    updateTenant: (tenantId: string, details: any) => Promise<string>;
    deleteTenant: (tenantId: string) => Promise<string>;
    addInvoice: (tenantId: string, period: string) => Promise<string>;
    addEmployee: (name: string, position: Employee['position'], hireDate: string, salaryType: Employee['salaryType'], salaryRate: number) => Promise<string>;
    updateEmployee: (employeeId: string, details: any) => Promise<string>;
    deleteEmployee: (employeeId: string) => Promise<string>;
}

const People: React.FC<PeopleProps> = (props) => {
    const { 
        guests, tenants, rooms, invoices, employees, bookings,
        addGuest, updateGuest, deleteGuest,
        addTenant, updateTenant, deleteTenant, addInvoice,
        addEmployee, updateEmployee, deleteEmployee
    } = props;
    
    const [activeTab, setActiveTab] = useState('ผู้เข้าพักรายวัน');
    const tabs = ['ผู้เข้าพักรายวัน', 'ผู้เช่ารายเดือน', 'พนักงาน'];
    
    const [message, setMessage] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState<any>(null);
    const [itemToDelete, setItemToDelete] = useState<any>(null);

    const employeeStatusClasses: Record<Employee['status'], string> = {
        'ทำงานอยู่': 'bg-green-100 text-green-800', 
        'ลาออกแล้ว': 'bg-gray-100 text-gray-800'
    };

    const guestFields: FormField[] = [{ name: 'name', label: 'ชื่อ', type: 'text', required: true }, { name: 'phone', label: 'เบอร์โทร', type: 'text' }];
    
    const employeeFields: FormField[] = [
        { name: 'name', label: 'ชื่อพนักงาน', type: 'text', required: true },
        { name: 'position', label: 'ตำแหน่ง', type: 'select', options: [{value: 'ผู้จัดการ', label: 'ผู้จัดการ'}, {value: 'พนักงานต้อนรับ', label: 'พนักงานต้อนรับ'}, {value: 'แม่บ้าน', label: 'แม่บ้าน'}], required: true },
        { name: 'salaryType', label: 'ประเภทเงินเดือน', type: 'select', options: [{value: 'รายเดือน', label: 'รายเดือน'}, {value: 'รายวัน', label: 'รายวัน'}], required: true },
        { name: 'salaryRate', label: 'อัตราเงินเดือน/ค่าจ้าง', type: 'number', required: true },
        { name: 'hireDate', label: 'วันที่เริ่มงาน', type: 'date', required: true },
    ];
    
    const employeeUpdateFields: FormField[] = [
        ...employeeFields.filter(f => f.name !== 'hireDate'),
        { name: 'status', label: 'สถานะ', type: 'select', options: [{value: 'ทำงานอยู่', label: 'ทำงานอยู่'}, {value: 'ลาออกแล้ว', label: 'ลาออกแล้ว'}], required: true },
    ];

    const handleAddClick = () => {
        switch(activeTab) {
            case 'ผู้เข้าพักรายวัน':
                setModalConfig({ title: 'เพิ่มผู้เข้าพักใหม่', fields: guestFields, initialData: null, onSubmit: (data: any) => addGuest(data.name, data.phone) });
                break;
            case 'ผู้เช่ารายเดือน':
                const tenantFields: FormField[] = [
                    { name: 'name', label: 'ชื่อผู้เช่า', type: 'text', required: true },
                    { name: 'phone', label: 'เบอร์โทร', type: 'text' },
                    { name: 'roomId', label: 'ห้อง', type: 'select', options: rooms.filter(r => r.status === 'ว่าง').map(r => ({ value: r.id, label: r.number })), required: true },
                    { name: 'monthlyRent', label: 'ค่าเช่า (บาท/เดือน)', type: 'number', required: true },
                    { name: 'contractStartDate', label: 'วันเริ่มสัญญา', type: 'date', required: true },
                    { name: 'contractEndDate', label: 'วันสิ้นสุดสัญญา', type: 'date', required: true },
                ];
                setModalConfig({ title: 'เพิ่มผู้เช่าใหม่', fields: tenantFields, initialData: null, onSubmit: (data: any) => addTenant(data.name, data.phone, data.roomId, data.contractStartDate, data.contractEndDate, data.monthlyRent) });
                break;
            case 'พนักงาน':
                setModalConfig({ title: 'เพิ่มพนักงานใหม่', fields: employeeFields, initialData: null, onSubmit: (data: any) => addEmployee(data.name, data.position, data.hireDate, data.salaryType, data.salaryRate) });
                break;
        }
        setIsModalOpen(true);
    };

    const handleEditClick = (item: any) => {
        switch(activeTab) {
            case 'ผู้เข้าพักรายวัน':
                setModalConfig({ title: 'แก้ไขข้อมูลผู้เข้าพัก', fields: guestFields, initialData: item, onSubmit: (data: any) => updateGuest(item.id, data) });
                break;
            case 'ผู้เช่ารายเดือน':
                 const currentRoom = rooms.find(r => r.id === item.roomId);
                 const roomOptions = [...rooms.filter(r => r.status === 'ว่าง'), ...(currentRoom ? [currentRoom] : [])];
                 const uniqueRoomOptions = [...new Map(roomOptions.map(r => [r.id, {value: r.id, label: r.number}])).values()];
                 const tenantFields: FormField[] = [
                    { name: 'name', label: 'ชื่อผู้เช่า', type: 'text', required: true }, { name: 'phone', label: 'เบอร์โทร', type: 'text' },
                    { name: 'roomId', label: 'ห้อง', type: 'select', options: uniqueRoomOptions, required: true },
                    { name: 'monthlyRent', label: 'ค่าเช่า (บาท/เดือน)', type: 'number', required: true },
                    { name: 'contractStartDate', label: 'วันเริ่มสัญญา', type: 'date', required: true }, { name: 'contractEndDate', label: 'วันสิ้นสุดสัญญา', type: 'date', required: true },
                 ];
                setModalConfig({ title: 'แก้ไขข้อมูลผู้เช่า', fields: tenantFields, initialData: item, onSubmit: (data: any) => updateTenant(item.id, data) });
                break;
            case 'พนักงาน':
                setModalConfig({ title: 'แก้ไขข้อมูลพนักงาน', fields: employeeUpdateFields, initialData: item, onSubmit: (data: any) => updateEmployee(item.id, data) });
                break;
        }
        setIsModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!itemToDelete) return;
        let promise: Promise<string>;
        switch(itemToDelete.type) {
            case 'guest': promise = deleteGuest(itemToDelete.data.id); break;
            case 'tenant': promise = deleteTenant(itemToDelete.data.id); break;
            case 'employee': promise = deleteEmployee(itemToDelete.data.id); break;
            default: promise = Promise.resolve("Error: Unknown type to delete");
        }
        promise.then(result => {
             setMessage(result);
             setTimeout(() => setMessage(''), 3000);
        });
        setItemToDelete(null);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'ผู้เข้าพักรายวัน': return (
                <div className="overflow-x-auto"><table className="w-full">
                    <thead className="bg-gray-100/70"><tr>
                        <th className="p-3 text-left text-sm font-semibold text-gray-600">ชื่อ</th><th className="p-3 text-left text-sm font-semibold text-gray-600">เบอร์โทร</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-600">ประวัติการจอง</th><th className="p-3 text-left text-sm font-semibold text-gray-600">การกระทำ</th>
                    </tr></thead><tbody>
                    {guests.map(guest => {
                        const guestBookings = guest.history
                            .map(bookingId => bookings.find(b => b.id === bookingId))
                            .filter((b): b is Booking => !!b)
                            .sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime());

                        const historyDisplay = guestBookings.length > 0
                            ? `ล่าสุด: ${new Date(guestBookings[0].checkInDate).toLocaleDateString('th-TH')} (${guestBookings.length} ครั้ง)`
                            : 'ไม่มีประวัติ';

                        return (
                            <tr key={guest.id} className="border-b hover:bg-gray-50">
                                <td className="p-3 text-sm font-medium text-gray-900">{guest.name}</td>
                                <td className="p-3 text-sm text-gray-700">{guest.phone}</td>
                                <td className="p-3 text-sm text-gray-700 relative group">
                                    <span className="cursor-default">{historyDisplay}</span>
                                    {guestBookings.length > 0 && (
                                        <div className="absolute hidden group-hover:block bg-white p-3 shadow-lg rounded-lg border z-10 w-72 left-0 top-full mt-1">
                                            <h4 className="font-semibold text-gray-800 border-b pb-2 mb-2">ประวัติการจองทั้งหมด</h4>
                                            <ul className="space-y-1 max-h-48 overflow-y-auto">
                                                {guestBookings.map(b => {
                                                    const room = rooms.find(r => r.id === b.roomId);
                                                    return (
                                                        <li key={b.id} className="text-xs flex justify-between">
                                                            <span>ห้อง {room?.number || '?'} ({new Date(b.checkInDate).toLocaleDateString('th-TH')})</span>
                                                            <span className="font-mono text-gray-500">{b.id}</span>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    )}
                                </td>
                                <td className="p-3 text-sm">
                                    <button onClick={() => handleEditClick(guest)} className="text-blue-600 hover:text-blue-800 font-medium">แก้ไข</button>
                                    <button onClick={() => setItemToDelete({type: 'guest', data: guest})} className="text-red-600 hover:text-red-800 font-medium ml-4">ลบ</button>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table></div>
            );
            case 'ผู้เช่ารายเดือน': return (
                <div className="overflow-x-auto"><table className="w-full">
                    <thead className="bg-gray-100/70"><tr>
                        <th className="p-3 text-left text-sm font-semibold text-gray-600">ชื่อผู้เช่า</th><th className="p-3 text-left text-sm font-semibold text-gray-600">ห้อง</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-600">ค่าเช่า</th><th className="p-3 text-left text-sm font-semibold text-gray-600">สัญญา</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-600">การกระทำ</th>
                    </tr></thead><tbody>
                    {tenants.map(tenant => (<tr key={tenant.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 text-sm font-medium text-gray-900">{tenant.name}</td><td className="p-3 text-sm text-gray-700">{rooms.find(r => r.id === tenant.roomId)?.number}</td>
                        <td className="p-3 text-sm text-gray-700">{tenant.monthlyRent.toLocaleString()}</td><td className="p-3 text-sm text-gray-700">{tenant.contractStartDate.toLocaleDateString('th-TH')} - {tenant.contractEndDate.toLocaleDateString('th-TH')}</td>
                        <td className="p-3 text-sm"><button onClick={() => handleEditClick(tenant)} className="text-blue-600 hover:text-blue-800 font-medium">แก้ไข</button><button onClick={() => setItemToDelete({type: 'tenant', data: tenant})} className="text-red-600 hover:text-red-800 font-medium ml-4">ลบ</button></td>
                    </tr>))}</tbody>
                </table></div>
            );
             case 'พนักงาน': return (
                <div className="overflow-x-auto"><table className="w-full">
                    <thead className="bg-gray-100/70"><tr>
                        <th className="p-3 text-left text-sm font-semibold text-gray-600">ชื่อ</th><th className="p-3 text-left text-sm font-semibold text-gray-600">ตำแหน่ง</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-600">ค่าจ้าง</th><th className="p-3 text-left text-sm font-semibold text-gray-600">สถานะ</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-600">การกระทำ</th>
                    </tr></thead><tbody>
                    {employees.map(emp => (<tr key={emp.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 text-sm font-medium text-gray-900">{emp.name}</td>
                        <td className="p-3 text-sm text-gray-700">{emp.position}</td>
                        <td className="p-3 text-sm text-gray-700">{emp.salaryType === 'รายเดือน' ? `รายเดือน (${emp.salaryRate.toLocaleString()})` : `รายวัน (${emp.salaryRate.toLocaleString()})`}</td>
                        <td className="p-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${employeeStatusClasses[emp.status]}`}>{emp.status}</span></td>
                        <td className="p-3 text-sm"><button onClick={() => handleEditClick(emp)} className="text-blue-600 hover:text-blue-800 font-medium">แก้ไข</button><button onClick={() => setItemToDelete({type: 'employee', data: emp})} className="text-red-600 hover:text-red-800 font-medium ml-4">ลบ</button></td>
                    </tr>))}</tbody>
                </table></div>
            );
            default: return null;
        }
    };
    
    return (
        <>
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <nav className="border-b sm:border-b-0"><div className="-mb-px flex space-x-6 overflow-x-auto">
                    {tabs.map(tab => <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{tab}</button>)}
                </div></nav>
                <button onClick={handleAddClick} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg w-full sm:w-auto">+ เพิ่ม</button>
            </div>
            {message && <div className={`p-3 rounded-lg text-sm ${message.startsWith('ข้อผิดพลาด') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message}</div>}
            <div>{renderTabContent()}</div>
        </div>
        {isModalOpen && modalConfig && <DataFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} {...modalConfig} />}
        {itemToDelete && <ConfirmationDialog isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} onConfirm={handleDeleteConfirm} title="ยืนยันการลบ" message={`คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?`} />}
        </>
    );
};

export default People;