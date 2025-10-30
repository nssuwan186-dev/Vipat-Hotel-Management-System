import React, { useState, useEffect } from 'react';
import type { Booking, Guest, Room, Task, Employee, TaskStatus, RoomStatusFilter } from '../types';
import Bookings from './Bookings';
import Tasks from './Tasks';
import RoomStatusView from './RoomStatusView';

interface OperationsProps {
    bookings: Booking[];
    guests: Guest[];
    rooms: Room[];
    tasks: Task[];
    employees: Employee[];
    updateBooking: (bookingId: string, newDetails: any) => Promise<string>;
    deleteBooking: (bookingId: string) => Promise<string>;
    addTask: (description: string, assignedTo: string, relatedTo: string, dueDate?: string) => Promise<string>;
    updateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
    bookingRoomFilter: string | null;
    setBookingRoomFilter: (roomId: string | null) => void;
    roomStatusFilter: RoomStatusFilter;
    setRoomStatusFilter: (filter: RoomStatusFilter) => void;
}

const Operations: React.FC<OperationsProps> = (props) => {
    const [activeTab, setActiveTab] = useState('สถานะห้องพัก');
    const tabs = ['สถานะห้องพัก', 'การจอง', 'การจัดการงาน'];
    
    useEffect(() => {
        if (props.bookingRoomFilter) {
            setActiveTab('การจอง');
        } else if (props.roomStatusFilter) {
            setActiveTab('สถานะห้องพัก');
        }
    }, [props.bookingRoomFilter, props.roomStatusFilter]);

    const renderTabContent = () => {
        switch(activeTab) {
            case 'สถานะห้องพัก':
                return <RoomStatusView
                    rooms={props.rooms}
                    roomStatusFilter={props.roomStatusFilter}
                    setRoomStatusFilter={props.setRoomStatusFilter}
                />;
            case 'การจอง':
                return <Bookings 
                    bookings={props.bookings}
                    guests={props.guests}
                    rooms={props.rooms}
                    updateBooking={props.updateBooking}
                    deleteBooking={props.deleteBooking}
                    bookingRoomFilter={props.bookingRoomFilter}
                    setBookingRoomFilter={props.setBookingRoomFilter}
                />;
            case 'การจัดการงาน':
                return <Tasks
                    tasks={props.tasks}
                    employees={props.employees}
                    rooms={props.rooms}
                    addTask={props.addTask as any} // Cast to satisfy simple string return for now
                    updateTaskStatus={props.updateTaskStatus}
                />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg">
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto">
                        {tabs.map(tab => (
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
                <div>
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
};

export default Operations;
