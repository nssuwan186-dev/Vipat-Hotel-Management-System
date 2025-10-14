import React, { useState, useMemo, FC, useEffect } from 'react';
import type { Booking, Expense, Employee, Attendance, Income, IncomeCategory, ExpenseCategory } from '../types';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ConfirmationDialog from './ConfirmationDialog';
import DataFormModal, { FormField } from './DataFormModal';

interface FinanceProps {
    bookings: Booking[];
    expenses: Expense[];
    income: Income[];
    expenseCategories: ExpenseCategory[];
    incomeCategories: IncomeCategory[];
    addExpense: (categoryId: string, description: string, amount: number, date: Date) => string;
    updateExpense: (expenseId: string, newDetails: { categoryId: string; description: string; amount: number; date: Date }) => string;
    deleteExpense: (expenseId: string) => string;
    addIncome: (categoryId: string, description: string, amount: number, date: Date) => string;
    updateIncome: (incomeId: string, newDetails: { categoryId: string; description: string; amount: number; date: Date }) => string;
    deleteIncome: (incomeId: string) => string;
    addExpenseCategory: (name: string) => string;
    updateExpenseCategory: (id: string, name: string) => string;
    deleteExpenseCategory: (id: string) => string;
    addIncomeCategory: (name: string) => string;
    updateIncomeCategory: (id: string, name: string) => string;
    deleteIncomeCategory: (id: string) => string;
    reorderIncomeCategory: (id: string, direction: 'up' | 'down') => string;
    reorderExpenseCategory: (id: string, direction: 'up' | 'down') => string;
    mergeIncomeCategory: (sourceId: string, targetId: string) => string;
    mergeExpenseCategory: (sourceId: string, targetId: string) => string;
    employees: Employee[];
    attendance: Attendance[];
    financeDateFilter: Date | null;
    setFinanceDateFilter: (date: Date | null) => void;
}


const FinanceCard: React.FC<{ title: string; amount: string; gradient: string }> = ({ title, amount, gradient }) => (
    <div className={`p-5 rounded-2xl shadow-lg text-white ${gradient}`}>
        <h4 className="text-md font-semibold text-white">{title}</h4>
        <p className="text-3xl font-bold mt-2">{amount}</p>
    </div>
);

interface TransactionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (details: any) => string;
    transaction?: Income | Expense;
    categories: IncomeCategory[] | ExpenseCategory[];
    title: string;
}

const TransactionFormModal: FC<TransactionFormModalProps> = ({ isOpen, onClose, onSave, transaction, categories, title }) => {
    const [categoryId, setCategoryId] = useState(transaction?.categoryId || '');
    const [description, setDescription] = useState(transaction?.description || '');
    const [amount, setAmount] = useState(transaction?.amount.toString() || '');
    const [date, setDate] = useState(transaction ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (isOpen) {
            setCategoryId(transaction?.categoryId || (categories.length > 0 ? categories[0].id : ''));
            setDescription(transaction?.description || '');
            setAmount(transaction?.amount?.toString() || '');
            setDate(transaction ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
            setMessage('');
        }
    }, [isOpen, transaction, categories]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const result = onSave({
            categoryId,
            description,
            amount: parseFloat(amount),
            date: new Date(date),
            id: transaction?.id
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
                        <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
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

interface MergeCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (targetCategoryId: string) => void;
    sourceCategory: IncomeCategory | ExpenseCategory;
    targetCategories: (IncomeCategory | ExpenseCategory)[];
}

const MergeCategoryModal: FC<MergeCategoryModalProps> = ({ isOpen, onClose, onConfirm, sourceCategory, targetCategories }) => {
    const [targetId, setTargetId] = useState<string>('');

    useEffect(() => {
        if (targetCategories.length > 0) {
            setTargetId(targetCategories[0].id);
        } else {
            setTargetId('');
        }
    }, [isOpen, targetCategories]);
    
    if (!isOpen) return null;

    const handleConfirm = (e: React.FormEvent) => {
        e.preventDefault();
        if (targetId) {
            onConfirm(targetId);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-2 text-gray-800">รวมหมวดหมู่ "{sourceCategory.name}"</h2>
                <p className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg mb-4">
                    <strong>คำเตือน:</strong> การกระทำนี้จะย้ายรายการทั้งหมดจาก "{sourceCategory.name}" ไปยังหมวดหมู่ที่คุณเลือก และจะลบหมวดหมู่ "{sourceCategory.name}" อย่างถาวร ไม่สามารถย้อนกลับได้
                </p>
                {targetCategories.length > 0 ? (
                    <form onSubmit={handleConfirm} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">รวมเข้ากับหมวดหมู่:</label>
                            <select value={targetId} onChange={e => setTargetId(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                {targetCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                            </select>
                        </div>
                        <div className="flex justify-end space-x-3 pt-2">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">ยกเลิก</button>
                            <button type="submit" className="px-4 py-2 bg-orange-600 text-white font-semibold rounded-lg shadow-md hover:bg-orange-700">ยืนยันการรวม</button>
                        </div>
                    </form>
                ) : (
                    <div>
                        <p className="text-gray-600">ไม่มีหมวดหมู่อื่นให้รวมเข้าด้วย</p>
                        <div className="flex justify-end pt-4">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">ปิด</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

interface CategoryManagerProps {
    incomeCategories: IncomeCategory[];
    expenseCategories: ExpenseCategory[];
    addIncomeCategory: (name: string) => string;
    updateIncomeCategory: (id: string, name: string) => string;
    deleteIncomeCategory: (id: string) => string;
    addExpenseCategory: (name: string) => string;
    updateExpenseCategory: (id: string, name: string) => string;
    deleteExpenseCategory: (id: string) => string;
    reorderIncomeCategory: (id: string, direction: 'up' | 'down') => string;
    reorderExpenseCategory: (id: string, direction: 'up' | 'down') => string;
    mergeIncomeCategory: (sourceId: string, targetId: string) => string;
    mergeExpenseCategory: (sourceId: string, targetId: string) => string;
}

const ArrowUpIcon: FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
  </svg>
);

const ArrowDownIcon: FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);


const CategoryManager: FC<CategoryManagerProps> = (props) => {
    const { incomeCategories, expenseCategories, addIncomeCategory, updateIncomeCategory, deleteIncomeCategory, addExpenseCategory, updateExpenseCategory, deleteExpenseCategory, reorderIncomeCategory, reorderExpenseCategory, mergeIncomeCategory, mergeExpenseCategory } = props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState<any>(null);
    const [itemToDelete, setItemToDelete] = useState<any>(null);
    const [itemToMerge, setItemToMerge] = useState<{ type: 'income' | 'expense', item: IncomeCategory | ExpenseCategory } | null>(null);
    const [message, setMessage] = useState('');

    const fields: FormField[] = [{ name: 'name', label: 'ชื่อหมวดหมู่', type: 'text', required: true }];

    const handleAdd = (type: 'income' | 'expense') => {
        setModalConfig({
            title: `เพิ่มหมวดหมู่${type === 'income' ? 'รายรับ' : 'รายจ่าย'}`,
            fields,
            initialData: null,
            onSubmit: (data: any) => type === 'income' ? addIncomeCategory(data.name) : addExpenseCategory(data.name)
        });
        setIsModalOpen(true);
    };

    const handleEdit = (type: 'income' | 'expense', item: IncomeCategory | ExpenseCategory) => {
        setModalConfig({
            title: `แก้ไขหมวดหมู่${type === 'income' ? 'รายรับ' : 'รายจ่าย'}`,
            fields,
            initialData: item,
            onSubmit: (data: any) => type === 'income' ? updateIncomeCategory(item.id, data.name) : updateExpenseCategory(item.id, data.name)
        });
        setIsModalOpen(true);
    };
    
    const handleDeleteConfirm = () => {
        if (!itemToDelete) return;
        const result = itemToDelete.type === 'income' ? deleteIncomeCategory(itemToDelete.item.id) : deleteExpenseCategory(itemToDelete.item.id);
        setMessage(result);
        setItemToDelete(null);
        setTimeout(() => setMessage(''), 3000);
    };

    const handleReorder = (type: 'income' | 'expense', id: string, direction: 'up' | 'down') => {
        const result = type === 'income' ? reorderIncomeCategory(id, direction) : reorderExpenseCategory(id, direction);
        // Do not show message for reorder, UI feedback is enough
    };

    const handleMergeConfirm = (targetId: string) => {
        if (!itemToMerge) return;
        const result = itemToMerge.type === 'income' 
            ? mergeIncomeCategory(itemToMerge.item.id, targetId)
            : mergeExpenseCategory(itemToMerge.item.id, targetId);
        setMessage(result);
        setItemToMerge(null);
        setTimeout(() => setMessage(''), 3000);
    };
    
    const renderCategoryTable = (type: 'income' | 'expense') => {
        const categories = type === 'income' ? incomeCategories : expenseCategories;
        return (
            <div className="p-4 border rounded-lg bg-white">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-lg font-semibold">{type === 'income' ? 'หมวดหมู่รายรับ' : 'หมวดหมู่รายจ่าย'}</h4>
                    <button onClick={() => handleAdd(type)} className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600">+ เพิ่ม</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <tbody>
                            {categories.map((cat, index) => (
                                <tr key={cat.id} className="border-b last:border-b-0 hover:bg-gray-50">
                                    <td className="py-2 px-3 text-sm">{cat.name}</td>
                                    <td className="py-2 px-3 text-right text-sm whitespace-nowrap">
                                        <button onClick={() => handleReorder(type, cat.id, 'up')} disabled={index === 0} className="p-1 rounded-full hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Move up">
                                            <ArrowUpIcon className="w-4 h-4 text-gray-600" />
                                        </button>
                                        <button onClick={() => handleReorder(type, cat.id, 'down')} disabled={index === categories.length - 1} className="p-1 rounded-full hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Move down">
                                            <ArrowDownIcon className="w-4 h-4 text-gray-600" />
                                        </button>
                                        <button onClick={() => setItemToMerge({ type, item: cat })} className="text-orange-600 font-medium ml-4 hover:underline">รวม</button>
                                        <button onClick={() => handleEdit(type, cat)} className="text-blue-600 font-medium ml-4 hover:underline">แก้ไข</button>
                                        <button onClick={() => setItemToDelete({ type, item: cat })} className="text-red-600 font-medium ml-4 hover:underline">ลบ</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="space-y-6">
                {message && <p className={`p-3 rounded-lg text-sm ${message.startsWith('ข้อผิดพลาด') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message}</p>}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {renderCategoryTable('income')}
                    {renderCategoryTable('expense')}
                </div>
            </div>
            {isModalOpen && <DataFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} {...modalConfig} />}
            {itemToDelete && <ConfirmationDialog isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} onConfirm={handleDeleteConfirm} title="ยืนยันการลบ" message={`คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่ "${itemToDelete.item.name}"?`} />}
            {itemToMerge && (
                <MergeCategoryModal
                    isOpen={!!itemToMerge}
                    onClose={() => setItemToMerge(null)}
                    onConfirm={handleMergeConfirm}
                    sourceCategory={itemToMerge.item}
                    targetCategories={(itemToMerge.type === 'income' ? incomeCategories : expenseCategories).filter(c => c.id !== itemToMerge.item.id)}
                />
            )}
        </>
    );
};

// Helper function to parse 'YYYY-MM-DD' strings as local date to avoid timezone issues.
const parseDateString = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    // Appending T00:00:00 ensures the date is parsed in the local timezone, not as UTC midnight.
    // This prevents off-by-one day errors in timezones west of UTC.
    return new Date(`${dateStr}T00:00:00`);
};


const Finance: React.FC<FinanceProps> = (props) => {
    const { bookings, expenses, income, expenseCategories, incomeCategories, addExpense, updateExpense, deleteExpense, addIncome, updateIncome, deleteIncome, addExpenseCategory, updateExpenseCategory, deleteExpenseCategory, addIncomeCategory, updateIncomeCategory, deleteIncomeCategory, reorderIncomeCategory, reorderExpenseCategory, mergeIncomeCategory, mergeExpenseCategory, employees, attendance, financeDateFilter, setFinanceDateFilter } = props;
    const [activeTab, setActiveTab] = useState('สรุป');
    const tabs = ['สรุป', 'รายการรายรับ', 'รายการรายจ่าย', 'เงินเดือนพนักงาน', 'จัดการหมวดหมู่'];
    
    const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Income | Expense | null>(null);
    const [transactionToDelete, setTransactionToDelete] = useState<{type: 'income' | 'expense', item: Income | Expense} | null>(null);
    const [transactionMessage, setTransactionMessage] = useState('');
    const [modalType, setModalType] = useState<'income' | 'expense'>('expense');
    
    const [expenseSearch, setExpenseSearch] = useState('');
    const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('All');
    const [expenseDateRange, setExpenseDateRange] = useState({ start: '', end: '' });

    const [incomeSearch, setIncomeSearch] = useState('');
    const [incomeCategoryFilter, setIncomeCategoryFilter] = useState('All');
    const [incomeDateRange, setIncomeDateRange] = useState({ start: '', end: '' });
    
    const [payrollMessage, setPayrollMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);

    useEffect(() => {
        if (financeDateFilter) {
            const dateStr = financeDateFilter.toISOString().split('T')[0];
            setExpenseDateRange({ start: dateStr, end: dateStr });
            setActiveTab('รายการรายจ่าย');
            setFinanceDateFilter(null); 
        }
    }, [financeDateFilter, setFinanceDateFilter]);

    const { totalRevenue, totalExpense, netProfit } = useMemo(() => {
        const bookingRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
        const otherIncome = income.reduce((sum, i) => sum + i.amount, 0);
        const revenue = bookingRevenue + otherIncome;
        const expense = expenses.reduce((sum, e) => sum + e.amount, 0);
        return {
            totalRevenue: revenue,
            totalExpense: expense,
            netProfit: revenue - expense,
        };
    }, [bookings, expenses, income]);
    
    const expenseByCategoryData = useMemo(() => {
        const categoryMap = expenses.reduce((acc, expense) => {
            const categoryName = expenseCategories.find(c => c.id === expense.categoryId)?.name || 'Uncategorized';
            acc[categoryName] = (acc[categoryName] || 0) + expense.amount;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
    }, [expenses, expenseCategories]);

    const incomeByCategoryData = useMemo(() => {
        const categoryMap = income.reduce((acc, item) => {
            const categoryName = incomeCategories.find(c => c.id === item.categoryId)?.name || 'Uncategorized';
            acc[categoryName] = (acc[categoryName] || 0) + item.amount;
            return acc;
        }, {} as Record<string, number>);
        
        return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
    }, [income, incomeCategories]);
    
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

    const filteredExpenses = useMemo(() => {
        return expenses
            .filter(expense => {
                const expenseDate = new Date(expense.date);
                expenseDate.setHours(0,0,0,0);
                const startDate = parseDateString(expenseDateRange.start);
                const endDate = parseDateString(expenseDateRange.end);
                if (endDate) endDate.setHours(23, 59, 59, 999); // Set to end of day for inclusive range

                const matchesSearch = expense.description.toLowerCase().includes(expenseSearch.toLowerCase());
                const matchesCategory = expenseCategoryFilter === 'All' || expense.categoryId === expenseCategoryFilter;
                const matchesDate = (!startDate || expenseDate >= startDate) && (!endDate || expenseDate <= endDate);

                return matchesSearch && matchesCategory && matchesDate;
            })
            .sort((a,b) => b.date.getTime() - a.date.getTime());
    }, [expenses, expenseSearch, expenseCategoryFilter, expenseDateRange]);

    const filteredIncome = useMemo(() => {
        return income
            .filter(item => {
                const itemDate = new Date(item.date);
                itemDate.setHours(0,0,0,0);
                const startDate = parseDateString(incomeDateRange.start);
                const endDate = parseDateString(incomeDateRange.end);
                if (endDate) endDate.setHours(23, 59, 59, 999); // Set to end of day for inclusive range

                const matchesSearch = item.description.toLowerCase().includes(incomeSearch.toLowerCase());
                const matchesCategory = incomeCategoryFilter === 'All' || item.categoryId === incomeCategoryFilter;
                const matchesDate = (!startDate || itemDate >= startDate) && (!endDate || itemDate <= endDate);

                return matchesSearch && matchesCategory && matchesDate;
            })
            .sort((a,b) => b.date.getTime() - a.date.getTime());
    }, [income, incomeSearch, incomeCategoryFilter, incomeDateRange]);


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
        
        const isProcessed = expenses.some(exp => exp.description === payrollExpenseDesc && exp.categoryId === expenseCategories.find(c => c.name === 'Salaries')?.id);

        return {
            period,
            payrollExpenseDesc,
            employeePayroll: calculated,
            totalPayroll,
            isProcessed,
        };

    }, [employees, attendance, expenses, expenseCategories]);
    
    const handleSaveTransaction = (details: any): string => {
        if(editingTransaction) {
           return modalType === 'income' ? updateIncome(details.id, details) : updateExpense(details.id, details);
        } else {
           return modalType === 'income' ? addIncome(details.categoryId, details.description, details.amount, details.date) : addExpense(details.categoryId, details.description, details.amount, details.date);
        }
    };
    
    const handleDeleteTransaction = () => {
        if(transactionToDelete) {
            const result = transactionToDelete.type === 'income' ? deleteIncome(transactionToDelete.item.id) : deleteExpense(transactionToDelete.item.id);
            setTransactionMessage(result);
            setTransactionToDelete(null);
            setTimeout(() => setTransactionMessage(''), 3000);
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

        const salaryCategory = expenseCategories.find(c => c.name === 'Salaries');
        if (!salaryCategory) {
            setPayrollMessage({ type: 'error', text: 'ไม่พบหมวดหมู่ "Salaries" กรุณาสร้างก่อน' });
            return;
        }

        const result = addExpense(salaryCategory.id, payrollData.payrollExpenseDesc, payrollData.totalPayroll, new Date());
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
                                 <h4 className="text-lg font-semibold text-gray-700 mb-4">รายรับตามหมวดหมู่</h4>
                                 <div style={{ width: '100%', height: 250 }}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie data={incomeByCategoryData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label={(entry) => entry.name}>
                                                {incomeByCategoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip formatter={(value: number) => value.toLocaleString('th-TH')}/>
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
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
                        </div>
                    </div>
                );
            case 'รายการรายรับ':
                return (
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-4 justify-between items-center">
                             <h3 className="text-xl font-semibold text-gray-800">จัดการรายรับ</h3>
                             <button onClick={() => { setModalType('income'); setIsAddTransactionModalOpen(true); }} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700">+ เพิ่มรายรับ</button>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg border grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input type="text" placeholder="ค้นหารายละเอียด..." value={incomeSearch} onChange={e => setIncomeSearch(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md"/>
                            <select value={incomeCategoryFilter} onChange={e => setIncomeCategoryFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md">
                                <option value="All">ทุกหมวดหมู่</option>
                                {incomeCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                            </select>
                            <div className="flex items-center gap-2">
                                <input type="date" value={incomeDateRange.start} onChange={e => setIncomeDateRange({...incomeDateRange, start: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                                <span>-</span>
                                <input type="date" value={incomeDateRange.end} onChange={e => setIncomeDateRange({...incomeDateRange, end: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                            </div>
                        </div>
                        {transactionMessage && <p className="p-3 my-2 rounded-lg bg-green-100 text-green-700">{transactionMessage}</p>}
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
                                    {filteredIncome.map(item => (
                                        <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                                            <td className="py-2 px-3 text-sm text-gray-600">{new Date(item.date).toLocaleDateString('th-TH')}</td>
                                            <td className="py-2 px-3 text-sm font-medium text-gray-800">{item.description}</td>
                                            <td className="py-2 px-3 text-sm text-gray-600">{incomeCategories.find(c=> c.id === item.categoryId)?.name || 'N/A'}</td>
                                            <td className="py-2 px-3 text-sm text-green-700 font-semibold">{item.amount.toLocaleString('th-TH')}</td>
                                            <td className="py-2 px-3 text-sm">
                                                <button onClick={() => { setModalType('income'); setEditingTransaction(item); }} className="text-blue-600 hover:text-blue-800 font-semibold">แก้ไข</button>
                                                <button onClick={() => setTransactionToDelete({type: 'income', item})} className="text-red-600 hover:text-red-800 font-semibold ml-4">ลบ</button>
                                            </td>
                                        </tr>
                                    ))}
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
                        <div className="flex flex-wrap gap-4 justify-between items-center">
                             <h3 className="text-xl font-semibold text-gray-800">จัดการรายจ่าย</h3>
                             <button onClick={() => { setModalType('expense'); setIsAddTransactionModalOpen(true); }} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">+ เพิ่มรายจ่าย</button>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg border grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input type="text" placeholder="ค้นหารายละเอียด..." value={expenseSearch} onChange={e => setExpenseSearch(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md"/>
                            <select value={expenseCategoryFilter} onChange={e => setExpenseCategoryFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md">
                                <option value="All">ทุกหมวดหมู่</option>
                                {expenseCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                            </select>
                            <div className="flex items-center gap-2">
                                <input type="date" value={expenseDateRange.start} onChange={e => setExpenseDateRange({...expenseDateRange, start: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                                <span>-</span>
                                <input type="date" value={expenseDateRange.end} onChange={e => setExpenseDateRange({...expenseDateRange, end: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                            </div>
                        </div>
                        {transactionMessage && <p className="p-3 my-2 rounded-lg bg-green-100 text-green-700">{transactionMessage}</p>}
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
                                            <td className="py-2 px-3 text-sm text-gray-600">{expenseCategories.find(c => c.id === exp.categoryId)?.name || 'N/A'}</td>
                                            <td className="py-2 px-3 text-sm text-red-700 font-semibold">{exp.amount.toLocaleString('th-TH')}</td>
                                            <td className="py-2 px-3 text-sm">
                                                <button onClick={() => { setModalType('expense'); setEditingTransaction(exp); }} className="text-blue-600 hover:text-blue-800 font-semibold">แก้ไข</button>
                                                <button onClick={() => setTransactionToDelete({type: 'expense', item: exp})} className="text-red-600 hover:text-red-800 font-semibold ml-4">ลบ</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'จัดการหมวดหมู่':
                return <CategoryManager 
                    incomeCategories={incomeCategories}
                    expenseCategories={expenseCategories}
                    addIncomeCategory={addIncomeCategory}
                    updateIncomeCategory={updateIncomeCategory}
                    deleteIncomeCategory={deleteIncomeCategory}
                    addExpenseCategory={addExpenseCategory}
                    updateExpenseCategory={updateExpenseCategory}
                    deleteExpenseCategory={deleteExpenseCategory}
                    reorderIncomeCategory={reorderIncomeCategory}
                    reorderExpenseCategory={reorderExpenseCategory}
                    mergeIncomeCategory={mergeIncomeCategory}
                    mergeExpenseCategory={mergeExpenseCategory}
                />;
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
             {(isAddTransactionModalOpen || editingTransaction) && (
                <TransactionFormModal
                    isOpen={isAddTransactionModalOpen || !!editingTransaction}
                    onClose={() => { setIsAddTransactionModalOpen(false); setEditingTransaction(null); }}
                    onSave={handleSaveTransaction}
                    transaction={editingTransaction || undefined}
                    categories={modalType === 'income' ? incomeCategories : expenseCategories}
                    title={editingTransaction ? `แก้ไข${modalType === 'income' ? 'รายรับ' : 'รายจ่าย'}` : `เพิ่ม${modalType === 'income' ? 'รายรับ' : 'รายจ่าย'}ใหม่`}
                />
            )}
            {transactionToDelete && (
                <ConfirmationDialog
                    isOpen={!!transactionToDelete}
                    onClose={() => setTransactionToDelete(null)}
                    onConfirm={handleDeleteTransaction}
                    title={`ยืนยันการลบ${transactionToDelete.type === 'income' ? 'รายรับ' : 'รายจ่าย'}`}
                    message={`คุณแน่ใจหรือไม่ว่าต้องการลบรายการ "${transactionToDelete.item.description}"? การกระทำนี้ไม่สามารถย้อนกลับได้`}
                />
            )}
        </>
    );
};

export default Finance;