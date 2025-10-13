import React, { useState, useEffect } from 'react';
import type { Page, Room, Guest, Booking, Expense, Employee, Attendance, Tenant, Invoice, AiChatMessage, GeneratedDocument, Task, TaskStatus } from './types';
import * as api from './services/googleApiService';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Bookings from './components/Bookings';
import Finance from './components/Finance';
import DataManagement from './components/DataManagement';
import Reports from './components/Reports';
import Tasks from './components/Tasks';
import AiAssistant from './components/AiAssistant';
import Login from './components/Login';

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState<Page>('ภาพรวม');
    const [financeDateFilter, setFinanceDateFilter] = useState<Date | null>(null);
    const [loading, setLoading] = useState(true);

    // State for all data, now fetched from the backend
    const [rooms, setRooms] = useState<Room[]>([]);
    const [guests, setGuests] = useState<Guest[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
    const [aiChatHistory, setAiChatHistory] = useState<AiChatMessage[]>([]);

    useEffect(() => {
        if (isAuthenticated) {
            const fetchAllData = async () => {
                try {
                    setLoading(true);
                    const [
                        roomsData,
                        guestsData,
                        bookingsData,
                        expensesData,
                        employeesData,
                        tenantsData,
                        invoicesData,
                        tasksData
                    ] = await Promise.all([
                        api.getRooms(),
                        api.getGuests(),
                        api.getBookings(),
                        api.getExpenses(),
                        api.getEmployees(),
                        api.getTenants(),
                        api.getInvoices(),
                        api.getTasks(),
                    ]);
                    setRooms(roomsData);
                    setGuests(guestsData);
                    setBookings(bookingsData);
                    setExpenses(expensesData);
                    setEmployees(employeesData);
                    setTenants(tenantsData);
                    setInvoices(invoicesData);
                    setTasks(tasksData);
                } catch (error) {
                    console.error("Failed to fetch data:", error);
                    // Handle error appropriately, e.g., show an error message to the user
                } finally {
                    setLoading(false);
                }
            };
            fetchAllData();
        }
    }, [isAuthenticated]);

    const handleLoginSuccess = () => {
        setIsAuthenticated(true);
    };

    if (!isAuthenticated) {
        return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const addBooking = async (guestName: string, phone: string, roomNumber: string, checkInStr: string, checkOutStr: string): Promise<string> => {
        // ... (validation logic remains the same)
        const room = rooms.find(r => r.number.toLowerCase() === roomNumber.toLowerCase());
        if (!room) return `ข้อผิดพลาด: ไม่พบห้องหมายเลข ${roomNumber}`;
        if (room.status !== 'Available') return `ข้อผิดพลาด: ห้องหมายเลข ${roomNumber} ไม่ว่าง`;
        
        const newBookingData = { guestName, phone, roomNumber, checkInDate: new Date(checkInStr), checkOutDate: new Date(checkOutStr) };
        const result = await api.addBooking(newBookingData);
        if (result.success) {
            setBookings(prev => [...prev, result.data as Booking]);
            // Refresh related data
            api.getRooms().then(setRooms);
            api.getGuests().then(setGuests);
            return "สร้างการจองสำเร็จแล้ว";
        }
        return result.message || "เกิดข้อผิดพลาดในการสร้างการจอง";
    };

    const updateBooking = async (bookingId: string, newDetails: any): Promise<string> => {
        const result = await api.updateBooking({ id: bookingId, ...newDetails });
        if (result.success) {
            setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, ...newDetails } : b));
            api.getRooms().then(setRooms);
            api.getGuests().then(setGuests);
            return "อัปเดตการจองสำเร็จแล้ว";
        }
        return result.message || "เกิดข้อผิดพลาดในการอัปเดตการจอง";
    };

    const deleteBooking = async (bookingId: string): Promise<string> => {
        const result = await api.deleteBooking(bookingId);
        if (result.success) {
            setBookings(prev => prev.filter(b => b.id !== bookingId));
            api.getRooms().then(setRooms);
            api.getGuests().then(setGuests);
            return "ลบการจองสำเร็จแล้ว";
        }
        return result.message || "เกิดข้อผิดพลาดในการลบการจอง";
    };

    const addExpense = async (category: Expense['category'], description: string, amount: number): Promise<string> => {
        const newExpenseData = { date: new Date(), category, description, amount };
        const result = await api.addExpense(newExpenseData);
        if (result.success) {
            setExpenses(prev => [...prev, result.data as Expense]);
            return "บันทึกรายจ่ายสำเร็จแล้ว";
        }
        return result.message || "เกิดข้อผิดพลาดในการบันทึกรายจ่าย";
    };

    const updateExpense = async (expenseId: string, newDetails: any): Promise<string> => {
        const result = await api.updateExpense({ id: expenseId, ...newDetails });
        if (result.success) {
            setExpenses(prev => prev.map(e => e.id === expenseId ? { ...e, ...newDetails } : e));
            return "อัปเดตรายจ่ายสำเร็จแล้ว";
        }
        return result.message || "เกิดข้อผิดพลาดในการอัปเดตรายจ่าย";
    };

    const deleteExpense = async (expenseId: string): Promise<string> => {
        const result = await api.deleteExpense(expenseId);
        if (result.success) {
            setExpenses(prev => prev.filter(e => e.id !== expenseId));
            return "ลบรายจ่ายสำเร็จแล้ว";
        }
        return result.message || "เกิดข้อผิดพลาดในการลบรายจ่าย";
    };

    // --- Data Management Functions ---
    const addGuest = async (name: string, phone: string): Promise<string> => {
        const result = await api.addGuest({ name, phone, history: [] });
        if (result.success) {
            setGuests(prev => [...prev, result.data as Guest]);
            return `เพิ่มผู้เข้าพัก ${name} สำเร็จแล้ว`;
        }
        return result.message || "เกิดข้อผิดพลาดในการเพิ่มผู้เข้าพัก";
    };

    const updateGuest = async (guestId: string, details: { name: string, phone: string }): Promise<string> => {
        const result = await api.updateGuest({ id: guestId, ...details });
        if (result.success) {
            setGuests(prev => prev.map(g => g.id === guestId ? { ...g, ...details } : g));
            return `อัปเดตข้อมูลผู้เข้าพักสำเร็จแล้ว`;
        }
        return result.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้เข้าพัก";
    };

    const deleteGuest = async (guestId: string): Promise<string> => {
        const result = await api.deleteGuest(guestId);
        if (result.success) {
            setGuests(prev => prev.filter(g => g.id !== guestId));
            return `ลบข้อมูลผู้เข้าพักสำเร็จแล้ว`;
        }
        return result.message || "เกิดข้อผิดพลาดในการลบข้อมูลผู้เข้าพัก";
    };

    const addRoom = async (number: string, type: Room['type'], price: number): Promise<string> => {
        const newRoomData = { number, type, price, status: 'Available' };
        const result = await api.addRoom(newRoomData);
        if (result.success) {
            setRooms(prev => [...prev, result.data as Room]);
            return `เพิ่มห้อง ${number} สำเร็จแล้ว`;
        }
        return result.message || "เกิดข้อผิดพลาดในการเพิ่มห้อง";
    };

    const updateRoom = async (roomId: string, details: { number: string, type: Room['type'], price: number }): Promise<string> => {
        const result = await api.updateRoom({ id: roomId, ...details });
        if (result.success) {
            setRooms(prev => prev.map(r => r.id === roomId ? { ...r, ...details } : r));
            return `อัปเดตข้อมูลห้องสำเร็จแล้ว`;
        }
        return result.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูลห้อง";
    };

    const deleteRoom = async (roomId: string): Promise<string> => {
        const result = await api.deleteRoom(roomId);
        if (result.success) {
            setRooms(prev => prev.filter(r => r.id !== roomId));
            return `ลบห้องสำเร็จแล้ว`;
        }
        return result.message || "เกิดข้อผิดพลาดในการลบห้อง";
    };

    const addTenant = async (name: string, phone: string, roomId: string, contractStartDateStr: string, contractEndDateStr: string, monthlyRent: number): Promise<string> => {
        const newTenantData = { name, phone, roomId, contractStartDate: new Date(contractStartDateStr), contractEndDate: new Date(contractEndDateStr), monthlyRent };
        const result = await api.addTenant(newTenantData);
        if (result.success) {
            setTenants(prev => [...prev, result.data as Tenant]);
            api.getRooms().then(setRooms); // Refresh rooms to update status
            return `เพิ่มผู้เช่า ${name} สำเร็จแล้ว`;
        }
        return result.message || "เกิดข้อผิดพลาดในการเพิ่มผู้เช่า";
    };

    const updateTenant = async (tenantId: string, details: any): Promise<string> => {
        const result = await api.updateTenant({ id: tenantId, ...details });
        if (result.success) {
            setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, ...details } : t));
            api.getRooms().then(setRooms);
            return `อัปเดตข้อมูลผู้เช่าสำเร็จแล้ว`;
        }
        return result.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้เช่า";
    };

    const deleteTenant = async (tenantId: string): Promise<string> => {
        const result = await api.deleteTenant(tenantId);
        if (result.success) {
            setTenants(prev => prev.filter(t => t.id !== tenantId));
            api.getRooms().then(setRooms);
            return `ลบผู้เช่าสำเร็จแล้ว`;
        }
        return result.message || "เกิดข้อผิดพลาดในการลบผู้เช่า";
    };

    const addEmployee = async (name: string, position: Employee['position'], hireDateStr: string, salaryType: Employee['salaryType'], salaryRate: number): Promise<string> => {
        const newEmployeeData = { name, position, hireDate: new Date(hireDateStr), status: 'Active', salaryType, salaryRate };
        const result = await api.addEmployee(newEmployeeData);
        if (result.success) {
            setEmployees(prev => [...prev, result.data as Employee]);
            return `เพิ่มพนักงาน ${name} สำเร็จแล้ว`;
        }
        return result.message || "เกิดข้อผิดพลาดในการเพิ่มพนักงาน";
    };

    const updateEmployee = async (employeeId: string, details: Pick<Employee, 'name' | 'position' | 'status' | 'salaryType' | 'salaryRate'>): Promise<string> => {
        const result = await api.updateEmployee({ id: employeeId, ...details });
        if (result.success) {
            setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, ...details } : e));
            return `อัปเดตข้อมูลพนักงานสำเร็จแล้ว`;
        }
        return result.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูลพนักงาน";
    };

    const deleteEmployee = async (employeeId: string): Promise<string> => {
        const result = await api.deleteEmployee(employeeId);
        if (result.success) {
            setEmployees(prev => prev.filter(e => e.id !== employeeId));
            return `ลบพนักงานสำเร็จแล้ว`;
        }
        return result.message || "เกิดข้อผิดพลาดในการลบพนักงาน";
    };

    const addInvoice = async (tenantId: string, period: string): Promise<string> => {
        const tenant = tenants.find(t => t.id === tenantId);
        if (!tenant) return "Error: Tenant not found";
        const newInvoiceData = { tenantId, period, issueDate: new Date(), dueDate: new Date(new Date().setDate(new Date().getDate() + 5)), amount: tenant.monthlyRent, status: 'Unpaid' };
        const result = await api.addInvoice(newInvoiceData);
        if (result.success) {
            setInvoices(prev => [...prev, result.data as Invoice]);
            return `สร้างใบแจ้งหนี้สำเร็จแล้ว`;
        }
        return result.message || "เกิดข้อผิดพลาดในการสร้างใบแจ้งหนี้";
    };

    const addDocument = async (docType: GeneratedDocument['type'], title: string, content: string): Promise<string> => {
        // This is a client-side only operation for now as there's no backend endpoint for it.
        const newDoc: GeneratedDocument = {
            id: `DOC-${documents.length + 1}`,
            type: docType,
            title: title,
            content: content,
            createdAt: new Date(),
        };
        setDocuments(prev => [newDoc, ...prev]);
        return `สร้างเอกสาร ${title} สำเร็จแล้ว`;
    };

    const addTask = async (description: string, assignedTo: string, relatedTo: string, dueDate?: string): Promise<string> => {
        const newTaskData = { description, assignedTo, relatedTo, status: 'To Do', createdAt: new Date(), dueDate: dueDate ? new Date(dueDate) : undefined };
        const result = await api.addTask(newTaskData);
        if (result.success) {
            setTasks(prev => [result.data as Task, ...prev]);
            return `สร้างงานใหม่สำเร็จ`;
        }
        return result.message || "เกิดข้อผิดพลาดในการสร้างงาน";
    };

    const updateTaskStatus = async (taskId: string, newStatus: TaskStatus): Promise<void> => {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            const result = await api.updateTask({ ...task, status: newStatus });
            if (result.success) {
                setTasks(prevTasks => prevTasks.map(t =>
                    t.id === taskId ? { ...t, status: newStatus } : t
                ));
            }
            // Handle error case? The original function returned void.
        }
    };

    const renderPage = () => {
        if (loading) {
            return <div className="p-4">Loading...</div>;
        }
        // ... (switch case remains the same, but now passes the state and async functions to components)
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
                return <div>ไม่พบหน้า</div>;
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
