import React, { useState, useEffect } from 'react';
import type { FormField } from '../types';

export type { FormField };

interface DataFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fields: FormField[];
  initialData?: any | null;
  onSubmit: (data: any) => string; // Returns a message
}

const DataFormModal: React.FC<DataFormModalProps> = ({ isOpen, onClose, title, fields, initialData, onSubmit }) => {
    const [formData, setFormData] = useState<any>({});
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (initialData) {
            // Pre-format date fields for the input[type=date]
            const formattedData = { ...initialData };
            fields.forEach(field => {
                if (field.type === 'date' && initialData[field.name]) {
                    formattedData[field.name] = new Date(initialData[field.name]).toISOString().split('T')[0];
                }
            });
            setFormData(formattedData);
        } else {
            // Set default values for a new form
            const defaultState: { [key: string]: any } = {};
            fields.forEach(field => {
                defaultState[field.name] = '';
            });
            setFormData(defaultState);
        }
    }, [initialData, fields]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const result = onSubmit(formData);
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
                    {fields.map(field => (
                        <div key={field.name}>
                            <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">{field.label}</label>
                            {field.type === 'select' ? (
                                <select 
                                    id={field.name}
                                    name={field.name}
                                    value={formData[field.name] || ''}
                                    onChange={handleChange}
                                    required={field.required}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="" disabled>-- {field.label} --</option>
                                    {field.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            ) : (
                                <input
                                    type={field.type}
                                    id={field.name}
                                    name={field.name}
                                    value={formData[field.name] || ''}
                                    onChange={handleChange}
                                    required={field.required}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            )}
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
