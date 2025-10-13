import React, { useState } from 'react';
import type { Page, Room, Guest, Booking, Expense, Employee, Attendance, Tenant, Invoice, AiChatMessage, GeneratedDocument, Task, TaskStatus } from './types';
import { mockRooms, mockGuests, mockBookings, mockExpenses, mockEmployees, mockAttendance, mockTenants, mockInvoices, mockTasks } from './data/mockData';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Bookings from './components/Bookings';
import Finance from './components/Finance';
import DataManagement from './components/DataManagement';
import Reports from './components/Reports';
import Tasks from './components/Tasks';
import AiAssistant from './components/AiAssistant';
import usePersistentState from './hooks/usePersistentState';

const App: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState<Page>('ภาพรวม');
    const [financeDateFilter, setFinanceDateFilter] = useState<Date | null>(null);

    // State for all data, now persistent using localStorage
    const [rooms, setRooms] = usePersistentState<Room[]>('hms_rooms', mockRooms);
    const [guests, setGuests] = usePersistentState<Guest[]>('hms_guests', mockGuests);
    const [bookings, setBookings] = usePersistentState<Booking[]>('hms_bookings', mockBookings);
    const [expenses, setExpenses] = usePersistentState<Expense[]>('hms_expenses', mockExpenses);
    const [employees, setEmployees] = usePersistentState<Employee[]>('hms_employees', mockEmployees);
    const [attendance, setAttendance] = usePersistentState<Attendance[]>('hms_attendance', mockAttendance);
    const [tenants, setTenants] = usePersistentState<Tenant[]>('hms_tenants', mockTenants);
    const [invoices, setInvoices] = usePersistentState<Invoice[]>('hms_invoices', mockInvoices);
    const [tasks, setTasks] = usePersistentState<Task[]>('hms_tasks', mockTasks);
    const [documents, setDocuments] = usePersistentState<GeneratedDocument[]>('hms_documents', []);
    const [aiChatHistory, setAiChatHistory] = usePersistentState<AiChatMessage[]>('hms_ai_chat_history', []);


    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    
    const addBooking = (guestName: string, phone: string, roomNumber: string, checkInStr: string, checkOutStr: string): string => {
        const room = rooms.find(r => r.number.toLowerCase() === roomNumber.toLowerCase());
        if (!room) {
            return `ข้อผิดพลาด: ไม่พบห้องหมายเลข ${roomNumber}`;
        }
        if (room.status !== 'Available') {
            return `ข้อผิดพลาด: ห้องหมายเลข ${roomNumber} ไม่ว่าง`;
        }

        const checkIn = new Date(checkInStr);
        const checkOut = new Date(checkOutStr);
        if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime()) || checkOut <= checkIn) {
            return "ข้อผิดพลาด: วันที่ที่ระบุไม่ถูกต้อง กรุณาใช้รูปแบบ YYYY-MM-DD และวันที่เช็คเอาท์ต้องอยู่หลังวันที่เช็คอิน";
        }
        
        // Create or update guest
        let guest = guests.find(g => g.name.toLowerCase() === guestName.toLowerCase());
        if (guest) {
             // If guest exists, update their phone number if a new one is provided.
             if (phone && guest.phone !== phone) {
                setGuests(prevGuests => prevGuests.map(g => 
                    g.id === guest!.id ? { ...g, phone: phone } : g
                ));
                guest = { ...guest, phone }; // Ensure the guest object we use for the booking is updated.
             }
        } else {
            const newGuest: Guest = {
                id: `G${guests.length + 1}`,
                name: guestName,
                phone: phone || 'N/A',
                history: [],
            };
            setGuests(prev => [...prev, newGuest]);
            guest = newGuest;
        }

        const duration = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24));
        const newBooking: Booking = {
            id: `B${bookings.length + 1}`,
            guestId: guest.id,
            roomId: room.id,
            checkInDate: checkIn,
            checkOutDate: checkOut,
            status: 'Confirmed',
            totalPrice: room.price * (duration || 1),
        };

        setBookings(prev => [...prev, newBooking]);
        setRooms(prev => prev.map(r => r.id === room.id ? {...r, status: 'Occupied'} : r));
        
        setGuests(prevGuests => prevGuests.map(g => g.id === guest!.id ? {...g, history: [...g.history, newBooking.id]} : g));

        return `สร้างการจองสำหรับคุณ ${guestName} ในห้อง ${roomNumber} ตั้งแต่วันที่ ${checkInStr} ถึง ${checkOutStr} สำเร็จแล้ว Booking ID: ${newBooking.id}`;
    };

    const updateBooking = (
        bookingId: string, 
        newDetails: { 
            guestName: string; 
            phone: string; 
            roomNumber: string; 
            checkInStr: string; 
            checkOutStr: string 
        }
    ): string => {
        const { guestName, phone, roomNumber, checkInStr, checkOutStr } = newDetails;
        
        const bookingIndex = bookings.findIndex(b => b.id === bookingId);
        if (bookingIndex === -1) return "ข้อผิดพลาด: ไม่พบการจองที่ต้องการแก้ไข";
        const originalBooking = bookings[bookingIndex];

        const trimmedGuestName = guestName.trim();
        if (!trimmedGuestName) return "ข้อผิดพลาด: ชื่อผู้เข้าพักห้ามว่าง";

        const checkIn = new Date(checkInStr);
        const checkOut = new Date(checkOutStr);
        if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime()) || checkOut <= checkIn) {
            return "ข้อผิดพลาด: วันที่ที่ระบุไม่ถูกต้อง";
        }
        
        const newRoom = rooms.find(r => r.number.toLowerCase() === roomNumber.toLowerCase());
        if (!newRoom) return `ข้อผิดพลาด: ไม่พบห้องหมายเลข ${roomNumber}`;

        const originalRoom = rooms.find(r => r.id === originalBooking.roomId);

        const isConflict = bookings.some(b => 
            b.id !== bookingId &&
            b.roomId === newRoom.id &&
            b.status !== 'Cancelled' &&
            checkIn < b.checkOutDate &&
            checkOut > b.checkInDate
        );

        if (isConflict) {
            return `ข้อผิดพลาด: ห้องหมายเลข ${newRoom.number} ไม่ว่างในช่วงวันที่ที่เลือก`;
        }

        const guestIndex = guests.findIndex(g => g.id === originalBooking.guestId);
        if (guestIndex === -1) {
            return "ข้อผิดพลาด: ไม่พบข้อมูลผู้เข้าพักที่เชื่อมโยงกับการจองนี้";
        }
        
        const existingGuestWithNewName = guests.find(g => 
            g.name.toLowerCase() === trimmedGuestName.toLowerCase() && 
            g.id !== originalBooking.guestId
        );
        if (existingGuestWithNewName) {
            return `ข้อผิดพลาด: มีผู้เข้าพักชื่อ "${trimmedGuestName}" อยู่ในระบบแล้ว ไม่สามารถเปลี่ยนชื่อซ้ำได้`;
        }
        
        const updatedGuests = [...guests];
        updatedGuests[guestIndex] = {
            ...updatedGuests[guestIndex],
            name: trimmedGuestName,
            phone: phone.trim() || 'N/A',
        };
        setGuests(updatedGuests);
        
        const duration = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24));
        const updatedBooking: Booking = {
            ...originalBooking,
            roomId: newRoom.id,
            checkInDate: checkIn,
            checkOutDate: checkOut,
            totalPrice: newRoom.price * (duration || 1),
        };

        const newBookings = [...bookings];
        newBookings[bookingIndex] = updatedBooking;
        setBookings(newBookings);
        
        if (originalRoom && originalRoom.id !== newRoom.id) {
             setRooms(prevRooms => prevRooms.map(r => {
                if (r.id === originalRoom.id) {
                    const hasOtherBookings = newBookings.some(b =>
                        b.roomId === originalRoom.id &&
                        (b.status === 'Confirmed' || b.status === 'Check-In')
                    );
                    return { ...r, status: hasOtherBookings ? 'Occupied' : 'Available' };
                }
                if (r.id === newRoom.id) {
                    return { ...r, status: 'Occupied' };
                }
                return r;
            }));
        }

        return `อัปเดตการจอง ID: ${bookingId} สำเร็จแล้ว`;
    };

    const addExpense = (category: Expense['category'], description: string, amount: number): string => {
        if (!category || !description.trim() || !amount || amount <= 0) {
            return "ข้อผิดพลาด: กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง";
        }
        const newExpense: Expense = {
            id: `E${expenses.length + 1 + Math.random()}`, // Add random to reduce collision chance
            date: new Date(),
            category,
            description,
            amount,
        };
        setExpenses(prev => [...prev, newExpense]);
        return `บันทึกรายจ่าย '${description}' จำนวน ${amount.toLocaleString('th-TH')} บาท สำเร็จแล้ว`;
    };

    const updateExpense = (expenseId: string, newDetails: { category: Expense['category']; description: string; amount: number; date: Date }): string => {
        const expenseIndex = expenses.findIndex(e => e.id === expenseId);
        if (expenseIndex === -1) {
            return "ข้อผิดพลาด: ไม่พบรายจ่ายที่ต้องการแก้ไข";
        }

        if (!newDetails.category || !newDetails.description.trim() || !newDetails.amount || newDetails.amount <= 0 || !newDetails.date) {
            return "ข้อผิดพลาด: กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง";
        }

        const updatedExpenses = [...expenses];
        updatedExpenses[expenseIndex] = {
            id: expenseId,
            ...newDetails
        };
        setExpenses(updatedExpenses);
        return `อัปเดตรายจ่ายสำเร็จแล้ว`;
    };

    const deleteExpense = (expenseId: string): string => {
        const expenseExists = expenses.some(e => e.id === expenseId);
        if (!expenseExists) {
            return `ข้อผิดพลาด: ไม่พบรายจ่าย ID ${expenseId}`;
        }
        setExpenses(prevExpenses => prevExpenses.filter(e => e.id !== expenseId));
        return `ลบรายจ่ายสำเร็จแล้ว`;
    };

    const addInvoice = (tenantId: string, period: string): string => {
        if (!tenantId || !period.trim()) {
            return "ข้อผิดพลาด: กรุณาเลือกผู้เช่าและระบุรอบบิล";
        }
        const tenant = tenants.find(t => t.id === tenantId);
        if (!tenant) {
            return `ข้อผิดพลาด: ไม่พบผู้เช่า ID ${tenantId}`;
        }

        const newInvoice: Invoice = {
            id: `INV-${tenantId.slice(1)}-${invoices.filter(i => i.tenantId === tenantId).length + 1}`,
            tenantId: tenantId,
            issueDate: new Date(),
            dueDate: new Date(new Date().setDate(new Date().getDate() + 5)), // Due in 5 days
            period: period,
            amount: tenant.monthlyRent,
            status: 'Unpaid',
        };
        setInvoices(prev => [...prev, newInvoice]);
        return `สร้างใบแจ้งหนี้สำหรับรอบบิล ${period} สำเร็จแล้ว (ID: ${newInvoice.id})`;
    };

    const addDocument = (docType: GeneratedDocument['type'], title: string, content: string): string => {
        const newDoc: GeneratedDocument = {
            id: `DOC-${documents.length + 1}`,
            type: docType,
            title: title,
            content: content,
            createdAt: new Date(),
        };
        setDocuments(prev => [newDoc, ...prev]);
        return `สร้างเอกสาร ${title} (ID: ${newDoc.id}) สำเร็จแล้ว`;
    };

    const addTask = (description: string, assignedTo: string, relatedTo: string, dueDate?: string): string => {
        if (!description.trim() || !assignedTo || !relatedTo) {
            return "ข้อผิดพลาด: กรุณากรอกข้อมูลให้ครบถ้วน";
        }
        const newTask: Task = {
            id: `TASK${tasks.length + 1}`,
            description,
            status: 'To Do',
            assignedTo,
            relatedTo,
            createdAt: new Date(),
            dueDate: dueDate ? new Date(dueDate) : undefined,
        };
        setTasks(prev => [newTask, ...prev]);
        return `สร้างงานใหม่สำเร็จ (ID: ${newTask.id})`;
    };

    const updateTaskStatus = (taskId: string, newStatus: TaskStatus): void => {
        setTasks(prevTasks => prevTasks.map(task => 
            task.id === taskId ? { ...task, status: newStatus } : task
        ));
    };
    
    const deleteBooking = (bookingId: string): string => {
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking) {
            return `ข้อผิดพลาด: ไม่พบการจอง ID ${bookingId}`;
        }
        
        setGuests(prevGuests => prevGuests.map(g => 
            g.id === booking.guestId 
                ? { ...g, history: g.history.filter(id => id !== bookingId) }
                : g
        ));

        const isCurrentOrFutureBooking = new Date(booking.checkOutDate) >= new Date();
        if ((booking.status === 'Confirmed' || booking.status === 'Check-In') && isCurrentOrFutureBooking) {
            const otherBookingsForRoom = bookings.some(b => 
                b.id !== bookingId && 
                b.roomId === booking.roomId && 
                (b.status === 'Confirmed' || b.status === 'Check-In')
            );
            if (!otherBookingsForRoom) {
                setRooms(prevRooms => prevRooms.map(r => r.id === booking.roomId ? { ...r, status: 'Available' } : r));
            }
        }
        
        setBookings(prevBookings => prevBookings.filter(b => b.id !== bookingId));
        return `ลบการจอง ID ${bookingId} สำเร็จแล้ว`;
    };
    
    // --- Data Management Functions ---
    const addGuest = (name: string, phone: string): string => {
        if (!name.trim()) return "ข้อผิดพลาด: ชื่อผู้เข้าพักห้ามว่าง";
        const existingGuest = guests.find(g => g.name.toLowerCase() === name.trim().toLowerCase());
        if (existingGuest) return `ข้อผิดพลาด: มีผู้เข้าพักชื่อ ${name} อยู่แล้ว`;

        const newGuest: Guest = {
            id: `G${guests.length + 1}`,
            name: name.trim(),
            phone: phone.trim() || 'N/A',
            history: [],
        };
        setGuests(prev => [...prev, newGuest]);
        return `เพิ่มผู้เข้าพัก ${name} สำเร็จแล้ว`;
    };

    const updateGuest = (guestId: string, details: { name: string, phone: string }): string => {
        const guestIndex = guests.findIndex(g => g.id === guestId);
        if (guestIndex === -1) return "ข้อผิดพลาด: ไม่พบผู้เข้าพัก";
        
        const updatedGuests = [...guests];
        updatedGuests[guestIndex] = { ...updatedGuests[guestIndex], ...details };
        setGuests(updatedGuests);
        return `อัปเดตข้อมูลผู้เข้าพักสำเร็จแล้ว`;
    };

    const deleteGuest = (guestId: string): string => {
        const guest = guests.find(g => g.id === guestId);
        if (!guest) {
            return `ข้อผิดพลาด: ไม่พบผู้เข้าพัก ID ${guestId}`;
        }
        const hasActiveBooking = bookings.some(b => b.guestId === guestId && (b.status === 'Check-In' || b.status === 'Confirmed'));
        if (hasActiveBooking) {
            return `ข้อผิดพลาด: ไม่สามารถลบผู้เข้าพักที่มีการจองที่ยังดำเนินอยู่ได้`;
        }
        setGuests(prevGuests => prevGuests.filter(g => g.id !== guestId));
        return `ลบข้อมูลผู้เข้าพัก ${guest.name} สำเร็จแล้ว`;
    };

    const addRoom = (number: string, type: Room['type'], price: number): string => {
        if (!number.trim() || !type || !price || price <= 0) return "ข้อผิดพลาด: กรุณากรอกข้อมูลให้ครบถ้วน";
        const existingRoom = rooms.find(r => r.number.toLowerCase() === number.trim().toLowerCase());
        if (existingRoom) return `ข้อผิดพลาด: มีห้องหมายเลข ${number} อยู่แล้ว`;

        const newRoom: Room = {
            id: `R${rooms.length + 1}`,
            number: number.trim().toUpperCase(),
            type,
            price,
            status: 'Available',
        };
        setRooms(prev => [...prev, newRoom]);
        return `เพิ่มห้อง ${number} สำเร็จแล้ว`;
    };

    const updateRoom = (roomId: string, details: { number: string, type: Room['type'], price: number }): string => {
        const roomIndex = rooms.findIndex(r => r.id === roomId);
        if (roomIndex === -1) return "ข้อผิดพลาด: ไม่พบห้อง";
        
        if (details.number.toLowerCase() !== rooms[roomIndex].number.toLowerCase()) {
            const existingRoom = rooms.find(r => r.number.toLowerCase() === details.number.toLowerCase());
            if (existingRoom) return `ข้อผิดพลาด: มีห้องหมายเลข ${details.number} อยู่แล้ว`;
        }

        const updatedRooms = [...rooms];
        updatedRooms[roomIndex] = { ...updatedRooms[roomIndex], ...details, number: details.number.toUpperCase() };
        setRooms(updatedRooms);
        return `อัปเดตข้อมูลห้องสำเร็จแล้ว`;
    };

    const deleteRoom = (roomId: string): string => {
        const room = rooms.find(r => r.id === roomId);
        if (!room) {
            return `ข้อผิดพลาด: ไม่พบห้อง ID ${roomId}`;
        }
        const hasBookings = bookings.some(b => b.roomId === roomId && b.status !== 'Cancelled' && b.status !== 'Check-Out');
        if (hasBookings) {
            return `ข้อผิดพลาด: ไม่สามารถลบห้องที่มีการจองอยู่ได้`;
        }
        const isRented = tenants.some(t => t.roomId === roomId);
        if (isRented) {
             return `ข้อผิดพลาด: ไม่สามารถลบห้องที่มีผู้เช่ารายเดือนได้`;
        }

        setRooms(prevRooms => prevRooms.filter(r => r.id !== roomId));
        return `ลบห้อง ${room.number} สำเร็จแล้ว`;
    };

    const addTenant = (name: string, phone: string, roomId: string, contractStartDateStr: string, contractEndDateStr: string, monthlyRent: number): string => {
        if (!name.trim() || !roomId || !contractStartDateStr || !contractEndDateStr || !monthlyRent) return "ข้อผิดพลาด: กรุณากรอกข้อมูลให้ครบถ้วน";
        const room = rooms.find(r => r.id === roomId);
        if (!room) return "ข้อผิดพลาด: ไม่พบห้องที่เลือก";
        if (room.status !== 'Available') return `ข้อผิดพลาด: ห้อง ${room.number} ไม่ว่างสำหรับให้เช่ารายเดือน`;

        const newTenant: Tenant = {
            id: `T${tenants.length + 1}`,
            name, phone, roomId, 
            contractStartDate: new Date(contractStartDateStr), 
            contractEndDate: new Date(contractEndDateStr), 
            monthlyRent
        };
        setTenants(prev => [...prev, newTenant]);
        setRooms(prevRooms => prevRooms.map(r => r.id === roomId ? { ...r, status: 'Monthly Rental' } : r));
        return `เพิ่มผู้เช่า ${name} สำหรับห้อง ${room.number} สำเร็จแล้ว`;
    };

    const updateTenant = (tenantId: string, details: { name: string; phone: string; roomId: string; contractStartDate: string; contractEndDate: string; monthlyRent: number; }): string => {
        const tenantIndex = tenants.findIndex(t => t.id === tenantId);
        if (tenantIndex === -1) return "ข้อผิดพลาด: ไม่พบผู้เช่า";
        const originalTenant = tenants[tenantIndex];

        const updatedTenants = [...tenants];
        updatedTenants[tenantIndex] = { 
            id: tenantId, 
            ...details,
            contractStartDate: new Date(details.contractStartDate),
            contractEndDate: new Date(details.contractEndDate),
        };
        setTenants(updatedTenants);

        if (originalTenant.roomId !== details.roomId) {
            setRooms(prevRooms => prevRooms.map(r => {
                if (r.id === originalTenant.roomId) return { ...r, status: 'Available' };
                if (r.id === details.roomId) return { ...r, status: 'Monthly Rental' };
                return r;
            }));
        }
        return `อัปเดตข้อมูลผู้เช่าสำเร็จแล้ว`;
    };

    const deleteTenant = (tenantId: string): string => {
        const tenant = tenants.find(t => t.id === tenantId);
        if (!tenant) return "ข้อผิดพลาด: ไม่พบผู้เช่า";

        setTenants(prev => prev.filter(t => t.id !== tenantId));
        setRooms(prevRooms => prevRooms.map(r => r.id === tenant.roomId ? { ...r, status: 'Available' } : r));
        setInvoices(prev => prev.filter(i => i.tenantId !== tenantId));
        return `ลบผู้เช่า ${tenant.name} และใบแจ้งหนี้ที่เกี่ยวข้องสำเร็จแล้ว`;
    };

    const addEmployee = (name: string, position: Employee['position'], hireDateStr: string, salaryType: Employee['salaryType'], salaryRate: number): string => {
        if (!name.trim() || !position || !hireDateStr || !salaryType || !salaryRate) return "ข้อผิดพลาด: กรุณากรอกข้อมูลให้ครบถ้วน";
        
        const newEmployee: Employee = {
            id: `EMP${employees.length + 1}`,
            name,
            position,
            hireDate: new Date(hireDateStr),
            status: 'Active',
            salaryType,
            salaryRate
        };
        setEmployees(prev => [...prev, newEmployee]);
        return `เพิ่มพนักงาน ${name} สำเร็จแล้ว`;
    };

    const updateEmployee = (employeeId: string, details: Pick<Employee, 'name' | 'position' | 'status' | 'salaryType' | 'salaryRate'>): string => {
        const empIndex = employees.findIndex(e => e.id === employeeId);
        if (empIndex === -1) return "ข้อผิดพลาด: ไม่พบพนักงาน";
        
        const updatedEmployees = [...employees];
        const originalEmployee = updatedEmployees[empIndex];
        updatedEmployees[empIndex] = { ...originalEmployee, ...details };

        if (details.status === 'Inactive' && !originalEmployee.terminationDate) {
            updatedEmployees[empIndex].terminationDate = new Date();
        } else if (details.status === 'Active') {
            updatedEmployees[empIndex].terminationDate = undefined;
        }
        setEmployees(updatedEmployees);
        return `อัปเดตข้อมูลพนักงานสำเร็จแล้ว`;
    };

    const deleteEmployee = (employeeId: string): string => {
        const hasActiveTasks = tasks.some(t => t.assignedTo === employeeId && t.status !== 'Done');
        if (hasActiveTasks) return "ข้อผิดพลาด: ไม่สามารถลบพนักงานที่มีงานที่ยังไม่เสร็จได้";

        setEmployees(prev => prev.filter(e => e.id !== employeeId));
        return `ลบพนักงานสำเร็จแล้ว`;
    };
    // --- End Data Management Functions ---


    const renderPage = () => {
        switch (currentPage) {
            case 'ภาพรวม':
                return <Dashboard bookings={bookings} rooms={rooms} expenses={expenses} setCurrentPage={setCurrentPage} setFinanceDateFilter={setFinanceDateFilter} />;
            case 'การจอง':
                return <Bookings bookings={bookings} guests={guests} rooms={rooms} addBooking={addBooking} updateBooking={updateBooking} deleteBooking={deleteBooking} />;
            case 'การเงิน':
                return <Finance 
                    bookings={bookings} 
                    expenses={expenses} 
                    addExpense={addExpense}
                    updateExpense={updateExpense}
                    deleteExpense={deleteExpense}
                    invoices={invoices} 
                    tenants={tenants} 
                    rooms={rooms} 
                    employees={employees}
                    attendance={attendance}
                    addInvoice={addInvoice}
                    financeDateFilter={financeDateFilter}
                    setFinanceDateFilter={setFinanceDateFilter}
                />;
            case 'จัดการข้อมูล':
                return <DataManagement 
                    guests={guests} rooms={rooms} tenants={tenants} employees={employees} bookings={bookings} 
                    addGuest={addGuest} updateGuest={updateGuest} deleteGuest={deleteGuest}
                    addRoom={addRoom} updateRoom={updateRoom} deleteRoom={deleteRoom}
                    addTenant={addTenant} updateTenant={updateTenant} deleteTenant={deleteTenant}
                    addEmployee={addEmployee} updateEmployee={updateEmployee} deleteEmployee={deleteEmployee}
                />;
            case 'เอกสารและรายงาน':
                return <Reports bookings={bookings} guests={guests} expenses={expenses} rooms={rooms} employees={employees} tenants={tenants} documents={documents} attendance={attendance} addDocument={addDocument} />;
            case 'การจัดการงาน':
                return <Tasks tasks={tasks} employees={employees} rooms={rooms} addTask={addTask} updateTaskStatus={updateTaskStatus} />;
            default:
                const exhaustiveCheck: never = currentPage as never;
                return <div>ไม่พบหน้า: {exhaustiveCheck}</div>;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            <Sidebar
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header toggleSidebar={toggleSidebar} currentPage={currentPage} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4">
                    {renderPage()}
                </main>
            </div>
            <AiAssistant
              chatHistory={aiChatHistory}
              setChatHistory={setAiChatHistory}
              context={{ rooms, guests, bookings, expenses, tenants, employees, invoices }}
              actions={{ addBooking, addDocument }}
            />
        </div>
    );
};

export default App;