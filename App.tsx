import React, { useState, useCallback, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, addDoc, deleteDoc, writeBatch, Timestamp, updateDoc, query, where, getDocsFromCache } from 'firebase/firestore';
import { db } from './firebase'; // Import the Firestore instance
import type { Page, Room, Guest, Booking, Expense, Employee, Attendance, Tenant, Invoice, AiChatMessage, GeneratedDocument, Task, TaskStatus, Income, IncomeCategory, ExpenseCategory } from './types';
import { mockRooms, mockGuests, mockBookings, mockExpenses, mockEmployees, mockAttendance, mockTenants, mockInvoices, mockTasks, mockIncome, mockIncomeCategories, mockExpenseCategories } from './data/mockData';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Operations from './components/Operations';
import Finance from './components/Finance';
import Customers from './components/Customers';
import DataManagement from './components/Settings';
import Reports from './components/Reports';
import AiAssistant from './components/AiAssistant';
import LiveChat from './components/LiveChat';
import { generateDocumentContent } from './services/geminiService';

// Helper to convert Firestore Timestamps to JS Dates in nested objects
const convertTimestampsToDates = (data: any) => {
    for (const key in data) {
        if (data[key] instanceof Timestamp) {
            data[key] = data[key].toDate();
        }
    }
    return data;
};

const App: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState<Page>('ภาพรวม');
    const [financeDateFilter, setFinanceDateFilter] = useState<Date | null>(null);
    const [bookingRoomFilter, setBookingRoomFilter] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [latestAiBookingId, setLatestAiBookingId] = useState<string | null>(null);


    // Local state, populated from Firestore
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
    const [aiChatHistory, setAiChatHistory] = useState<AiChatMessage[]>([]); // This can remain local or be moved later
    const [income, setIncome] = useState<Income[]>([]);
    const [incomeCategories, setIncomeCategories] = useState<IncomeCategory[]>([]);
    const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
    
    // Fetch all data from Firestore on initial load
    useEffect(() => {
        const seedCollection = async (collectionName: string, mockData: any[]) => {
            const collectionRef = collection(db, collectionName);
            const snapshot = await getDocs(collectionRef);
            if (snapshot.empty) {
                console.log(`Seeding ${collectionName}...`);
                const batch = writeBatch(db);
                mockData.forEach(item => {
                    const docRef = doc(collection(db, collectionName));
                    batch.set(docRef, { ...item, id: docRef.id });
                });
                await batch.commit();
                console.log(`Seeded ${collectionName} with ${mockData.length} documents.`);
                // Fetch again to get the generated IDs
                const newSnapshot = await getDocs(collectionRef);
                return newSnapshot.docs.map(doc => convertTimestampsToDates({ ...doc.data(), id: doc.id }));
            }
            const data = snapshot.docs.map(doc => convertTimestampsToDates({ ...doc.data(), id: doc.id }));
            if (collectionName.includes('Categories')) {
                 // @ts-ignore
                data.sort((a, b) => a.order - b.order);
            }
            return data;
        };

        const fetchData = async () => {
            try {
                const [
                    roomsData, guestsData, bookingsData, expensesData, employeesData,
                    attendanceData, tenantsData, invoicesData, tasksData, documentsData,
                    incomeData, incomeCategoriesData, expenseCategoriesData
                ] = await Promise.all([
                    seedCollection('rooms', mockRooms),
                    seedCollection('guests', mockGuests),
                    seedCollection('bookings', mockBookings),
                    seedCollection('expenses', mockExpenses),
                    seedCollection('employees', mockEmployees),
                    seedCollection('attendance', mockAttendance),
                    seedCollection('tenants', mockTenants),
                    seedCollection('invoices', mockInvoices),
                    seedCollection('tasks', mockTasks),
                    seedCollection('documents', []), // Documents start empty
                    seedCollection('income', mockIncome),
                    seedCollection('incomeCategories', mockIncomeCategories),
                    seedCollection('expenseCategories', mockExpenseCategories),
                ]);

                setRooms(roomsData as Room[]);
                setGuests(guestsData as Guest[]);
                setBookings(bookingsData as Booking[]);
                setExpenses(expensesData as Expense[]);
                setEmployees(employeesData as Employee[]);
                setAttendance(attendanceData as Attendance[]);
                setTenants(tenantsData as Tenant[]);
                setInvoices(invoicesData as Invoice[]);
                setTasks(tasksData as Task[]);
                setDocuments(documentsData as GeneratedDocument[]);
                setIncome(incomeData as Income[]);
                setIncomeCategories(incomeCategoriesData as IncomeCategory[]);
                setExpenseCategories(expenseCategoriesData as ExpenseCategory[]);
            } catch (err) {
                console.error("Error fetching data from Firestore:", err);
                setError("Failed to load data from the database. Please check your connection and refresh.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const parseDateString = (dateStr: string): Date => {
        if (!dateStr) return new Date(NaN);
        return new Date(`${dateStr}T00:00:00`);
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const addDocument = useCallback(async (docType: GeneratedDocument['type'], title: string, content: string): Promise<string> => {
        const newDocData: Omit<GeneratedDocument, 'id'> = { type: docType, title, content, createdAt: new Date() };
        const docRef = await addDoc(collection(db, "documents"), newDocData);
        setDocuments(prev => [{ ...newDocData, id: docRef.id }, ...prev]);
        return `สร้างเอกสาร ${title} (ID: ${docRef.id}) สำเร็จแล้ว`;
    }, []);

    const generateWelcomeLetter = useCallback(async (booking: Booking, guest: Guest, room: Room): Promise<void> => {
        try {
            const title = `จดหมายต้อนรับสำหรับคุณ ${guest.name}`;
            const prompt = `สร้างจดหมายต้อนรับอย่างอบอุ่นและเป็นมิตรเป็นภาษาไทยสำหรับแขกของโรงแรม VIPAT HMS โดยใช้ข้อมูลต่อไปนี้:\n- ชื่อผู้เข้าพัก: ${guest.name}\n- หมายเลขห้อง: ${room.number}\n- วันที่เข้าพัก: ${booking.checkInDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric'})} ถึง ${booking.checkOutDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric'})}\n\nเนื้อหาควรประกอบด้วย: การกล่าวต้อนรับ, ข้อมูลเบื้องต้นเกี่ยวกับห้องพักและสิ่งอำนวยความสะดวก (เช่น Wi-Fi, เวลาอาหารเช้า), เบอร์ติดต่อสำคัญ, และคำอวยพรให้มีความสุขในการเข้าพัก`;
            const content = await generateDocumentContent(prompt);
            if (content && !content.startsWith('Error:')) {
                await addDocument('Guest Welcome Letter', title, content);
            } else { throw new Error(content || "AI returned empty content."); }
        } catch (error) { console.error(`Failed to generate welcome letter for booking ${booking.id}:`, error); }
    }, [addDocument]);
    
    const addBooking = useCallback(async (guestName: string, phone: string, roomNumber: string, checkInStr: string, checkOutStr: string, source: 'ai' | 'manual' = 'manual'): Promise<string> => {
        const room = rooms.find(r => r.number.toLowerCase() === roomNumber.toLowerCase());
        if (!room) return `ข้อผิดพลาด: ไม่พบห้องหมายเลข ${roomNumber}`;
        if (room.status !== 'Available') return `ข้อผิดพลาด: ห้องหมายเลข ${roomNumber} ไม่ว่าง`;
        const checkIn = parseDateString(checkInStr);
        const checkOut = parseDateString(checkOutStr);
        if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime()) || checkOut <= checkIn) return "ข้อผิดพลาด: วันที่ที่ระบุไม่ถูกต้อง";
        
        let guest = guests.find(g => g.name.toLowerCase() === guestName.toLowerCase());
        if (!guest) {
            const newGuestData: Omit<Guest, 'id'> = { name: guestName, phone: phone || 'N/A', history: [] };
            const guestDocRef = await addDoc(collection(db, "guests"), newGuestData);
            guest = { ...newGuestData, id: guestDocRef.id };
            setGuests(prev => [...prev, guest!]);
        }
        
        const duration = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24));
        const newBookingData: Omit<Booking, 'id'> = { guestId: guest.id, roomId: room.id, checkInDate: checkIn, checkOutDate: checkOut, status: 'Confirmed', totalPrice: room.price * (duration || 1) };
        const bookingDocRef = await addDoc(collection(db, "bookings"), newBookingData);
        const newBooking = { ...newBookingData, id: bookingDocRef.id };

        const batch = writeBatch(db);
        batch.update(doc(db, "rooms", room.id), { status: 'Occupied' });
        batch.update(doc(db, "guests", guest.id), { history: [...guest.history, newBooking.id] });
        await batch.commit();

        setBookings(prev => [...prev, newBooking]);
        setRooms(prev => prev.map(r => r.id === room.id ? {...r, status: 'Occupied'} : r));
        setGuests(prev => prev.map(g => g.id === guest!.id ? {...g, history: [...g.history, newBooking.id]} : g));
        generateWelcomeLetter(newBooking, guest, room);
        if (source === 'ai') setLatestAiBookingId(newBooking.id);
        return `สร้างการจองสำหรับคุณ ${guestName} ในห้อง ${roomNumber} สำเร็จแล้ว Booking ID: ${newBooking.id}`;
    }, [rooms, guests, generateWelcomeLetter]);

    const deleteExpense = useCallback(async (expenseId: string): Promise<string> => {
        try {
            await deleteDoc(doc(db, "expenses", expenseId));
            setExpenses(prev => prev.filter(e => e.id !== expenseId));
            return `ลบรายจ่ายสำเร็จแล้ว`;
        } catch (e) { console.error(e); return `ข้อผิดพลาด: ไม่สามารถลบรายจ่ายได้`; }
    }, []);
    
    const addExpense = useCallback(async (categoryId: string, description: string, amount: number, date: Date): Promise<string> => {
        const newExpenseData = { categoryId, description, amount, date };
        const docRef = await addDoc(collection(db, "expenses"), newExpenseData);
        setExpenses(prev => [{ ...newExpenseData, id: docRef.id }, ...prev]);
        return `บันทึกรายจ่าย '${description}' สำเร็จ`;
    }, []);

    const updateExpense = useCallback(async (expenseId: string, newDetails: any): Promise<string> => {
        await updateDoc(doc(db, "expenses", expenseId), newDetails);
        setExpenses(prev => prev.map(e => e.id === expenseId ? { ...e, ...newDetails } : e));
        return "อัปเดตรายจ่ายสำเร็จ";
    }, []);

    const addIncome = useCallback(async (categoryId: string, description: string, amount: number, date: Date): Promise<string> => {
        const newIncomeData = { categoryId, description, amount, date };
        const docRef = await addDoc(collection(db, "income"), newIncomeData);
        setIncome(prev => [{ ...newIncomeData, id: docRef.id }, ...prev]);
        return `บันทึกรายรับ '${description}' สำเร็จ`;
    }, []);

    const updateIncome = useCallback(async (incomeId: string, newDetails: any): Promise<string> => {
        await updateDoc(doc(db, "income", incomeId), newDetails);
        setIncome(prev => prev.map(i => i.id === incomeId ? { ...i, ...newDetails } : i));
        return "อัปเดตรายรับสำเร็จ";
    }, []);

    const deleteIncome = useCallback(async (incomeId: string): Promise<string> => {
        await deleteDoc(doc(db, "income", incomeId));
        setIncome(prev => prev.filter(i => i.id !== incomeId));
        return "ลบรายรับสำเร็จ";
    }, []);

    const addCategory = useCallback(async (type: 'income' | 'expense', name: string): Promise<string> => {
        const collectionName = type === 'income' ? 'incomeCategories' : 'expenseCategories';
        const state = type === 'income' ? incomeCategories : expenseCategories;
        const setState = type === 'income' ? setIncomeCategories : setExpenseCategories;
        const newCategoryData = { name, order: state.length + 1 };
        const docRef = await addDoc(collection(db, collectionName), newCategoryData);
        // @ts-ignore
        setState(prev => [...prev, { ...newCategoryData, id: docRef.id }]);
        return `เพิ่มหมวดหมู่ '${name}' สำเร็จ`;
    }, [incomeCategories, expenseCategories]);

    const addIncomeCategory = useCallback((name: string) => addCategory('income', name), [addCategory]);
    const addExpenseCategory = useCallback((name: string) => addCategory('expense', name), [addCategory]);

    const updateCategory = useCallback(async (type: 'income' | 'expense', id: string, name: string): Promise<string> => {
        const collectionName = type === 'income' ? 'incomeCategories' : 'expenseCategories';
        const setState = type === 'income' ? setIncomeCategories : setExpenseCategories;
        await updateDoc(doc(db, collectionName, id), { name });
        // @ts-ignore
        setState(prev => prev.map(c => c.id === id ? { ...c, name } : c));
        return `อัปเดตหมวดหมู่เป็น '${name}' สำเร็จ`;
    }, []);
    
    const updateIncomeCategory = useCallback((id: string, name: string) => updateCategory('income', id, name), [updateCategory]);
    const updateExpenseCategory = useCallback((id: string, name: string) => updateCategory('expense', id, name), [updateCategory]);
    
    const deleteCategory = useCallback(async (type: 'income' | 'expense', id: string): Promise<string> => {
        const collectionName = type === 'income' ? 'incomeCategories' : 'expenseCategories';
        const setState = type === 'income' ? setIncomeCategories : setExpenseCategories;
        await deleteDoc(doc(db, collectionName, id));
        // @ts-ignore
        setState(prev => prev.filter(c => c.id !== id));
        return `ลบหมวดหมู่สำเร็จ`;
    }, []);

    const deleteIncomeCategory = useCallback((id: string) => deleteCategory('income', id), [deleteCategory]);
    const deleteExpenseCategory = useCallback((id: string) => deleteCategory('expense', id), [deleteCategory]);

    const reorderCategory = useCallback(async (type: 'income' | 'expense', categoryId: string, direction: 'up' | 'down'): Promise<string> => {
        const collectionName = type === 'income' ? 'incomeCategories' : 'expenseCategories';
        const state = type === 'income' ? incomeCategories : expenseCategories;
        const setState = type === 'income' ? setIncomeCategories : setExpenseCategories;
        const index = state.findIndex(c => c.id === categoryId);
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === state.length - 1)) return "ไม่สามารถย้ายได้";
        
        const otherIndex = direction === 'up' ? index - 1 : index + 1;
        const cat1 = state[index];
        const cat2 = state[otherIndex];
        
        const batch = writeBatch(db);
        batch.update(doc(db, collectionName, cat1.id), { order: cat2.order });
        batch.update(doc(db, collectionName, cat2.id), { order: cat1.order });
        await batch.commit();

        const newState = [...state];
        newState[index] = { ...cat1, order: cat2.order };
        newState[otherIndex] = { ...cat2, order: cat1.order };
        newState.sort((a,b) => a.order - b.order);
        // @ts-ignore
        setState(newState);
        return "จัดลำดับใหม่สำเร็จ";
    }, [incomeCategories, expenseCategories]);
    
    const reorderIncomeCategory = useCallback((id: string, direction: 'up' | 'down') => reorderCategory('income', id, direction), [reorderCategory]);
    const reorderExpenseCategory = useCallback((id: string, direction: 'up' | 'down') => reorderCategory('expense', id, direction), [reorderCategory]);

    const mergeCategory = useCallback(async (type: 'income' | 'expense', sourceId: string, targetId: string): Promise<string> => {
        const mainCollection = type === 'income' ? 'income' : 'expenses';
        const categoryCollection = type === 'income' ? 'incomeCategories' : 'expenseCategories';
        const setState = type === 'income' ? setIncome : setExpenses;
        const setCatState = type === 'income' ? setIncomeCategories : setExpenseCategories;

        const q = query(collection(db, mainCollection), where("categoryId", "==", sourceId));
        const itemsToUpdate = await getDocs(q);
        
        const batch = writeBatch(db);
        itemsToUpdate.forEach(itemDoc => {
            batch.update(doc(db, mainCollection, itemDoc.id), { categoryId: targetId });
        });
        batch.delete(doc(db, categoryCollection, sourceId));
        await batch.commit();
        
        // @ts-ignore
        setState(prev => prev.map(item => item.categoryId === sourceId ? { ...item, categoryId: targetId } : item));
        // @ts-ignore
        setCatState(prev => prev.filter(c => c.id !== sourceId));
        return "รวมหมวดหมู่สำเร็จ";
    }, []);

    const mergeIncomeCategory = useCallback((sourceId: string, targetId: string) => mergeCategory('income', sourceId, targetId), [mergeCategory]);
    const mergeExpenseCategory = useCallback((sourceId: string, targetId: string) => mergeCategory('expense', sourceId, targetId), [mergeCategory]);

    const addInvoice = useCallback(async (tenantId: string, period: string): Promise<string> => {
        const tenant = tenants.find(t => t.id === tenantId);
        if (!tenant) return "ข้อผิดพลาด: ไม่พบผู้เช่า";
        const newInvoiceData = { tenantId, period, issueDate: new Date(), dueDate: new Date(new Date().setDate(new Date().getDate() + 7)), amount: tenant.monthlyRent, status: 'Unpaid' as 'Unpaid' };
        const docRef = await addDoc(collection(db, "invoices"), newInvoiceData);
        setInvoices(prev => [{ ...newInvoiceData, id: docRef.id }, ...prev]);
        return `สร้างใบแจ้งหนี้สำหรับ ${tenant.name} สำเร็จ`;
    }, [tenants]);

    const addTask = useCallback(async (description: string, assignedTo: string, relatedTo: string, dueDate?: string): Promise<string> => {
        const newTaskData: Omit<Task, 'id'> = { description, assignedTo, relatedTo, status: 'To Do', createdAt: new Date(), ...(dueDate && { dueDate: parseDateString(dueDate) }) };
        const docRef = await addDoc(collection(db, "tasks"), newTaskData);
        setTasks(prev => [{ ...newTaskData, id: docRef.id }, ...prev]);
        return `สร้างงาน '${description}' สำเร็จ`;
    }, []);

    const updateTaskStatus = useCallback(async (taskId: string, newStatus: TaskStatus): Promise<void> => {
        await updateDoc(doc(db, "tasks", taskId), { status: newStatus });
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    }, []);
    
    const deleteBooking = useCallback(async (bookingId: string): Promise<string> => {
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking) return "ข้อผิดพลาด: ไม่พบการจอง";
        const batch = writeBatch(db);
        batch.delete(doc(db, "bookings", bookingId));
        if (booking.status === 'Check-In' || booking.status === 'Confirmed') {
            batch.update(doc(db, "rooms", booking.roomId), { status: 'Available' });
        }
        await batch.commit();
        setBookings(prev => prev.filter(b => b.id !== bookingId));
        if (booking.status === 'Check-In' || booking.status === 'Confirmed') {
            setRooms(prev => prev.map(r => r.id === booking.roomId ? { ...r, status: 'Available' } : r));
        }
        return "ลบการจองสำเร็จ";
    }, [bookings]);

    const updateBooking = useCallback(async (bookingId: string, newDetails: any): Promise<string> => {
        const { guestName, phone, roomNumber, checkInStr, checkOutStr } = newDetails;
        
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking) return "ข้อผิดพลาด: ไม่พบการจอง";

        const guest = guests.find(g => g.id === booking.guestId);
        if (!guest) return "ข้อผิดพลาด: ไม่พบผู้เข้าพัก";
        
        const batch = writeBatch(db);

        // Update guest info if changed
        if (guest.name !== guestName || guest.phone !== phone) {
            batch.update(doc(db, "guests", guest.id), { name: guestName, phone });
        }
        
        // Update booking details
        const checkIn = parseDateString(checkInStr);
        const checkOut = parseDateString(checkOutStr);
        if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime()) || checkOut <= checkIn) return "ข้อผิดพลาด: วันที่ที่ระบุไม่ถูกต้อง";
        
        const duration = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24));
        const room = rooms.find(r => r.id === booking.roomId);
        const totalPrice = (room?.price || 0) * (duration || 1);

        batch.update(doc(db, "bookings", bookingId), { checkInDate: checkIn, checkOutDate: checkOut, totalPrice });
        
        await batch.commit();

        setGuests(prev => prev.map(g => g.id === guest.id ? { ...g, name: guestName, phone } : g));
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, checkInDate: checkIn, checkOutDate: checkOut, totalPrice } : b));
        
        return "อัปเดตการจองสำเร็จ";
    }, [bookings, guests, rooms]);
    
    // Data Management functions (Guest, Room, Tenant, Employee)
    const addGuest = useCallback(async (name: string, phone: string): Promise<string> => {
        const newGuestData = { name, phone, history: [] };
        const docRef = await addDoc(collection(db, "guests"), newGuestData);
        setGuests(prev => [...prev, { ...newGuestData, id: docRef.id }]);
        return "เพิ่มผู้เข้าพักสำเร็จ";
    }, []);

    const updateGuest = useCallback(async (guestId: string, details: { name: string, phone: string }): Promise<string> => {
        await updateDoc(doc(db, "guests", guestId), details);
        setGuests(prev => prev.map(g => g.id === guestId ? { ...g, ...details } : g));
        return "อัปเดตข้อมูลผู้เข้าพักสำเร็จ";
    }, []);

    const deleteGuest = useCallback(async (guestId: string): Promise<string> => {
        if (bookings.some(b => b.guestId === guestId)) return "ข้อผิดพลาด: ไม่สามารถลบผู้เข้าพักที่มีประวัติการจองได้";
        await deleteDoc(doc(db, "guests", guestId));
        setGuests(prev => prev.filter(g => g.id !== guestId));
        return "ลบผู้เข้าพักสำเร็จ";
    }, [bookings]);

    const addRoom = useCallback(async (number: string, type: Room['type'], price: number): Promise<string> => {
        if (rooms.some(r => r.number.toLowerCase() === number.toLowerCase())) return `ข้อผิดพลาด: มีห้องหมายเลข ${number} อยู่แล้ว`;
        const newRoomData = { number, type, price, status: 'Available' as 'Available' };
        const docRef = await addDoc(collection(db, "rooms"), newRoomData);
        setRooms(prev => [...prev, { ...newRoomData, id: docRef.id }]);
        return "เพิ่มห้องพักสำเร็จ";
    }, [rooms]);

    const updateRoom = useCallback(async (roomId: string, details: { number: string, type: Room['type'], price: number }): Promise<string> => {
        await updateDoc(doc(db, "rooms", roomId), details);
        setRooms(prev => prev.map(r => r.id === roomId ? { ...r, ...details } : r));
        return "อัปเดตข้อมูลห้องพักสำเร็จ";
    }, []);

    const deleteRoom = useCallback(async (roomId: string): Promise<string> => {
        if (bookings.some(b => b.roomId === roomId && (b.status === 'Check-In' || b.status === 'Confirmed'))) return "ข้อผิดพลาด: ไม่สามารถลบห้องที่มีการจองอยู่ได้";
        await deleteDoc(doc(db, "rooms", roomId));
        setRooms(prev => prev.filter(r => r.id !== roomId));
        return "ลบห้องพักสำเร็จ";
    }, [bookings]);

    const addTenant = useCallback(async (name: string, phone: string, roomId: string, contractStartDateStr: string, contractEndDateStr: string, monthlyRent: number): Promise<string> => {
        const newTenantData = { name, phone, roomId, contractStartDate: parseDateString(contractStartDateStr), contractEndDate: parseDateString(contractEndDateStr), monthlyRent };
        const docRef = await addDoc(collection(db, "tenants"), newTenantData);
        await updateDoc(doc(db, "rooms", roomId), { status: 'Monthly Rental' });
        setTenants(prev => [...prev, { ...newTenantData, id: docRef.id }]);
        setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: 'Monthly Rental' } : r));
        return "เพิ่มผู้เช่ารายเดือนสำเร็จ";
    }, []);

    const updateTenant = useCallback(async (tenantId: string, details: any): Promise<string> => {
        const { contractStartDate, contractEndDate, ...rest } = details;
        const updatedDetails = { ...rest, contractStartDate: parseDateString(contractStartDate), contractEndDate: parseDateString(contractEndDate) };
        await updateDoc(doc(db, "tenants", tenantId), updatedDetails);
        setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, ...updatedDetails } : t));
        return "อัปเดตข้อมูลผู้เช่าสำเร็จ";
    }, []);

    const deleteTenant = useCallback(async (tenantId: string): Promise<string> => {
        const tenant = tenants.find(t => t.id === tenantId);
        if (!tenant) return "ข้อผิดพลาด: ไม่พบผู้เช่า";
        await deleteDoc(doc(db, "tenants", tenantId));
        await updateDoc(doc(db, "rooms", tenant.roomId), { status: 'Available' });
        setTenants(prev => prev.filter(t => t.id !== tenantId));
        setRooms(prev => prev.map(r => r.id === tenant.roomId ? { ...r, status: 'Available' } : r));
        return "ลบผู้เช่าสำเร็จ";
    }, [tenants]);

    const addEmployee = useCallback(async (name: string, position: Employee['position'], hireDateStr: string, salaryType: Employee['salaryType'], salaryRate: number): Promise<string> => {
        const newEmployeeData = { name, position, hireDate: parseDateString(hireDateStr), salaryType, salaryRate, status: 'Active' as 'Active' };
        const docRef = await addDoc(collection(db, "employees"), newEmployeeData);
        setEmployees(prev => [...prev, { ...newEmployeeData, id: docRef.id }]);
        return "เพิ่มพนักงานสำเร็จ";
    }, []);

    const updateEmployee = useCallback(async (employeeId: string, details: any): Promise<string> => {
        const { hireDate, ...rest } = details;
        const updatedDetails = hireDate ? { ...rest, hireDate: parseDateString(hireDate) } : rest;
        await updateDoc(doc(db, "employees", employeeId), updatedDetails);
        setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, ...updatedDetails } : e));
        return "อัปเดตข้อมูลพนักงานสำเร็จ";
    }, []);

    const deleteEmployee = useCallback(async (employeeId: string): Promise<string> => {
        await deleteDoc(doc(db, "employees", employeeId));
        setEmployees(prev => prev.filter(e => e.id !== employeeId));
        return "ลบพนักงานสำเร็จ";
    }, []);

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen"><div>Loading Database...</div></div>;
    }
    if (error) {
        return <div className="flex items-center justify-center h-screen"><div className="p-4 bg-red-100 text-red-700 rounded">{error}</div></div>;
    }

    const renderPage = () => {
        switch (currentPage) {
            case 'ภาพรวม':
                return <Dashboard 
                    bookings={bookings} rooms={rooms} expenses={expenses} tasks={tasks} invoices={invoices} 
                    guests={guests}
                    setCurrentPage={setCurrentPage} setFinanceDateFilter={setFinanceDateFilter}
                    latestAiBookingId={latestAiBookingId} setLatestAiBookingId={setLatestAiBookingId}
                    setBookingRoomFilter={setBookingRoomFilter}
                />;
            case 'การดำเนินงาน':
                return <Operations 
                    bookings={bookings} guests={guests} rooms={rooms} tasks={tasks} employees={employees}
                    addBooking={addBooking} updateBooking={updateBooking} deleteBooking={deleteBooking}
                    addTask={addTask} updateTaskStatus={updateTaskStatus}
                    bookingRoomFilter={bookingRoomFilter} setBookingRoomFilter={setBookingRoomFilter}
                />;
            case 'การเงิน':
                return <Finance 
                    bookings={bookings} expenses={expenses} income={income}
                    expenseCategories={expenseCategories} incomeCategories={incomeCategories}
                    addExpense={addExpense} updateExpense={updateExpense} deleteExpense={deleteExpense}
                    addIncome={addIncome} updateIncome={updateIncome} deleteIncome={deleteIncome}
                    addExpenseCategory={addExpenseCategory} updateExpenseCategory={updateExpenseCategory} deleteExpenseCategory={deleteExpenseCategory}
                    addIncomeCategory={addIncomeCategory} updateIncomeCategory={updateIncomeCategory} deleteIncomeCategory={deleteIncomeCategory}
                    reorderIncomeCategory={reorderIncomeCategory} reorderExpenseCategory={reorderExpenseCategory}
                    mergeIncomeCategory={mergeIncomeCategory} mergeExpenseCategory={mergeExpenseCategory}
                    employees={employees} attendance={attendance}
                    financeDateFilter={financeDateFilter} setFinanceDateFilter={setFinanceDateFilter}
                />;
            case 'ลูกค้า':
                return <Customers 
                    guests={guests} tenants={tenants} rooms={rooms} invoices={invoices} bookings={bookings}
                    addGuest={addGuest} updateGuest={updateGuest} deleteGuest={deleteGuest}
                    addTenant={addTenant} updateTenant={updateTenant} deleteTenant={deleteTenant}
                    addInvoice={addInvoice}
                />;
             case 'การจัดการข้อมูล':
                return <DataManagement
                    rooms={rooms} employees={employees} bookings={bookings} tenants={tenants} tasks={tasks}
                    guests={guests} expenses={expenses} attendance={attendance} expenseCategories={expenseCategories}
                    addRoom={addRoom} updateRoom={updateRoom} deleteRoom={deleteRoom}
                    addEmployee={addEmployee} updateEmployee={updateEmployee} deleteEmployee={deleteEmployee}
                    setCurrentPage={setCurrentPage} setBookingRoomFilter={setBookingRoomFilter}
                />;
            case 'เอกสารและรายงาน':
                return <Reports 
                    bookings={bookings} guests={guests} expenses={expenses} rooms={rooms} employees={employees} tenants={tenants} documents={documents} attendance={attendance}
                    addDocument={addDocument}
                 />;
            case 'Live Chat':
                return <LiveChat />;
            default:
                return <div>ไม่พบหน้า: {currentPage}</div>;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} currentPage={currentPage} setCurrentPage={setCurrentPage} />
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