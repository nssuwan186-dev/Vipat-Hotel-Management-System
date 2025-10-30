import React, { useState, useCallback } from 'react';
import type { Page, Room, Booking, Guest, Task, Employee, Tenant, Income, Expense, Invoice, GeneratedDocument, RoomStatusFilter } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Operations from './components/Operations';
import Finance from './components/Finance';
import People from './components/People';
import Reports from './components/Reports';
import { mockRooms, mockBookings, mockGuests, mockTasks, mockEmployees, mockTenants, mockIncome, mockExpenses, mockInvoices, SIMULATED_TODAY } from './data/mockData';

const App: React.FC = () => {
    // State Management
    const [currentPage, setCurrentPage] = useState<Page>('ภาพรวม');
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    // Data State
    const [rooms, setRooms] = useState<Room[]>(mockRooms);
    const [bookings, setBookings] = useState<Booking[]>(mockBookings);
    const [guests, setGuests] = useState<Guest[]>(mockGuests);
    const [tasks, setTasks] = useState<Task[]>(mockTasks);
    const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
    const [tenants, setTenants] = useState<Tenant[]>(mockTenants);
    const [income, setIncome] = useState<Income[]>(mockIncome);
    const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
    const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
    const [documents, setDocuments] = useState<GeneratedDocument[]>([]);

    // Cross-component state/filters
    const [latestAiBookingId, setLatestAiBookingId] = useState<string | null>(null);
    const [financeDateFilter, setFinanceDateFilter] = useState<Date | null>(null);
    const [bookingRoomFilter, setBookingRoomFilter] = useState<string | null>(null);
    const [roomStatusFilter, setRoomStatusFilter] = useState<RoomStatusFilter>(null);

    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

    // --- Data Manipulation Callbacks ---

    const addBooking = useCallback(async (guestName: string, phone: string, roomNumber: string, checkInStr: string, checkOutStr: string, source: 'ai' | 'manual' = 'manual'): Promise<string> => {
        const room = rooms.find(r => r.number.toLowerCase() === roomNumber.toLowerCase());
        if (!room) return `ข้อผิดพลาด: ไม่พบห้องหมายเลข ${roomNumber}`;

        const checkIn = new Date(checkInStr);
        const checkOut = new Date(checkOutStr);

        const isOccupied = bookings.some(b => b.roomId === room.id && new Date(b.checkInDate) < checkOut && new Date(b.checkOutDate) > checkIn);
        if (isOccupied) return `ข้อผิดพลาด: ห้อง ${roomNumber} ไม่ว่างในช่วงเวลาที่เลือก`;
        
        let guest = guests.find(g => g.name === guestName && g.phone === phone);
        if (!guest) {
            guest = { id: `g-${Date.now()}`, name: guestName, phone, history: [] };
            setGuests(prev => [...prev, guest!]);
        }

        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24));
        const newBooking: Booking = {
            id: `VP${Math.floor(Math.random() * 90000) + 10000}`,
            guestId: guest.id,
            roomId: room.id,
            checkInDate: checkIn,
            checkOutDate: checkOut,
            totalPrice: room.price * nights,
            status: 'ยืนยันแล้ว',
            source,
        };
        
        setBookings(prev => [...prev, newBooking]);
        setGuests(prev => prev.map(g => g.id === guest!.id ? { ...g, history: [...g.history, newBooking.id] } : g));
        
        if (source === 'ai') {
            setLatestAiBookingId(newBooking.id);
        }

        return `สร้างการจองสำหรับคุณ ${guestName} ในห้อง ${roomNumber} สำเร็จแล้ว`;
    }, [rooms, bookings, guests]);

    const addTask = useCallback(async (description: string, assignedTo: string, relatedTo: string, dueDate?: string): Promise<string> => {
        const newTask: Task = {
            id: `task-${Date.now()}`,
            description,
            assignedTo,
            relatedTo,
            createdAt: new Date(),
            status: 'ต้องทำ',
            ...(dueDate && { dueDate: new Date(dueDate) })
        };
        setTasks(prev => [...prev, newTask]);
        return "เพิ่มงานใหม่สำเร็จแล้ว";
    }, []);
    
    // --- Render Logic ---
    const renderPage = () => {
        switch (currentPage) {
            case 'ภาพรวม':
                return <Dashboard
                    bookings={bookings} rooms={rooms} guests={guests} expenses={expenses}
                    tasks={tasks} invoices={invoices} income={income}
                    setCurrentPage={setCurrentPage}
                    setFinanceDateFilter={setFinanceDateFilter}
                    latestAiBookingId={latestAiBookingId}
                    setLatestAiBookingId={setLatestAiBookingId}
                    setBookingRoomFilter={setBookingRoomFilter}
                    setRoomStatusFilter={setRoomStatusFilter}
                    addBooking={addBooking as any}
                />;
            case 'การดำเนินงาน':
                return <Operations
                    bookings={bookings} guests={guests} rooms={rooms} tasks={tasks} employees={employees}
                    updateBooking={async () => "Not implemented"}
                    deleteBooking={async () => "Not implemented"}
                    addTask={addTask}
                    updateTaskStatus={(taskId, newStatus) => setTasks(tasks.map(t => t.id === taskId ? {...t, status: newStatus} : t))}
                    bookingRoomFilter={bookingRoomFilter}
                    setBookingRoomFilter={setBookingRoomFilter}
                    roomStatusFilter={roomStatusFilter}
                    setRoomStatusFilter={setRoomStatusFilter}
                 />;
            case 'การเงิน':
                return <Finance 
                    income={income} expenses={expenses}
                    dateFilter={financeDateFilter} setDateFilter={setFinanceDateFilter}
                    addIncome={async () => "Not implemented"} addExpense={async () => "Not implemented"}
                />;
            case 'ข้อมูลบุคคล':
                 return <People
                    guests={guests} tenants={tenants} rooms={rooms} invoices={invoices}
                    employees={employees} bookings={bookings}
                    addGuest={async () => "Not implemented"} updateGuest={async () => "Not implemented"} deleteGuest={async () => "Not implemented"}
                    addTenant={async () => "Not implemented"} updateTenant={async () => "Not implemented"} deleteTenant={async () => "Not implemented"}
                    addInvoice={async () => "Not implemented"}
                    addEmployee={async () => "Not implemented"} updateEmployee={async () => "Not implemented"} deleteEmployee={async () => "Not implemented"}
                />;
            case 'เอกสารและส่งออก':
                return <Reports 
                    bookings={bookings} rooms={rooms} guests={guests} tenants={tenants}
                    employees={employees} expenses={expenses} income={income}
                    invoices={invoices} documents={documents}
                />;
            default:
                return <div>Page not found</div>;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            <Sidebar
                isOpen={isSidebarOpen}
                setIsOpen={setSidebarOpen}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header toggleSidebar={toggleSidebar} currentPage={currentPage} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 sm:p-6">
                    {renderPage()}
                </main>
            </div>
        </div>
    );
};

export default App;
