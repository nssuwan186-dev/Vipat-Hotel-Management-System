import React, { useState, useEffect, FC } from 'react';

interface NewBookingModalProps {
    isOpen: boolean;
    onClose: (bookingMade?: boolean) => void;
    addBooking: (guestName: string, phone: string, roomNumber: string, checkIn: string, checkOut: string) => Promise<string>;
    selectedDate: Date;
}

const NewBookingModal: FC<NewBookingModalProps> = ({ isOpen, onClose, addBooking, selectedDate }) => {
    const [guestName, setGuestName] = useState('');
    const [phone, setPhone] = useState('');
    const [roomNumber, setRoomNumber] = useState('');
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (selectedDate) {
            setCheckIn(selectedDate.toISOString().split('T')[0]);
        }
    }, [selectedDate]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        if (!guestName || !phone || !roomNumber || !checkIn || !checkOut) {
            setMessage("ข้อผิดพลาด: กรุณากรอกข้อมูลให้ครบถ้วน");
            return;
        }
        const result = await addBooking(guestName, phone, roomNumber, checkIn, checkOut);
        setMessage(result);
        if (result.includes("สำเร็จแล้ว")) {
            setGuestName('');
            setPhone('');
            setRoomNumber('');
            setCheckIn('');
            setCheckOut('');
            setTimeout(() => onClose(true), 1500);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[60] p-4" onClick={() => onClose()}>
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 text-gray-800">ลงทะเบียนการจองใหม่</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {message && <p className={`p-3 rounded-lg text-sm ${message.startsWith('ข้อผิดพลาด') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message}</p>}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">ชื่อผู้เข้าพัก</label>
                        <input type="text" value={guestName} onChange={e => setGuestName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">หมายเลขห้อง</label>
                        <input type="text" value={roomNumber} onChange={e => setRoomNumber(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">วันที่เช็คอิน</label>
                        <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">วันที่เช็คเอาท์</label>
                        <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={() => onClose()} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">ยกเลิก</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">สร้างการจอง</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewBookingModal;
