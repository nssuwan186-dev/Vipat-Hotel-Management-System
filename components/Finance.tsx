import React, { useState, useMemo, FC, useEffect } from 'react';
import type { Booking, Expense, Invoice, Tenant, Room, Employee, Attendance } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import ConfirmationDialog from './ConfirmationDialog';

interface FinanceProps {
    bookings: Booking[];
    expenses: Expense[];
    addExpense: (category: Expense['category'], description: string, amount: number) => string;
    updateExpense: (expenseId: string, newDetails: { category: Expense['category']; description: string; amount: number; date: Date }) => string;
    deleteExpense: (expenseId: string) => string;
    invoices: Invoice[];
    tenants: Tenant[];
    rooms: Room[];
    employees: Employee[];
    attendance: Attendance[];
    addInvoice: (tenantId: string, period: string) => string;
    financeDateFilter: Date | null;
    setFinanceDateFilter: (date: Date | null) => void;
}

const FinanceCard: React.FC<{ title: string; amount: string; gradient: string }> = ({ title, amount, gradient }) => (
    <div className={`p-5 rounded-2xl shadow-lg text-white ${gradient}`}>
        <h4 className="text-md font-semibold text-white">{title}</h4>
        <p className="text-3xl font-bold mt-2">{amount}</p>
    </div>
);

const InvoiceModal: FC<{ invoice: Invoice, tenant?: Tenant, room?: Room, onClose: () => void }> = ({ invoice, tenant, room, onClose }) => {
    const handlePrint = () => {
        window.print();
    };

    const statusBadge = (
        <div className={`absolute top-8 right-8 text-center text-2xl font-bold rounded-lg py-2 px-4 transform -rotate-15 border-2 ${
            invoice.status === 'Paid' 
            ? 'text-green-600 border-green-600'
            : 'text-red-600 border-red-600'
        }`}>
            {invoice.status === 'Paid' ? 'ชำระแล้ว' : 'ยังไม่ได้ชำระ'}
        </div>
    );

    return (
        <>
        <style>
            {`
            @media print {
              body * {
                visibility: hidden;
              }
              .invoice-printable-area, .invoice-printable-area * {
                visibility: visible;
              }
              .invoice-printable-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                padding: 20px;
                font-size: 12px;
              }
            }
            `}
        </style>
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="invoice-printable-area relative border border-gray-200 p-8 rounded-lg">
                    {statusBadge}
                    <header className="flex justify-between items-start pb-6 border-b">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">VIPAT HMS</h1>
                            <p className="text-gray-500">123 Example Road, Bangkok, 10110</p>
                        </div>
                        <h2 className="text-3xl font-light text-gray-600 tracking-widest">ใบแจ้งหนี้</h2>
                    </header>
                    <section className="grid grid-cols-2 gap-8 my-6">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase">เรียกเก็บเงินไปที่</h3>
                            <p className="text-lg font-medium text-gray-800">{tenant?.name || 'N/A'}</p>
                            <p className="text-gray-600">ห้องพัก: {room?.number || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                             <h3 className="text-sm font-semibold text-gray-500 uppercase">เลขที่ใบแจ้งหนี้</h3>
                             <p className="text-lg font-medium text-gray-800">{invoice.id}</p>
                             <h3 className="text-sm font-semibold text-gray-500 uppercase mt-2">วันที่ออก</h3>
                             <p className="text-gray-600">{invoice.issueDate.toLocaleDateString('th-TH')}</p>
                        </div>
                    </section>
                    <section>
                        <table className="w-full text-left">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-3 text-sm font-semibold text-gray-600">รายการ</th>
                                    <th className="p-3 text-sm font-semibold text-gray-600 text-right">จำนวนเงิน</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b">
                                    <td className="p-3">
                                        <p className="font-medium text-gray-800">ค่าเช่ารายเดือน</p>
                                        <p className="text-sm text-gray-500">สำหรับรอบบิล: {invoice.period}</p>
                                    </td>
                                    <td className="p-3 text-right font-medium text-gray-800">{invoice.amount.toLocaleString('th-TH')} บาท</td>
                                </tr>
                            </tbody>
                        </table>
                    </section>
                     <section className="flex justify-end mt-6">
                        <div className="w-full max-w-xs">
                            <div className="flex justify-between py-2">
                                <span className="font-medium text-gray-600">ยอดรวม</span>
                                <span className="font-medium text-gray-800">{invoice.amount.toLocaleString('th-TH')} บาท</span>
                            </div>
                            <div className="flex justify-between py-2 bg-gray-100 rounded-lg px-3">
                                <span className="font-bold text-gray-800 text-lg">ยอดที่ต้องชำระ</span>
                                <span className="font-bold text-blue-600 text-lg">{invoice.amount.toLocaleString('th-TH')} บาท</span>
                            </div>
                            <p className="text-sm text-gray-500 text-right mt-2">ครบกำหนดชำระวันที่: {invoice.dueDate.toLocaleDateString('th-TH')}</p>
                        </div>
                    </section>
                    <footer className="text-center mt-12 pt-6 border-t">
                        <p className="text-gray-500">ขอบคุณที่ใช้บริการ</p>
                    </footer>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                    <button onClick={onClose} className="px-5 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">ปิด</button>
                    <button onClick={handlePrint} className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">พิมพ์</button>
                </div>
            </div>
        </div>
        </>
    );
};

const NewInvoiceForm: FC<{ tenants: Tenant[]; addInvoice: FinanceProps['addInvoice'] }> = ({ tenants, addInvoice }) => {
    const [selectedTenantId, setSelectedTenantId] = useState<string>('');
    const [period, setPeriod] = useState<string>(new Date().toLocaleString('th-TH', { month: 'long', year: 'numeric' }));
    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    const selectedTenant = tenants.find(t => t.id === selectedTenantId);
    const amount = selectedTenant?.monthlyRent || 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const result = addInvoice(selectedTenantId, period);
        if (result.startsWith('ข้อผิดพลาด')) {
            setMessage({ type: 'error', text: result });
        } else {
            setMessage({ type: 'success', text: result });
            setSelectedTenantId('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
            <h3 className="text-xl font-semibold text-gray-800">สร้างใบแจ้งหนี้ใหม่</h3>
            {message && (
                <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text}
                </div>
            )}
            <div>
                <label className="block text-sm font-medium text-gray-700">เลือกผู้เช่า</label>
                <select 
                    value={selectedTenantId}
                    onChange={e => setSelectedTenantId(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                >
                    <option value="" disabled>-- กรุณาเลือกผู้เช่า --</option>
                    {tenants.map(tenant => <option key={tenant.id} value={tenant.id}>{tenant.name} (ห้อง {tenant.roomId})</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">รอบบิล</label>
                <input 
                    type="text"
                    value={period}
                    onChange={e => setPeriod(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">จำนวนเงิน (บาท)</label>
                <input 
                    type="text" 
                    value={amount > 0 ? amount.toLocaleString('th-TH') : ''}
                    readOnly
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
                />
            </div>
            <button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 disabled:bg-gray-400" disabled={!selectedTenantId || !period}>
                สร้างใบแจ้งหนี้
            </button>
        </form>
    );
};

const expenseCategoryMap: Record<Expense['category'], string> = {
    'Utilities': 'ค่าสาธารณูปโภค',
    'Supplies': 'อุปกรณ์สิ้นเปลือง',
    'Maintenance': 'ค่าบำรุงรักษา',
    'Salaries': 'เงินเดือน'
};
const expenseCategories: Expense['category'][] = ['Utilities', 'Supplies', 'Maintenance', 'Salaries'];


interface ExpenseFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (details: any) => string;
    expense?: Expense;
    title: string;
}

const ExpenseFormModal: FC<ExpenseFormModalProps> = ({ isOpen, onClose, onSave, expense, title }) => {
    const [category, setCategory] = useState<Expense['category']>(expense?.category || 'Utilities');
    const [description, setDescription] = useState(expense?.description || '');
    const [amount, setAmount] = useState(expense?.amount.toString() || '');
    const [date, setDate] = useState(expense ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [message, setMessage] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const result = onSave({
            category,
            description,
            amount: parseFloat(amount),
            date: new Date(date),
            id: expense?.id
        });
        setMessage(result);
        if (!result.startsWith('ข้อผิดพลาด')) {
            setTimeout(() => {
                onClose();
                setMessage('');
            }, 1500);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 text-gray-800">{title}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {message && <p className={`p-3 rounded-lg text-sm ${message.startsWith('ข้อผิดพลาด') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message}</p>}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">หมวดหมู่</label>
                        <select value={category} onChange={e => setCategory(e.target.value as Expense['category'])} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                            {expenseCategories.map(cat => <option key={cat} value={cat}>{expenseCategoryMap[cat]}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">รายละเอียด</label>
                        <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">จำนวนเงิน (บาท)</label>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">วันที่</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">ยกเลิก</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">บันทึก</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const Finance: React.FC<FinanceProps> = ({ bookings, expenses, addExpense, updateExpense, deleteExpense, invoices, tenants, rooms, employees, attendance, addInvoice, financeDateFilter, setFinanceDateFilter }) => {
    const [activeTab, setActiveTab] = useState('สรุป');
    const tabs = ['สรุป', 'ใบแจ้งหนี้', 'เงินเดือนพนักงาน', 'รายการรายจ่าย', 'สร้างใบแจ้งหนี้'];
    
    // State for managing expenses
    const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
    const [expenseMessage, setExpenseMessage] = useState('');

    // State for filtering expenses
    const [expenseSearch, setExpenseSearch] = useState('');
    const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('All');
    const [expenseDateRange, setExpenseDateRange] = useState({ start: '', end: '' });

    // State for the new invoices tab
    const [invoiceSearch, setInvoiceSearch] = useState('');
    const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<'All' | 'Paid' | 'Unpaid'>('All');
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    
    // State for payroll
    const [payrollMessage, setPayrollMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);

    useEffect(() => {
        if (financeDateFilter) {
            // Pre-fill date filters and switch to the relevant tab
            const dateStr = financeDateFilter.toISOString().split('T')[0];
            setExpenseDateRange({ start: dateStr, end: dateStr });
            setActiveTab('รายการรายจ่าย');
            
            // Reset the filter in App state so it's a one-time event
            setFinanceDateFilter(null); 
        }
    }, [financeDateFilter, setFinanceDateFilter]);

    const { totalRevenue, totalExpense, netProfit } = useMemo(() => {
        const revenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
        const expense = expenses.reduce((sum, e) => sum + e.amount, 0);
        return {
            totalRevenue: revenue,
            totalExpense: expense,
            netProfit: revenue - expense,
        };
    }, [bookings, expenses]);
    
    const expenseByCategoryData = useMemo(() => {
        const categoryMap = expenses.reduce((acc, expense) => {
            const translatedCategory = expenseCategoryMap[expense.category];
            acc[translatedCategory] = (acc[translatedCategory] || 0) + expense.amount;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
    }, [expenses]);
    
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    const filteredInvoices = useMemo(() => {
        return invoices
            .filter(inv => {
                if (invoiceStatusFilter === 'All') return true;
                return inv.status === invoiceStatusFilter;
            })
            .filter(inv => {
                if (!invoiceSearch.trim()) return true;
                const tenant = tenants.find(t => t.id === inv.tenantId);
                const searchTerm = invoiceSearch.toLowerCase();
                return (
                    inv.id.toLowerCase().includes(searchTerm) ||
                    (tenant && tenant.name.toLowerCase().includes(searchTerm))
                );
            }).sort((a,b) => b.issueDate.getTime() - a.issueDate.getTime());
    }, [invoices, tenants, invoiceSearch, invoiceStatusFilter]);
    
    const filteredExpenses = useMemo(() => {
        return expenses
            .filter(expense => {
                const expenseDate = new Date(expense.date);
                expenseDate.setHours(0,0,0,0);
                const startDate = expenseDateRange.start ? new Date(expenseDateRange.start) : null;
                if(startDate) startDate.setHours(0,0,0,0);
                const endDate = expenseDateRange.end ? new Date(expenseDateRange.end) : null;
                if(endDate) endDate.setHours(0,0,0,0);

                const matchesSearch = expense.description.toLowerCase().includes(expenseSearch.toLowerCase());
                const matchesCategory = expenseCategoryFilter === 'All' || expense.category === expenseCategoryFilter;
                const matchesDate = (!startDate || expenseDate >= startDate) && (!endDate || expenseDate <= endDate);

                return matchesSearch && matchesCategory && matchesDate;
            })
            .sort((a,b) => b.date.getTime() - a.date.getTime());
    }, [expenses, expenseSearch, expenseCategoryFilter, expenseDateRange]);

    const payrollData = useMemo(() => {
        const today = new Date();
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthYear = lastMonth.getFullYear();
        const lastMonthIndex = lastMonth.getMonth();

        const activeEmployees = employees.filter(e => e.status === 'Active');

        const calculated = activeEmployees.map(emp => {
            const empAttendance = attendance.filter(a => 
                a.employeeId === emp.id &&
                new Date(a.date).getFullYear() === lastMonthYear &&
                new Date(a.date).getMonth() === lastMonthIndex
            );

            const presentDays = empAttendance.filter(a => a.status === 'Present').length;
            let calculatedPay = 0;
            if (emp.salaryType === 'Monthly') {
                calculatedPay = emp.salaryRate;
            } else {
                calculatedPay = emp.salaryRate * presentDays;
            }
            
            return {
                ...emp,
                presentDays,
                calculatedPay
            };
        });
        
        const totalPayroll = calculated.reduce((sum, emp) => sum + emp.calculatedPay, 0);
        const period = lastMonth.toLocaleString('th-TH', { month: 'long', year: 'numeric' });
        const payrollExpenseDesc = `เงินเดือนพนักงานประจำ${period}`;
        
        const isProcessed = expenses.some(exp => exp.description === payrollExpenseDesc && exp.category === 'Salaries');

        return {
            period,
            payrollExpenseDesc,
            employeePayroll: calculated,
            totalPayroll,
            isProcessed,
        };

    }, [employees, attendance, expenses]);
    
    const handleSaveExpense = (details: any): string => {
        if(editingExpense) {
           return updateExpense(details.id, details);
        } else {
           return addExpense(details.category, details.description, details.amount);
        }
    };
    
    const handleDeleteExpense = () => {
        if(expenseToDelete) {
            const result = deleteExpense(expenseToDelete.id);
            setExpenseMessage(result);
            setExpenseToDelete(null);
            setTimeout(() => setExpenseMessage(''), 3000);
        }
    };

    const handleProcessPayroll = () => {
        if (payrollData.isProcessed) {
            setPayrollMessage({ type: 'info', text: `เงินเดือนสำหรับ ${payrollData.period} ได้ถูกประมวลผลไปแล้ว`});
            return;
        }
        if (payrollData.totalPayroll <= 0) {
            setPayrollMessage({ type: 'error', text: 'ไม่มียอดเงินเดือนที่ต้องชำระ'});
            return;
        }

        const result = addExpense('Salaries', payrollData.payrollExpenseDesc, payrollData.totalPayroll);
        if (result.startsWith('ข้อผิดพลาด')) {
            setPayrollMessage({ type: 'error', text: result });
        } else {
            setPayrollMessage({ type: 'success', text: `ประมวลผลเงินเดือนสำหรับ ${payrollData.period} สำเร็จแล้ว` });
        }
    }


    const renderTabContent = () => {
        switch (activeTab) {
            case 'สรุป':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <FinanceCard title="รายรับทั้งหมด" amount={totalRevenue.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })} gradient="bg-gradient-to-br from-green-500 to-emerald-600" />
                            <FinanceCard title="รายจ่ายทั้งหมด" amount={totalExpense.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })} gradient="bg-gradient-to-br from-red-500 to-rose-600" />
                            <FinanceCard title="กำไรสุทธิ" amount={netProfit.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })} gradient="bg-gradient-to-br from-blue-500 to-indigo-600" />
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="p-4 bg-white border rounded-2xl">
                                 <h4 className="text-lg font-semibold text-gray-700 mb-4">รายจ่ายตามหมวดหมู่</h4>
                                 <div style={{ width: '100%', height: 250 }}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie data={expenseByCategoryData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label={(entry) => entry.name}>
                                                {expenseByCategoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip formatter={(value: number) => value.toLocaleString('th-TH')}/>
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="p-4 bg-white border rounded-2xl">
                                <h4 className="text-lg font-semibold text-gray-700 mb-4">รายการล่าสุด</h4>
                                <ul className="space-y-2 max-h-64 overflow-y-auto">
                                    {[...bookings, ...expenses].sort((a,b) => ('date' in b ? b.date.getTime() : b.checkInDate.getTime()) - ('date' in a ? a.date.getTime() : a.checkInDate.getTime())).slice(0, 10).map(item => 'totalPrice' in item ? (
                                        <li key={item.id} className="flex justify-between items-center text-sm p-2 bg-green-50 rounded-lg">
                                            <span>การจอง ID: {item.id}</span>
                                            <span className="font-semibold text-green-700">+ {item.totalPrice.toLocaleString('th-TH')}</span>
                                        </li>
                                    ) : (
                                        <li key={item.id} className="flex justify-between items-center text-sm p-2 bg-red-50 rounded-lg">
                                            <span>{item.description}</span>
                                            <span className="font-semibold text-red-700">- {item.amount.toLocaleString('th-TH')}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                );
            case 'ใบแจ้งหนี้':
                const invoiceStatusClasses: Record<Invoice['status'], string> = {
                    'Paid': 'bg-green-100 text-green-800',
                    'Unpaid': 'bg-red-100 text-red-800'
                };
                return (
                    <div className="space-y-4">
                         <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-3 md:space-y-0">
                            <input
                                type="text"
                                value={invoiceSearch}
                                onChange={e => setInvoiceSearch(e.target.value)}
                                placeholder="ค้นหาตามชื่อผู้เช่าหรือ ID..."
                                className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                aria-label="ค้นหาใบแจ้งหนี้"
                            />
                            <select
                                value={invoiceStatusFilter}
                                onChange={e => setInvoiceStatusFilter(e.target.value as any)}
                                className="px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                aria-label="กรองตามสถานะ"
                            >
                                <option value="All">สถานะทั้งหมด</option>
                                <option value="Paid">ชำระแล้ว</option>
                                <option value="Unpaid">ยังไม่ได้ชำระ</option>
                            </select>
                         </div>
                         <div className="overflow-x-auto">
                             <table className="w-full whitespace-nowrap">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="py-2 px-3 text-left text-sm font-semibold text-gray-600">ID</th>
                                        <th className="py-2 px-3 text-left text-sm font-semibold text-gray-600">ผู้เช่า</th>
                                        <th className="py-2 px-3 text-left text-sm font-semibold text-gray-600">รอบบิล</th>
                                        <th className="py-2 px-3 text-left text-sm font-semibold text-gray-600">จำนวนเงิน</th>
                                        <th className="py-2 px-3 text-left text-sm font-semibold text-gray-600">สถานะ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredInvoices.map(invoice => {
                                        const tenant = tenants.find(t => t.id === invoice.tenantId);
                                        return (
                                            <tr 
                                                key={invoice.id} 
                                                className="border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
                                                onClick={() => setSelectedInvoice(invoice)}
                                            >
                                                <td className="py-2 px-3 text-sm text-gray-500">{invoice.id}</td>
                                                <td className="py-2 px-3 text-sm text-gray-700 font-medium">{tenant?.name || 'N/A'}</td>
                                                <td className="py-2 px-3 text-sm text-gray-700">{invoice.period}</td>
                                                <td className="py-2 px-3 text-sm text-gray-700">{invoice.amount.toLocaleString('th-TH')}</td>
                                                <td className="py-2 px-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${invoiceStatusClasses[invoice.status]}`}>{invoice.status === 'Paid' ? 'ชำระแล้ว' : 'ยังไม่ได้ชำระ'}</span></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                             </table>
                         </div>
                    </div>
                );
            case 'เงินเดือนพนักงาน':
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg border">
                            <h3 className="text-lg font-semibold text-gray-800">สรุปเงินเดือนพนักงานสำหรับ {payrollData.period}</h3>
                            <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="text-gray-600">ยอดรวมที่ต้องชำระ:</p>
                                    <p className="text-3xl font-bold text-blue-600">{payrollData.totalPayroll.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}</p>
                                </div>
                                <button
                                    onClick={handleProcessPayroll}
                                    disabled={payrollData.isProcessed}
                                    className="mt-3 md:mt-0 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {payrollData.isProcessed ? 'ประมวลผลแล้ว' : 'ประมวลผลเงินเดือน'}
                                </button>
                            </div>
                             {payrollMessage && (
                                <div className={`mt-4 p-3 rounded-lg text-sm ${
                                    payrollMessage.type === 'success' ? 'bg-green-100 text-green-800' : 
                                    payrollMessage.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`
                                }>
                                    {payrollMessage.text}
                                </div>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full whitespace-nowrap">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="py-2 px-3 text-left text-sm font-semibold text-gray-600">ชื่อพนักงาน</th>
                                        <th className="py-2 px-3 text-left text-sm font-semibold text-gray-600">ตำแหน่ง</th>
                                        <th className="py-2 px-3 text-left text-sm font-semibold text-gray-600">ประเภทเงินเดือน</th>
                                        <th className="py-2 px-3 text-left text-sm font-semibold text-gray-600">การเข้างาน</th>
                                        <th className="py-2 px-3 text-left text-sm font-semibold text-gray-600">เงินเดือน (บาท)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payrollData.employeePayroll.map(emp => (
                                        <tr key={emp.id} className="border-b border-gray-200 hover:bg-gray-50">
                                            <td className="py-2 px-3 text-sm font-medium text-gray-800">{emp.name}</td>
                                            <td className="py-2 px-3 text-sm text-gray-600">{emp.position}</td>
                                            <td className="py-2 px-3 text-sm text-gray-600">{emp.salaryType === 'Monthly' ? `รายเดือน (${emp.salaryRate.toLocaleString()})` : `รายวัน (${emp.salaryRate.toLocaleString()})`}</td>
                                            <td className="py-2 px-3 text-sm text-gray-600">{emp.salaryType === 'Daily' ? `มาทำงาน ${emp.presentDays} วัน` : '-'}</td>
                                            <td className="py-2 px-3 text-sm font-semibold text-gray-800">{emp.calculatedPay.toLocaleString('th-TH')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'รายการรายจ่าย':
                return (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                             <h3 className="text-xl font-semibold text-gray-800">จัดการรายจ่าย</h3>
                             <button onClick={() => setIsAddExpenseModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">+ เพิ่มรายจ่าย</button>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg border grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input type="text" placeholder="ค้นหารายละเอียด..." value={expenseSearch} onChange={e => setExpenseSearch(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md"/>
                            <select value={expenseCategoryFilter} onChange={e => setExpenseCategoryFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md">
                                <option value="All">ทุกหมวดหมู่</option>
                                {expenseCategories.map(cat => <option key={cat} value={cat}>{expenseCategoryMap[cat]}</option>)}
                            </select>
                            <div className="flex items-center gap-2">
                                <input type="date" value={expenseDateRange.start} onChange={e => setExpenseDateRange({...expenseDateRange, start: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                                <span>-</span>
                                <input type="date" value={expenseDateRange.end} onChange={e => setExpenseDateRange({...expenseDateRange, end: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                            </div>
                        </div>
                        {expenseMessage && <p className="p-3 my-2 rounded-lg bg-green-100 text-green-700">{expenseMessage}</p>}
                        <div className="overflow-x-auto">
                            <table className="w-full whitespace-nowrap">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="py-2 px-3 text-left text-sm font-semibold text-gray-600">วันที่</th>
                                        <th className="py-2 px-3 text-left text-sm font-semibold text-gray-600">รายละเอียด</th>
                                        <th className="py-2 px-3 text-left text-sm font-semibold text-gray-600">หมวดหมู่</th>
                                        <th className="py-2 px-3 text-left text-sm font-semibold text-gray-600">จำนวนเงิน</th>
                                        <th className="py-2 px-3 text-left text-sm font-semibold text-gray-600">การกระทำ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredExpenses.map(exp => (
                                        <tr key={exp.id} className="border-b border-gray-200 hover:bg-gray-50">
                                            <td className="py-2 px-3 text-sm text-gray-600">{new Date(exp.date).toLocaleDateString('th-TH')}</td>
                                            <td className="py-2 px-3 text-sm font-medium text-gray-800">{exp.description}</td>
                                            <td className="py-2 px-3 text-sm text-gray-600">{expenseCategoryMap[exp.category]}</td>
                                            <td className="py-2 px-3 text-sm text-gray-800">{exp.amount.toLocaleString('th-TH')}</td>
                                            <td className="py-2 px-3 text-sm">
                                                <button onClick={() => setEditingExpense(exp)} className="text-blue-600 hover:text-blue-800 font-semibold">แก้ไข</button>
                                                <button onClick={() => setExpenseToDelete(exp)} className="text-red-600 hover:text-red-800 font-semibold ml-4">ลบ</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'สร้างใบแจ้งหนี้':
                return <NewInvoiceForm tenants={tenants} addInvoice={addInvoice} />;
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
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>
                <div>{renderTabContent()}</div>
            </div>
            {selectedInvoice && (
                <InvoiceModal 
                    invoice={selectedInvoice}
                    tenant={tenants.find(t => t.id === selectedInvoice.tenantId)}
                    room={rooms.find(r => r.id === tenants.find(t => t.id === selectedInvoice.tenantId)?.roomId)}
                    onClose={() => setSelectedInvoice(null)}
                />
            )}
             {(isAddExpenseModalOpen || editingExpense) && (
                <ExpenseFormModal
                    isOpen={isAddExpenseModalOpen || !!editingExpense}
                    onClose={() => { setIsAddExpenseModalOpen(false); setEditingExpense(null); }}
                    onSave={handleSaveExpense}
                    expense={editingExpense || undefined}
                    title={editingExpense ? 'แก้ไขรายจ่าย' : 'เพิ่มรายจ่ายใหม่'}
                />
            )}
            {expenseToDelete && (
                <ConfirmationDialog
                    isOpen={!!expenseToDelete}
                    onClose={() => setExpenseToDelete(null)}
                    onConfirm={handleDeleteExpense}
                    title="ยืนยันการลบรายจ่าย"
                    message={`คุณแน่ใจหรือไม่ว่าต้องการลบรายจ่าย "${expenseToDelete.description}"? การกระทำนี้ไม่สามารถย้อนกลับได้`}
                />
            )}
        </>
    );
};

export default Finance;