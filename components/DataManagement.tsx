import React, { useState, useMemo } from 'react';
import type { Guest, Room, Tenant, Employee, Booking } from '../types';
import ConfirmationDialog from './ConfirmationDialog';
import DataFormModal, { FormField } from './DataFormModal';

interface DataManagementProps {
    guests: Guest[];
    rooms: Room[];
    tenants: Tenant[];
    employees: Employee[];
    bookings: Booking[];
    addGuest: (name: string, phone: string) => string;
    updateGuest: (guestId: string, details: { name: string, phone: string }) => string;
    deleteGuest: (guestId: string) => string;
    addRoom: (number: string, type: Room['type'], price: number) => string;
    updateRoom: (roomId: string, details: { number: string, type: Room['type'], price: number }) => string;
    deleteRoom: (roomId: string) => string;
    addTenant: (name: string, phone: string, roomId: string, contractStartDate: string, contractEndDate: string, monthlyRent: number) => string;
    updateTenant: (tenantId: string, details: any) => string;
    deleteTenant: (tenantId: string) => string;
    addEmployee: (name: string, position: Employee['position'], hireDate: string, salaryType: Employee['salaryType'], salaryRate: number) => string;
    updateEmployee: (employeeId: string, details: any) => string;
    deleteEmployee: (employeeId: string) => string;
}

const DataManagement: React.FC<DataManagementProps> = ({ 
    guests, rooms, tenants, employees, bookings, 
    addGuest, updateGuest, deleteGuest,
    addRoom, updateRoom, deleteRoom,
    addTenant, updateTenant, deleteTenant,
    addEmployee, updateEmployee, deleteEmployee
}) => {
    const [activeTab, setActiveTab] = useState('ข้อมูลผู้เข้าพัก');
    const tabs = ['ข้อมูลผู้เข้าพัก', 'ข้อมูลห้องพัก', 'ผู้เช่ารายเดือน', 'พนักงาน'];

    const [message, setMessage] = useState('');
    const [roomSearch, setRoomSearch] = useState('');
    const [minBookingsFilter, setMinBookingsFilter] = useState('');
    const [lastMonthsFilter, setLastMonthsFilter] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState<{ title: string, fields: FormField[], initialData: any, onSubmit: (data: any) => string } | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{ type: 'guest' | 'room' | 'tenant' | 'employee', data: any } | null>(null);
    
    // --- UI Mappers ---
    // FIX: Changed English keys to Thai to match Room['status'] type.
    const roomStatusClasses: Record<Room['status'], string> = {
        'ว่าง': 'bg-green-100 text-green-800',
        'ไม่ว่าง': 'bg-yellow-100 text-yellow-800',
        'ทำความสะอาด': 'bg-blue-100 text-blue-800',
        'เช่ารายเดือน': 'bg-purple-100 text-purple-800'
    };
    // FIX: Changed English keys to Thai to match Employee['status'] type.
    const employeeStatusClasses: Record<Employee['status'], string> = {
        'ทำงานอยู่': 'bg-green-100 text-green-800',
        'ลาออกแล้ว': 'bg-gray-100 text-gray-800'
    };
    
    // --- Field Definitions for Forms ---
    const guestFields: FormField[] = [
        { name: 'name', label: 'ชื่อ', type: 'text', required: true },
        { name: 'phone', label: 'เบอร์โทร', type: 'text' },
    ];
    const roomFields: FormField[] = [
        { name: 'number', label: 'หมายเลขห้อง', type: 'text', required: true },
        { name: 'type', label: 'ประเภท', type: 'select', options: [{value: 'Standard', label: 'Standard'}, {value: 'Standard Twin', label: 'Standard Twin'}], required: true },
        { name: 'price', label: 'ราคา (บาท/คืน)', type: 'number', required: true },
    ];
    const employeeFields: FormField[] = [
        { name: 'name', label: 'ชื่อพนักงาน', type: 'text', required: true },
        // FIX: Changed select option values to Thai to match Employee['position'] type.
        { name: 'position', label: 'ตำแหน่ง', type: 'select', options: [{value: 'ผู้จัดการ', label: 'ผู้จัดการ'}, {value: 'พนักงานต้อนรับ', label: 'พนักงานต้อนรับ'}, {value: 'แม่บ้าน', label: 'แม่บ้าน'}], required: true },
        // FIX: Changed select option values to Thai to match Employee['salaryType'] type.
        { name: 'salaryType', label: 'ประเภทเงินเดือน', type: 'select', options: [{value: 'รายเดือน', label: 'รายเดือน'}, {value: 'รายวัน', label: 'รายวัน'}], required: true },
        { name: 'salaryRate', label: 'อัตราเงินเดือน/ค่าจ้าง', type: 'number', required: true },
        { name: 'hireDate', label: 'วันที่เริ่มงาน', type: 'date', required: true },
    ];
    const employeeUpdateFields: FormField[] = [
        ...employeeFields.filter(f => f.name !== 'hireDate'),
        // FIX: Changed select option values to Thai to match Employee['status'] type.
        { name: 'status', label: 'สถานะ', type: 'select', options: [{value: 'ทำงานอยู่', label: 'ทำงานอยู่'}, {value: 'ลาออกแล้ว', label: 'ลาออกแล้ว'}], required: true },
    ];
    
    // --- Modal Handling ---
    const handleAddClick = () => {
        switch(activeTab) {
            case 'ข้อมูลผู้เข้าพัก':
                setModalConfig({ title: 'เพิ่มผู้เข้าพักใหม่', fields: guestFields, initialData: null, onSubmit: (data) => addGuest(data.name, data.phone) });
                break;
            case 'ข้อมูลห้องพัก':
                setModalConfig({ title: 'เพิ่มห้องพักใหม่', fields: roomFields, initialData: null, onSubmit: (data) => addRoom(data.number, data.type, data.price) });
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
                setModalConfig({ title: 'เพิ่มผู้เช่าใหม่', fields: tenantFields, initialData: null, onSubmit: (data) => addTenant(data.name, data.phone, data.roomId, data.contractStartDate, data.contractEndDate, data.monthlyRent) });
                break;
            case 'พนักงาน':
                 setModalConfig({ title: 'เพิ่มพนักงานใหม่', fields: employeeFields, initialData: null, onSubmit: (data) => addEmployee(data.name, data.position, data.hireDate, data.salaryType, data.salaryRate) });
                break;
        }
        setIsModalOpen(true);
    };

    const handleEditClick = (item: any) => {
        switch(activeTab) {
            case 'ข้อมูลผู้เข้าพัก':
                setModalConfig({ title: 'แก้ไขข้อมูลผู้เข้าพัก', fields: guestFields, initialData: item, onSubmit: (data) => updateGuest(item.id, data) });
                break;
            case 'ข้อมูลห้องพัก':
                setModalConfig({ title: 'แก้ไขข้อมูลห้องพัก', fields: roomFields, initialData: item, onSubmit: (data) => updateRoom(item.id, data) });
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
                setModalConfig({ title: 'แก้ไขข้อมูลผู้เช่า', fields: tenantFields, initialData: item, onSubmit: (data) => updateTenant(item.id, data) });
                break;
            case 'พนักงาน':
                 setModalConfig({ title: 'แก้ไขข้อมูลพนักงาน', fields: employeeUpdateFields, initialData: item, onSubmit: (data) => updateEmployee(item.id, data) });
                break;
        }
        setIsModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!itemToDelete) return;
        let result = '';
        switch(itemToDelete.type) {
            case 'guest': result = deleteGuest(itemToDelete.data.id); break;
            case 'room': result = deleteRoom(itemToDelete.data.id); break;
            case 'tenant': result = deleteTenant(itemToDelete.data.id); break;
            case 'employee': result = deleteEmployee(itemToDelete.data.id); break;
        }
        setMessage(result);
        setItemToDelete(null);
        setTimeout(() => setMessage(''), 3000);
    };
    
    // --- Data Filtering ---
    const filteredGuests = useMemo(() => {
        let tempGuests = [...guests];
        const minBookings = parseInt(minBookingsFilter);
        if (!isNaN(minBookings) && minBookings > 0) tempGuests = tempGuests.filter(g => g.history.length >= minBookings);
        const lastMonths = parseInt(lastMonthsFilter);
        if (!isNaN(lastMonths) && lastMonths > 0) {
            const cutoffDate = new Date();
            cutoffDate.setMonth(cutoffDate.getMonth() - lastMonths);
            tempGuests = tempGuests.filter(g => g.history.some(bookingId => {
                const booking = bookings.find(b => b.id === bookingId);
                return booking && new Date(booking.checkInDate) >= cutoffDate;
            }));
        }
        return tempGuests.sort((a,b) => a.name.localeCompare(b.name));
    }, [guests, bookings, minBookingsFilter, lastMonthsFilter]);

    const filteredRooms = useMemo(() => rooms.filter(room =>
        room.number.toLowerCase().includes(roomSearch.toLowerCase()) ||
        room.type.toLowerCase().includes(roomSearch.toLowerCase())
    ).sort((a,b) => a.number.localeCompare(b.number)), [rooms, roomSearch]);

    // --- Tab Rendering ---
    const renderTabContent = () => {
        switch (activeTab) {
            case 'ข้อมูลผู้เข้าพัก': return (
                <div>
                    <div className="p-4 mb-4 bg-gray-50 rounded-lg border flex flex-col md:flex-row gap-4">
                       <input type="number" value={minBookingsFilter} onChange={e => setMinBookingsFilter(e.target.value)} placeholder="กรองตามจำนวนการจองขั้นต่ำ..." className="flex-1 px-3 py-2 border border-gray-300 rounded-md"/>
                       <input type="number" value={lastMonthsFilter} onChange={e => setLastMonthsFilter(e.target.value)} placeholder="กรองตามการจองใน (เดือน) ที่ผ่านมา..." className="flex-1 px-3 py-2 border border-gray-300 rounded-md"/>
                    </div>
                    <div className="overflow-x-auto"><table className="w-full">
                        <thead className="bg-gray-100"><tr>
                            <th className="p-3 text-left text-sm font-semibold text-gray-600">ชื่อ</th><th className="p-3 text-left text-sm font-semibold text-gray-600">เบอร์โทร</th>
                            <th className="p-3 text-left text-sm font-semibold text-gray-600">ประวัติการจอง</th><th className="p-3 text-left text-sm font-semibold text-gray-600">การกระทำ</th>
                        </tr></thead><tbody>
                        {filteredGuests.map(guest => (<tr key={guest.id} className="border-b hover:bg-gray-50">
                            <td className="p-3 text-sm">{guest.name}</td><td className="p-3 text-sm">{guest.phone}</td><td className="p-3 text-sm">{guest.history.length} ครั้ง</td>
                            <td className="p-3 text-sm"><button onClick={() => handleEditClick(guest)} className="text-blue-600 hover:text-blue-800 font-medium">แก้ไข</button><button onClick={() => setItemToDelete({type: 'guest', data: guest})} className="text-red-600 hover:text-red-800 font-medium ml-4">ลบ</button></td>
                        </tr>))}</tbody>
                    </table></div>
                </div>
            );
            case 'ข้อมูลห้องพัก': return (
                <div>
                    <input type="text" value={roomSearch} onChange={e => setRoomSearch(e.target.value)} placeholder="ค้นหาตามหมายเลขห้องหรือประเภท..." className="w-full md:w-1/3 mb-4 px-3 py-2 border rounded-md"/>
                    <div className="overflow-x-auto"><table className="w-full">
                        <thead className="bg-gray-100"><tr>
                            <th className="p-3 text-left text-sm font-semibold text-gray-600">หมายเลขห้อง</th><th className="p-3 text-left text-sm font-semibold text-gray-600">ประเภท</th>
                            <th className="p-3 text-left text-sm font-semibold text-gray-600">ราคา (บาท/คืน)</th><th className="p-3 text-left text-sm font-semibold text-gray-600">สถานะ</th>
                            <th className="p-3 text-left text-sm font-semibold text-gray-600">การกระทำ</th>
                        </tr></thead><tbody>
                        {filteredRooms.map(room => (<tr key={room.id} className="border-b hover:bg-gray-50">
                            <td className="p-3 text-sm font-medium">{room.number}</td><td className="p-3 text-sm">{room.type}</td><td className="p-3 text-sm">{room.status !== 'เช่ารายเดือน' ? room.price.toLocaleString('th-TH') : '-'}</td>
                            {/* FIX: Removed redundant roomStatusMap and used room.status directly. */}
                            <td className="p-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${roomStatusClasses[room.status]}`}>{room.status}</span></td>
                            <td className="p-3 text-sm"><button onClick={() => handleEditClick(room)} className="text-blue-600 hover:text-blue-800 font-medium">แก้ไข</button><button onClick={() => setItemToDelete({type: 'room', data: room})} className="text-red-600 hover:text-red-800 font-medium ml-4">ลบ</button></td>
                        </tr>))}</tbody>
                    </table></div>
                </div>
            );
            case 'ผู้เช่ารายเดือน': return (
                <div className="overflow-x-auto"><table className="w-full">
                    <thead className="bg-gray-100"><tr>
                        <th className="p-3 text-left text-sm font-semibold text-gray-600">ชื่อผู้เช่า</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-600">เบอร์โทร</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-600">ห้อง</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-600">ค่าเช่า</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-600">วันเริ่มสัญญา</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-600">วันสิ้นสุดสัญญา</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-600">การกระทำ</th>
                    </tr></thead><tbody>
                    {tenants.map(tenant => (<tr key={tenant.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 text-sm font-medium">{tenant.name}</td>
                        <td className="p-3 text-sm">{tenant.phone}</td>
                        <td className="p-3 text-sm">{rooms.find(r => r.id === tenant.roomId)?.number}</td>
                        <td className="p-3 text-sm">{tenant.monthlyRent.toLocaleString('th-TH')}</td>
                        <td className="p-3 text-sm">{tenant.contractStartDate.toLocaleDateString('th-TH')}</td>
                        <td className="p-3 text-sm">{tenant.contractEndDate.toLocaleDateString('th-TH')}</td>
                        <td className="p-3 text-sm"><button onClick={() => handleEditClick(tenant)} className="text-blue-600 hover:text-blue-800 font-medium">แก้ไข</button><button onClick={() => setItemToDelete({type: 'tenant', data: tenant})} className="text-red-600 hover:text-red-800 font-medium ml-4">ลบ</button></td>
                    </tr>))}</tbody>
                </table></div>
            );
            case 'พนักงาน': return (
                <div className="overflow-x-auto"><table className="w-full">
                    <thead className="bg-gray-100"><tr>
                        <th className="p-3 text-left text-sm font-semibold text-gray-600">ชื่อพนักงาน</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-600">ตำแหน่ง</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-600">วันที่เริ่มงาน</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-600">ค่าจ้าง</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-600">สถานะ</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-600">การกระทำ</th>
                    </tr></thead><tbody>
                    {employees.map(emp => (<tr key={emp.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 text-sm font-medium">{emp.name}</td>
                        <td className="p-3 text-sm">{emp.position}</td>
                        <td className="p-3 text-sm">{emp.hireDate.toLocaleDateString('th-TH')}</td>
                        <td className="p-3 text-sm">{emp.salaryType === 'รายเดือน' ? `รายเดือน (${emp.salaryRate.toLocaleString()})` : `รายวัน (${emp.salaryRate.toLocaleString()})`}</td>
                        {/* FIX: Removed redundant employeeStatusMap and used emp.status directly. */}
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
                <div className="flex justify-between items-center">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-6 overflow-x-auto">
                            {tabs.map(tab => (
                                <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                                    {tab}
                                </button>
                            ))}
                        </nav>
                    </div>
                    <button onClick={handleAddClick} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">
                        + เพิ่ม{activeTab.replace('ข้อมูล', '').replace('พัก', 'พักใหม่').replace('ผู้เช่ารายเดือน', 'ผู้เช่าใหม่')}
                    </button>
                </div>

                {message && <div className={`p-3 rounded-lg text-sm ${message.startsWith('ข้อผิดพลาด') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message}</div>}

                <div>{renderTabContent()}</div>
            </div>

            {isModalOpen && modalConfig && (
                <DataFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} {...modalConfig} />
            )}

            {itemToDelete && (
                 <ConfirmationDialog
                    isOpen={!!itemToDelete}
                    onClose={() => setItemToDelete(null)}
                    onConfirm={handleDeleteConfirm}
                    title={`ยืนยันการลบ`}
                    message={`คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูล${itemToDelete.type === 'room' ? `ห้อง ${itemToDelete.data.number}` : `${itemToDelete.data.name}`}? การกระทำนี้ไม่สามารถย้อนกลับได้`}
                />
            )}
        </>
    );
};

export default DataManagement;
