import React, { useState, useEffect, FC } from 'react';

export interface FormField {
    name: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select' | 'textarea';
    options?: { value: string | number; label:string }[];
    required?: boolean;
    disabled?: boolean;
    placeholder?: string;
}

interface DataFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: any) => string;
    title: string;
    initialData: any | null;
    fields: FormField[];
}

const DataFormModal: FC<DataFormModalProps> = ({ isOpen, onClose, onSubmit, title, initialData, fields }) => {
    const [formData, setFormData] = useState<any>({});
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (isOpen) {
            const initial = fields.reduce((acc, field) => {
                let value = initialData?.[field.name] ?? '';
                if (field.type === 'date' && value instanceof Date) {
                    value = value.toISOString().split('T')[0];
                }
                acc[field.name] = value;
                return acc;
            }, {} as any);
            setFormData(initial);
            setMessage('');
        }
    }, [isOpen, initialData, fields]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        // @ts-ignore
        const finalValue = (type === 'number' && value !== '') ? parseFloat(value) : value;
        setFormData({ ...formData, [name]: finalValue });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const result = onSubmit(formData);
        setMessage(result);
        if (!result.startsWith('ข้อผิดพลาด')) {
            setTimeout(() => {
                onClose();
            }, 1500);
        }
    };

    const renderField = (field: FormField) => {
        const commonProps = {
            id: field.name,
            name: field.name,
            value: formData[field.name] ?? '',
            onChange: handleChange,
            required: field.required,
            disabled: field.disabled,
            placeholder: field.placeholder || '',
            className: "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        };
        
        if (field.type === 'select') {
            return (
                <select {...commonProps}>
                    <option value="" disabled>-- กรุณาเลือก --</option>
                    {field.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            );
        }
        
        return <input type={field.type} {...commonProps} />;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 text-gray-800">{title}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {message && <p className={`p-3 rounded-lg text-sm ${message.startsWith('ข้อผิดพลาด') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message}</p>}
                    {fields.map(field => (
                        <div key={field.name}>
                            <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">{field.label}</label>
                            {renderField(field)}
                        </div>
                    ))}
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">ยกเลิก</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">บันทึก</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DataFormModal;