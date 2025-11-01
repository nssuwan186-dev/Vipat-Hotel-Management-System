import React, { useState } from 'react';
import type { Income, Expense, PaymentMethod, ExpenseCategory } from '../types';
import DataFormModal, { FormField } from './DataFormModal';

interface FinanceProps {
    income: Income[];
    expenses: Expense[];
    dateFilter: Date | null;
    setDateFilter: (date: Date | null) => void;
    addIncome: (description: string, paymentMethod: PaymentMethod, amount: number, date: string) => Promise<string>;
    addExpense: (category: ExpenseCategory, description: string, amount: number, date: string) => Promise<string>;
}

const FinanceCard: React.FC<{ title: string; amount: number; color: string }> = ({ title, amount, color }) => (
    <div className="bg-white p-4 rounded-xl shadow-md border">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className={`text-2xl font-bold mt-1 ${color}`}>{amount.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}</p>
    </div>
);

const incomeFields: FormField[] = [
    { name: 'date', label: 'วันที่', type: 'date', required: true },
    { name: 'description', label: 'รายละเอียด', type: 'text', required: true },
    { name: 'paymentMethod', label: 'ช่องทางการชำระเงิน', type: 'select', required: true, options: [
        { value: 'เงินสด', label: 'เงินสด' },
        { value: 'โอน', label: 'โอน' },
        { value: 'บัตรเครดิต', label: 'บัตรเครดิต' },
    ]},
    { name: 'amount', label: 'จำนวนเงิน', type: 'number', required: true },
];

const expenseFields: FormField[] = [
    { name: 'date', label: 'วันที่', type: 'date', required: true },
    { name: 'category', label: 'หมวดหมู่', type: 'select', required: true, options: [
        { value: 'เงินเดือน', label: 'เงินเดือน' },
        { value: 'สาธารณูปโภค', label: 'สาธารณูปโภค' },
        { value: 'การตลาด', label: 'การตลาด' },
        { value: 'ซ่อมบำรุง', label: 'ซ่อมบำรุง' },
        { value: 'อื่นๆ', label: 'อื่นๆ' },
    ]},
    { name: 'description', label: 'รายละเอียด', type: 'text', required: true },
    { name: 'amount', label: 'จำนวนเงิน', type: 'number', required: true },
];

const Finance: React.FC<FinanceProps> = ({ income, expenses, dateFilter, setDateFilter, addIncome, addExpense }) => {
    const [activeTab, setActiveTab] = React.useState('ภาพรวม');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState<any>(null);
    
    const filteredIncome = dateFilter ? income.filter(i => new Date(i.date).toDateString() === dateFilter.toDateString()) : income;
    const filteredExpenses = dateFilter ? expenses.filter(e => new Date(e.date).toDateString() === dateFilter.toDateString()) : expenses;

    const totalIncome = filteredIncome.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
    const netProfit = totalIncome - totalExpenses;

    const handleAddClick = () => {
        const today = new Date().toISOString().split('T')[0];
        if (activeTab === 'รายรับ') {
            setModalConfig({
                title: 'เพิ่มรายการรับใหม่',
                fields: incomeFields,
                initialData: { date: today },
                onSubmit: (data: any) => addIncome(data.description, data.paymentMethod, data.amount, data.date)
            });
        } else if (activeTab === 'รายจ่าย') {
            setModalConfig({
                title: 'เพิ่มรายการจ่ายใหม่',
                fields: expenseFields,
                initialData: { date: today },
                onSubmit: (data: any) => addExpense(data.category, data.description, data.amount, data.date)
            });
        }
        setIsModalOpen(true);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'รายรับ':
                return (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-100/70">
                                <tr>
                                    <th className="p-3 text-left text-sm font-semibold text-gray-600">วันที่</th>
                                    <th className="p-3 text-left text-sm font-semibold text-gray-600">รายละเอียด</th>
                                    <th className="p-3 text-left text-sm font-semibold text-gray-600">ช่องทาง</th>
                                    <th className="p-3 text-right text-sm font-semibold text-gray-600">จำนวนเงิน</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredIncome.map(item => (
                                    <tr key={item.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3 text-sm">{new Date(item.date).toLocaleDateString('th-TH')}</td>
                                        <td className="p-3 text-sm">{item.description}</td>
                                        <td className="p-3 text-sm">{item.paymentMethod}</td>
                                        <td className="p-3 text-sm text-right font-medium text-green-600">{item.amount.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            case 'รายจ่าย':
                 return (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-100/70">
                                <tr>
                                    <th className="p-3 text-left text-sm font-semibold text-gray-600">วันที่</th>
                                    <th className="p-3 text-left text-sm font-semibold text-gray-600">หมวดหมู่</th>
                                    <th className="p-3 text-left text-sm font-semibold text-gray-600">รายละเอียด</th>
                                    <th className="p-3 text-right text-sm font-semibold text-gray-600">จำนวนเงิน</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExpenses.map(item => (
                                    <tr key={item.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3 text-sm">{new Date(item.date).toLocaleDateString('th-TH')}</td>
                                        <td className="p-3 text-sm">{item.category}</td>
                                        <td className="p-3 text-sm">{item.description}</td>
                                        <td className="p-3 text-sm text-right font-medium text-red-600">{item.amount.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            case 'ภาพรวม':
            default:
                return (
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <FinanceCard title="รายรับรวม" amount={totalIncome} color="text-green-600" />
                            <FinanceCard title="รายจ่ายรวม" amount={totalExpenses} color="text-red-600" />
                            <FinanceCard title="กำไรสุทธิ" amount={netProfit} color={netProfit >= 0 ? "text-blue-600" : "text-red-600"} />
                        </div>
                        <p className="text-sm text-gray-600">
                            {dateFilter ? `กำลังแสดงข้อมูลสำหรับวันที่ ${dateFilter.toLocaleDateString('th-TH')}` : "กำลังแสดงข้อมูลทั้งหมด"}
                        </p>
                    </div>
                )
        }
    };

    return (
        <>
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                     <div className="border-b sm:border-b-0 w-full sm:w-auto">
                        <nav className="-mb-px flex space-x-6">
                            {['ภาพรวม', 'รายรับ', 'รายจ่าย'].map(tab => (
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
                    {activeTab !== 'ภาพรวม' && (
                        <button
                            onClick={handleAddClick}
                            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 w-full sm:w-auto shrink-0"
                        >
                            {activeTab === 'รายรับ' ? '+ เพิ่มรายรับ' : '+ เพิ่มรายจ่าย'}
                        </button>
                    )}
                </div>
                {renderContent()}
            </div>
            {isModalOpen && modalConfig && (
                <DataFormModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    {...modalConfig}
                />
            )}
        </>
    );
};

export default Finance;
