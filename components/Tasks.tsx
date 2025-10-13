import React, { useState, useMemo } from 'react';
import type { Task, TaskStatus, Employee, Room } from '../types';

interface TaskCardProps {
    task: Task;
    employee?: Employee;
    room?: Room;
    onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, employee, room, onStatusChange }) => {
    
    const statusOptions: TaskStatus[] = ['To Do', 'In Progress', 'Done'];

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onStatusChange(task.id, e.target.value as TaskStatus);
    };
    
    return (
        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200 hover:shadow-lg hover:border-blue-400 transition-all duration-300 space-y-3">
            <p className="font-semibold text-gray-800 leading-snug">{task.description}</p>
            <div className="text-sm text-gray-500 space-y-1 border-t pt-3">
                <p><strong>ห้อง:</strong> {room?.number || 'N/A'}</p>
                <p><strong>ผู้รับผิดชอบ:</strong> {employee?.name || 'N/A'}</p>
                {task.dueDate && <p><strong>ครบกำหนด:</strong> {new Date(task.dueDate).toLocaleDateString('th-TH')}</p>}
            </div>
            <select 
                value={task.status} 
                onChange={handleSelectChange}
                className="mt-2 w-full text-sm font-semibold p-1 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                ))}
            </select>
        </div>
    );
};

interface NewTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    employees: Employee[];
    rooms: Room[];
    addTask: (description: string, assignedTo: string, relatedTo: string, dueDate?: string) => string;
}

const NewTaskModal: React.FC<NewTaskModalProps> = ({ isOpen, onClose, employees, rooms, addTask }) => {
    const [description, setDescription] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [relatedTo, setRelatedTo] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [message, setMessage] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const result = addTask(description, assignedTo, relatedTo, dueDate);
        setMessage(result);
        if (!result.startsWith('ข้อผิดพลาด')) {
            setDescription('');
            setAssignedTo('');
            setRelatedTo('');
            setDueDate('');
            setTimeout(() => {
                onClose();
                setMessage('');
            }, 1500);
        }
    };
    
    const activeEmployees = employees.filter(e => e.status === 'Active');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 text-gray-800">สร้างงานใหม่</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {message && <p className={`p-3 rounded-lg text-sm ${message.startsWith('ข้อผิดพลาด') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message}</p>}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">รายละเอียดงาน</label>
                        <textarea 
                            id="description"
                            value={description} 
                            onChange={e => setDescription(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">มอบหมายให้</label>
                        <select id="assignedTo" value={assignedTo} onChange={e => setAssignedTo(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                            <option value="" disabled>-- เลือกพนักงาน --</option>
                            {activeEmployees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="relatedTo" className="block text-sm font-medium text-gray-700">เกี่ยวข้องกับห้อง</label>
                        <select id="relatedTo" value={relatedTo} onChange={e => setRelatedTo(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                            <option value="" disabled>-- เลือกห้อง --</option>
                            {rooms.map(room => <option key={room.id} value={room.id}>{room.number}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">วันครบกำหนด (ไม่บังคับ)</label>
                        <input id="dueDate" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">ยกเลิก</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">สร้างงาน</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

interface TasksProps {
    tasks: Task[];
    employees: Employee[];
    rooms: Room[];
    addTask: (description: string, assignedTo: string, relatedTo: string, dueDate?: string) => string;
    updateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
}

const Tasks: React.FC<TasksProps> = ({ tasks, employees, rooms, addTask, updateTaskStatus }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const taskColumns = useMemo(() => {
        const sortedTasks = tasks.sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
        return {
            'To Do': sortedTasks.filter(t => t.status === 'To Do'),
            'In Progress': sortedTasks.filter(t => t.status === 'In Progress'),
            'Done': sortedTasks.filter(t => t.status === 'Done'),
        };
    }, [tasks]);
    
    const columnTitles: Record<TaskStatus, {title: string, textColor: string, countColor: string}> = {
        'To Do': { title: 'ต้องทำ', textColor: 'text-red-600', countColor: 'bg-red-100 text-red-700' },
        'In Progress': { title: 'กำลังทำ', textColor: 'text-yellow-600', countColor: 'bg-yellow-100 text-yellow-700' },
        'Done': { title: 'เสร็จแล้ว', textColor: 'text-green-600', countColor: 'bg-green-100 text-green-700' },
    }

    return (
        <>
            <div className="p-4 sm:p-6 bg-white rounded-2xl shadow-lg">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">กระดานจัดการงาน</h2>
                    <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">
                        + เพิ่มงานใหม่
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {(Object.keys(columnTitles) as TaskStatus[]).map(status => (
                        <div key={status} className="bg-gray-100/70 p-4 rounded-xl flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className={`font-semibold text-md ${columnTitles[status].textColor}`}>
                                    {columnTitles[status].title}
                                </h3>
                                <span className={`text-sm font-bold px-2 py-1 rounded-full ${columnTitles[status].countColor}`}>
                                    {taskColumns[status].length}
                                </span>
                            </div>
                            <div className="space-y-4 flex-1 h-96 overflow-y-auto pr-2 -mr-2">
                                {taskColumns[status].length > 0 ? (
                                    taskColumns[status].map(task => (
                                        <TaskCard 
                                            key={task.id} 
                                            task={task}
                                            employee={employees.find(e => e.id === task.assignedTo)}
                                            room={rooms.find(r => r.id === task.relatedTo)}
                                            onStatusChange={updateTaskStatus}
                                        />
                                    ))
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-center text-gray-500 mt-4">ไม่มีงานในสถานะนี้</p>
                                    </div>
                                )}
                            </div>
                        </div>
                   ))}
                </div>
            </div>
            
            <NewTaskModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                employees={employees}
                rooms={rooms}
                addTask={addTask}
            />
        </>
    );
};

export default Tasks;
