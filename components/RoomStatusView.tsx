import React, { useMemo, useEffect, useState } from 'react';
import type { Room, RoomStatus, RoomStatusFilter } from '../types';
import { BedIcon } from './icons/Icons';

interface RoomStatusViewProps {
    rooms: Room[];
    roomStatusFilter: RoomStatusFilter;
    setRoomStatusFilter: (filter: RoomStatusFilter) => void;
}

const RoomCard: React.FC<{ room: Room }> = ({ room }) => {
    const statusClasses: Record<RoomStatus, { bg: string, text: string, border: string }> = {
        'ว่าง': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
        'ไม่ว่าง': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
        'ทำความสะอาด': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
        'เช่ารายเดือน': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' }
    };

    const statusStyle = statusClasses[room.status];

    return (
        <div className={`p-4 rounded-xl border ${statusStyle.border} ${statusStyle.bg} shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">{room.number}</h3>
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${statusStyle.bg} ${statusStyle.text}`}>{room.status}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{room.type}</p>
            <div className="flex items-center text-gray-700 mt-3 pt-3 border-t border-gray-200/80">
                <BedIcon className="w-4 h-4 mr-2" />
                <span className="text-sm font-semibold">{room.price.toLocaleString('th-TH')} THB/คืน</span>
            </div>
        </div>
    );
};

const RoomStatusView: React.FC<RoomStatusViewProps> = ({ rooms, roomStatusFilter, setRoomStatusFilter }) => {
    const [currentFilter, setCurrentFilter] = useState<RoomStatus | 'all'>('all');

    useEffect(() => {
        if (roomStatusFilter === 'available') {
            setCurrentFilter('ว่าง');
        } else if (roomStatusFilter === 'occupied') {
            setCurrentFilter('ไม่ว่าง');
        } else {
             setCurrentFilter('all');
        }
    }, [roomStatusFilter]);


    const filteredRooms = useMemo(() => {
        if (currentFilter === 'all') {
            return rooms;
        }
        if (currentFilter === 'ว่าง') { // 'available' from dashboard
             return rooms.filter(room => room.status === 'ว่าง' || room.status === 'ทำความสะอาด');
        }
         if (currentFilter === 'ไม่ว่าง') { // 'occupied' from dashboard
             return rooms.filter(room => room.status === 'ไม่ว่าง' || room.status === 'เช่ารายเดือน');
        }
        return rooms.filter(room => room.status === currentFilter);
    }, [rooms, currentFilter]);

    const handleFilterChange = (filter: RoomStatus | 'all') => {
        setRoomStatusFilter(null); // Clear the dashboard filter
        setCurrentFilter(filter);
    }
    
    const FilterButton: React.FC<{ filter: RoomStatus | 'all', label: string }> = ({ filter, label }) => (
        <button
            onClick={() => handleFilterChange(filter)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                currentFilter === filter ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
                <FilterButton filter="all" label="ห้องทั้งหมด" />
                <FilterButton filter="ว่าง" label="ว่าง" />
                <FilterButton filter="ไม่ว่าง" label="ไม่ว่าง" />
                <FilterButton filter="ทำความสะอาด" label="ทำความสะอาด" />
                 {roomStatusFilter && (
                    <button
                        onClick={() => setRoomStatusFilter(null)}
                        className="text-sm text-red-600 hover:underline ml-4"
                    >
                        ล้างตัวกรอง
                    </button>
                )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredRooms.sort((a,b) => a.number.localeCompare(b.number)).map(room => (
                    <RoomCard key={room.id} room={room} />
                ))}
            </div>
            {filteredRooms.length === 0 && (
                 <div className="text-center py-10 col-span-full">
                    <p className="text-gray-500">ไม่พบห้องที่ตรงกับตัวกรองที่เลือก</p>
                </div>
            )}
        </div>
    );
};

export default RoomStatusView;