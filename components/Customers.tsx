import React, { useState, useMemo, FC } from 'react';
import type { Guest, Tenant, Room, Invoice, Booking } from '../types';
import ConfirmationDialog from './ConfirmationDialog';
import DataFormModal, { FormField } from './DataFormModal';

interface CustomersProps {
    guests: Guest[];
    tenants: Tenant[];
    rooms: Room[];
    invoices: Invoice[];
    bookings: Booking[];
    addGuest: (name: string, phone: string) => string;
    updateGuest: (guestId: string, details: { name: string, phone: string }) => string;
    deleteGuest: (guestId: string) => string;
    addTenant: (name: string, phone: string, roomId: string, contractStartDate: string, contractEndDate: string, monthlyRent: number) => string;
    updateTenant: (tenantId: string, details: any) => string;
    deleteTenant: (tenantId: string) => string;
    addInvoice: (tenantId: string, period: string) => string;
}

const InvoiceModal: FC<{ invoice: Invoice, tenant?: Tenant, room?: Room, onClose: () => void }> = ({ invoice, tenant, room, onClose }) => {
    // This is a simplified view of the invoice modal from Finance.tsx
    // In a real app, you might make this a shared component.
    const handlePrint = () => window.print();
    return (
        <>
        <style>{`@media print { body * { visibility: hidden; } .invoice-printable-area, .invoice-printable-area * { visibility: visible; } .invoice-printable-area { position: absolute; left: 0; top: 0; width: 100%; }}`}</style>
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-3xl" onClick={e => e.stopPropagation()}>
                <div className="invoice-printable-area relative border p-8 rounded-lg">
                     <header className="flex justify-between items-start pb-6 border-b">
                        <div><h1 className="text-3xl font-bold text-gray-800">VIPAT HMS</h1><p className="text-gray-500">123 Example Road, Bangkok, 10110</p></div>
                        <h2 className="text-3xl font-light text-gray-600 tracking-widest">ใบแจ้งหนี้</h2>
                    </header>
                    <section className="grid grid-cols-2 gap-8 my-6">
                        <div><h3 className="text-sm font-semibold text-gray-500 uppercase">เรียกเก็บเงินไปที่</h3><p className="text-lg font-medium text-gray-800">{tenant?.name || 'N/A'}</p><p className="text-gray-600">ห้องพัก: {room?.number || 'N/A'}</p></div>
                        <div className="text-right"><h3 className="text-sm font-semibold text-gray-500 uppercase">เลขที่ใบแจ้งหนี้</h3><p className="text-lg font-medium text-gray-800">{invoice.id}</p><h3 className="text-sm font-semibold text-gray-500 uppercase mt-2">วันที่ออก</h3><p className="text-gray-600">{invoice.issueDate.toLocaleDateString('th-TH')}</p></div>
                    </section>
                    <section>
                         <table className="w-full text-left">
                            <thead className="bg-gray-100"><tr><th className="p-3 text-sm font-semibold text-gray-600">รายการ</th><th className="p-3 text-sm font-semibold text-gray-600 text-right">จำนวนเงิน</th></tr></thead>
                            <tbody><tr className="border-b"><td className="p-3"><p className="font-medium text-gray-800">ค่าเช่ารายเดือน</p><p className="text-sm text-gray-500">สำหรับรอบบิล: {invoice.period}</p></td><td className="p-3 text-right font-medium text-gray-800">{invoice.amount.toLocaleString('th-TH')} บาท</td></tr></tbody>
                        </table>
                    </section>
                    <section className="flex justify-end mt-6">
                        <div className="w-full max-w-xs"><div className="flex justify-between py-2 bg-gray-100 rounded-lg px-3"><span className="font-bold text-gray-800 text-lg">ยอดที่ต้องชำระ</span><span className="font-bold text-blue-600 text-lg">{invoice.amount.toLocaleString('th-TH')} บาท</span></div><p className="text-sm text-gray-500 text-right mt-2">ครบกำหนดชำระวันที่: {invoice.dueDate.toLocaleDateString('th-TH')}</p></div>
                    </section>
                </div>
                <div className="flex justify-end space-x-3 mt-6"><button onClick={onClose} className="px-5 py-2 bg-gray-200 rounded-lg">ปิด</button><button onClick={handlePrint} className="px-5 py-2 bg-blue-600 text-white rounded-lg">พิมพ์</button></div>
            </div>
        </div>
        </>
    );
};

const NewInvoiceForm: FC<{ tenants: Tenant[]; rooms: Room[]; addInvoice: (tenantId: string, period: string) => string }> = ({ tenants, rooms, addInvoice }) => {
    const [selectedTenantId, setSelectedTenantId] = useState<string>('');
    const [period, setPeriod] = useState<string>(new Date().toLocaleString('th-TH', { month: 'long', year: 'numeric' }));
    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const result = addInvoice(selectedTenantId, period);
        setMessage({ type: result.startsWith('ข้อผิดพลาด') ? 'error' : 'success', text: result });
        if (!result.startsWith('ข้อผิดพลาด')) setSelectedTenantId('');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-gray-50 mt-4">
            <h4 className="text-lg font-semibold text-gray-700">สร้างใบแจ้งหนี้ใหม่</h4>
            {message && <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}
            <select value={selectedTenantId} onChange={e => setSelectedTenantId(e.target.value)} className="w-full p-2 border rounded" required>
                <option value="" disabled>-- เลือกผู้เช่า --</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.name} (ห้อง {rooms.find(r => r.id === t.roomId)?.number})</option>)}
            </select>
            <input type="text" value={period} onChange={e => setPeriod(e.target.value)} className="w-full p-2 border rounded" required />
            <button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg" disabled={!selectedTenantId}>สร้าง</button>
        </form>
    );
};

const Customers: React.FC<CustomersProps> = (props) => {
    const { guests, tenants, rooms, invoices, bookings, addGuest, updateGuest, deleteGuest, addTenant, updateTenant, deleteTenant, addInvoice } = props;
    const [activeTab, setActiveTab] = useState('ผู้เข้าพักรายวัน');
    const tabs = ['ผู้เข้าพักรายวัน', 'ผู้เช่ารายเดือน'];
    const [message, setMessage] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState<any>(null);
    const [itemToDelete, setItemToDelete] = useState<any>(null);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    const guestFields: FormField[] = [{ name: 'name', label: 'ชื่อ', type: 'text', required: true }, { name: 'phone', label: 'เบอร์โทร', type: 'text' }];
    
    const handleAddClick = () => {
        switch(activeTab) {
            case 'ผู้เข้าพักรายวัน':
                setModalConfig({ title: 'เพิ่มผู้เข้าพักใหม่', fields: guestFields, initialData: null, onSubmit: (data: any) => addGuest(data.name, data.phone) });
                break;
            case 'ผู้เช่ารายเดือน':
                const tenantFields = [
                    { name: 'name', label: 'ชื่อผู้เช่า', type: 'text', required: true }, { name: 'phone', label: 'เบอร์โทร', type: 'text' },
                    { name: 'roomId', label: 'ห้อง', type: 'select', options: rooms.filter(r => r.status === 'Available').map(r => ({ value: r.id, label: r.number })), required: true },
                    { name: 'monthlyRent', label: 'ค่าเช่า (บาท/เดือน)', type: 'number', required: true },
                    { name: 'contractStartDate', label: 'วันเริ่มสัญญา', type: 'date', required: true }, { name: 'contractEndDate', label: 'วันสิ้นสุดสัญญา', type: 'date', required: true },
                ];
                setModalConfig({ title: 'เพิ่มผู้เช่าใหม่', fields: tenantFields, initialData: null, onSubmit: (data: any) => addTenant(data.name, data.phone, data.roomId, data.contractStartDate, data.contractEndDate, data.monthlyRent) });
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
                 const roomOptions = [...rooms.filter(r => r.status === 'Available'), ...(currentRoom ? [currentRoom] : [])];
                 const uniqueRoomOptions = [...new Map(roomOptions.map(r => [r.id, {value: r.id, label: r.number}])).values()];
                 const tenantFields = [
                    { name: 'name', label: 'ชื่อผู้เช่า', type: 'text', required: true }, { name: 'phone', label: 'เบอร์โทร', type: 'text' },
                    { name: 'roomId', label: 'ห้อง', type: 'select', options: uniqueRoomOptions, required: true },
                    { name: 'monthlyRent', label: 'ค่าเช่า (บาท/เดือน)', type: 'number', required: true },
                    { name: 'contractStartDate', label: 'วันเริ่มสัญญา', type: 'date', required: true }, { name: 'contractEndDate', label: 'วันสิ้นสุดสัญญา', type: 'date', required: true },
                 ];
                setModalConfig({ title: 'แก้ไขข้อมูลผู้เช่า', fields: tenantFields, initialData: item, onSubmit: (data: any) => updateTenant(item.id, data) });
                break;
        }
        setIsModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!itemToDelete) return;
        let result = '';
        switch(itemToDelete.type) {
            case 'guest': result = deleteGuest(itemToDelete.data.id); break;
            case 'tenant': result = deleteTenant(itemToDelete.data.id); break;
        }
        setMessage(result);
        setItemToDelete(null);
        setTimeout(() => setMessage(''), 3000);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'ผู้เข้าพักรายวัน': return (
                <div className="overflow-x-auto"><table className="w-full">
                    <thead className="bg-gray-100"><tr>
                        <th className="p-3 text-left text-sm font-semibold text-gray-600">ชื่อ</th><th className="p-3 text-left text-sm font-semibold text-gray-600">เบอร์โทร</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-600">ประวัติการจอง</th><th className="p-3 text-left text-sm font-semibold text-gray-600">การกระทำ</th>
                    </tr></thead><tbody>
                    {guests.map(guest => (<tr key={guest.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 text-sm">{guest.name}</td><td className="p-3 text-sm">{guest.phone}</td><td className="p-3 text-sm">{guest.history.length} ครั้ง</td>
                        <td className="p-3 text-sm"><button onClick={() => handleEditClick(guest)} className="text-blue-600">แก้ไข</button><button onClick={() => setItemToDelete({type: 'guest', data: guest})} className="text-red-600 ml-4">ลบ</button></td>
                    </tr>))}</tbody>
                </table></div>
            );
            case 'ผู้เช่ารายเดือน': return (
                <div>
                <div className="overflow-x-auto"><table className="w-full">
                    <thead className="bg-gray-100"><tr>
                        <th className="p-3 text-left text-sm font-semibold text-gray-600">ชื่อผู้เช่า</th><th className="p-3 text-left text-sm font-semibold text-gray-600">ห้อง</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-600">ค่าเช่า</th><th className="p-3 text-left text-sm font-semibold text-gray-600">สัญญา</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-600">การกระทำ</th>
                    </tr></thead><tbody>
                    {tenants.map(tenant => (<tr key={tenant.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 text-sm">{tenant.name}</td><td className="p-3 text-sm">{rooms.find(r => r.id === tenant.roomId)?.number}</td>
                        <td className="p-3 text-sm">{tenant.monthlyRent.toLocaleString()}</td><td className="p-3 text-sm">{tenant.contractStartDate.toLocaleDateString('th-TH')} - {tenant.contractEndDate.toLocaleDateString('th-TH')}</td>
                        <td className="p-3 text-sm"><button onClick={() => handleEditClick(tenant)} className="text-blue-600">แก้ไข</button><button onClick={() => setItemToDelete({type: 'tenant', data: tenant})} className="text-red-600 ml-4">ลบ</button></td>
                    </tr>))}</tbody>
                </table></div>
                <div className="mt-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">ใบแจ้งหนี้สำหรับผู้เช่า</h3>
                    <div className="overflow-x-auto"><table className="w-full">
                        <thead className="bg-gray-100"><tr>
                            <th className="p-3 text-left text-sm font-semibold text-gray-600">ID</th><th className="p-3 text-left text-sm font-semibold text-gray-600">ผู้เช่า</th>
                            <th className="p-3 text-left text-sm font-semibold text-gray-600">รอบบิล</th><th className="p-3 text-left text-sm font-semibold text-gray-600">สถานะ</th>
                            <th className="p-3 text-left text-sm font-semibold text-gray-600">การกระทำ</th>
                        </tr></thead><tbody>
                        {invoices.map(invoice => (<tr key={invoice.id} className="border-b hover:bg-gray-50">
                            <td className="p-3 text-sm">{invoice.id}</td><td className="p-3 text-sm">{tenants.find(t=>t.id === invoice.tenantId)?.name}</td>
                            <td className="p-3 text-sm">{invoice.period}</td><td className="p-3 text-sm"><span className={`px-2 py-1 text-xs rounded-full ${invoice.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{invoice.status}</span></td>
                            <td className="p-3 text-sm"><button onClick={() => setSelectedInvoice(invoice)} className="text-blue-600">ดู</button></td>
                        </tr>))}</tbody>
                    </table></div>
                    <NewInvoiceForm tenants={tenants} rooms={rooms} addInvoice={addInvoice} />
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
                <button onClick={handleAddClick} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg">+ เพิ่ม</button>
            </div>
            {message && <div className="p-3 rounded-lg bg-green-100 text-green-700">{message}</div>}
            <div>{renderTabContent()}</div>
        </div>
        {isModalOpen && modalConfig && <DataFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} {...modalConfig} />}
        {itemToDelete && <ConfirmationDialog isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} onConfirm={handleDeleteConfirm} title="ยืนยันการลบ" message={`คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?`} />}
        {selectedInvoice && <InvoiceModal invoice={selectedInvoice} tenant={tenants.find(t => t.id === selectedInvoice.tenantId)} room={rooms.find(r => r.id === tenants.find(t => t.id === selectedInvoice.tenantId)?.roomId)} onClose={() => setSelectedInvoice(null)} />}
        </>
    );
};

export default Customers;
