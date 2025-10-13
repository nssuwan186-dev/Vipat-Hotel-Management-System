import type { Room, Guest, Booking, Expense, Employee, Attendance, Tenant, Invoice, Task } from '../types';

export const today = new Date();
today.setHours(0, 0, 0, 0);
export const aMonthFromNow = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());

export const mockRooms: Room[] = [
  { id: 'R01', number: 'A101', type: 'Standard', price: 400, status: 'Occupied' },
  { id: 'R02', number: 'A102', type: 'Standard', price: 400, status: 'Occupied' },
  { id: 'R03', number: 'A103', type: 'Standard', price: 400, status: 'Occupied' },
  { id: 'R04', number: 'A104', type: 'Standard', price: 400, status: 'Occupied' },
  { id: 'R05', number: 'A105', type: 'Standard', price: 400, status: 'Occupied' },
  { id: 'R06', number: 'A106', type: 'Standard Twin', price: 500, status: 'Occupied' },
  { id: 'R07', number: 'A107', type: 'Standard Twin', price: 500, status: 'Available' },
  { id: 'R08', number: 'A108', type: 'Standard Twin', price: 500, status: 'Available' },
  { id: 'R09', number: 'A109', type: 'Standard Twin', price: 500, status: 'Occupied' },
  { id: 'R10', number: 'A110', type: 'Standard Twin', price: 500, status: 'Occupied' },
  { id: 'R11', number: 'A111', type: 'Standard', price: 400, status: 'Occupied' },
  { id: 'R12', number: 'A201', type: 'Standard', price: 400, status: 'Available' },
  { id: 'R13', number: 'A202', type: 'Standard', price: 400, status: 'Available' },
  { id: 'R14', number: 'A203', type: 'Standard', price: 400, status: 'Available' },
  { id: 'R15', number: 'A204', type: 'Standard', price: 400, status: 'Monthly Rental' },
  { id: 'R16', number: 'A205', type: 'Standard', price: 400, status: 'Monthly Rental' },
  { id: 'R17', number: 'A206', type: 'Standard', price: 400, status: 'Monthly Rental' },
  { id: 'R18', number: 'A207', type: 'Standard', price: 400, status: 'Occupied' },
  { id: 'R19', number: 'A208', type: 'Standard', price: 400, status: 'Monthly Rental' },
  { id: 'R20', number: 'A209', type: 'Standard', price: 400, status: 'Occupied' },
  { id: 'R21', number: 'A210', type: 'Standard', price: 400, status: 'Available' },
  { id: 'R22', number: 'A211', type: 'Standard', price: 400, status: 'Available' },
  { id: 'R23', number: 'B101', type: 'Standard', price: 400, status: 'Occupied' },
  { id: 'R24', number: 'B102', type: 'Standard', price: 400, status: 'Occupied' },
  { id: 'R25', number: 'B103', type: 'Standard', price: 400, status: 'Occupied' },
  { id: 'R26', number: 'B104', type: 'Standard', price: 400, status: 'Occupied' },
  { id: 'R27', number: 'B105', type: 'Standard', price: 400, status: 'Occupied' },
  { id: 'R28', number: 'B106', type: 'Standard', price: 400, status: 'Occupied' },
  { id: 'R29', number: 'B107', type: 'Standard', price: 400, status: 'Occupied' },
  { id: 'R30', number: 'B108', type: 'Standard', price: 400, status: 'Occupied' },
  { id: 'R31', number: 'B109', type: 'Standard', price: 400, status: 'Occupied' },
  { id: 'R32', number: 'B110', type: 'Standard', price: 400, status: 'Occupied' },
  { id: 'R33', number: 'B111', type: 'Standard Twin', price: 500, status: 'Available' },
  { id: 'R34', number: 'B201', type: 'Standard', price: 400, status: 'Available' },
  { id: 'R35', number: 'B202', type: 'Standard', price: 400, status: 'Available' },
  { id: 'R36', number: 'B203', type: 'Standard', price: 400, status: 'Occupied' },
  { id: 'R37', number: 'B204', type: 'Standard', price: 400, status: 'Occupied' },
  { id: 'R38', number: 'B205', type: 'Standard', price: 400, status: 'Occupied' },
  { id: 'R39', number: 'B206', type: 'Standard', price: 400, status: 'Occupied' },
  { id: 'R40', number: 'B207', type: 'Standard', price: 400, status: 'Available' },
  { id: 'R41', number: 'B208', type: 'Standard', price: 400, status: 'Occupied' },
  { id: 'R42', number: 'B209', type: 'Standard', price: 400, status: 'Occupied' },
  { id: 'R43', number: 'B210', type: 'Standard', price: 400, status: 'Available' },
  { id: 'R44', number: 'B211', type: 'Standard', price: 400, status: 'Available' },
  { id: 'R45', number: 'N1', type: 'Standard Twin', price: 600, status: 'Available' },
  { id: 'R46', number: 'N2', type: 'Standard', price: 500, status: 'Occupied' },
  { id: 'R47', number: 'N3', type: 'Standard', price: 500, status: 'Available' },
  { id: 'R48', number: 'N4', type: 'Standard Twin', price: 600, status: 'Available' },
  { id: 'R49', number: 'N5', type: 'Standard Twin', price: 600, status: 'Available' },
  { id: 'R50', number: 'N6', type: 'Standard Twin', price: 600, status: 'Available' },
  { id: 'R51', number: 'N7', type: 'Standard', price: 500, status: 'Occupied' },
];

export const mockGuests: Guest[] = [
  { id: 'G01', name: 'ฐานุเดช', phone: '081-234-5678', history: ['B01'] },
  { id: 'G02', name: 'สมศรี', phone: '082-345-6789', history: ['B02'] },
  { id: 'G03', name: 'ปีเตอร์ โจนส์', phone: '083-456-7890', history: ['B03'] },
  { id: 'G04', name: 'ศิริพร', phone: '084-567-8901', history: ['B04'] },
];

export const mockBookings: Booking[] = [
  { 
    id: 'B01', 
    guestId: 'G01', 
    roomId: 'R01', 
    checkInDate: new Date(new Date().setDate(today.getDate() - 1)), 
    checkOutDate: new Date(new Date().setDate(today.getDate() + 2)), 
    status: 'Check-In', 
    totalPrice: 1200
  },
  { 
    id: 'B02', 
    guestId: 'G02', 
    roomId: 'R04', 
    checkInDate: new Date(new Date().setDate(today.getDate())), 
    checkOutDate: new Date(new Date().setDate(today.getDate() + 1)), 
    status: 'Check-In', 
    totalPrice: 400
  },
  { 
    id: 'B03', 
    guestId: 'G03', 
    roomId: 'R06', 
    checkInDate: new Date(new Date().setDate(today.getDate() + 3)), 
    checkOutDate: new Date(new Date().setDate(today.getDate() + 5)), 
    status: 'Confirmed', 
    totalPrice: 1000
  },
  {
    id: 'B04',
    guestId: 'G04',
    roomId: 'R02',
    checkInDate: new Date(new Date().setDate(today.getDate() - 1)),
    checkOutDate: today,
    status: 'Check-Out',
    totalPrice: 400
  }
];


export const mockExpenses: Expense[] = [
    { id: 'E01', date: new Date(new Date().setDate(today.getDate() - 2)), category: 'Utilities', description: 'Electricity Bill', amount: 5500 },
    { id: 'E02', date: new Date(new Date().setDate(today.getDate() - 1)), category: 'Supplies', description: 'Cleaning Supplies', amount: 1200 },
    { id: 'E03', date: new Date(new Date().setDate(today.getDate())), category: 'Maintenance', description: 'Fix Air Conditioner Room 103', amount: 800 },
    { id: 'E04', date: new Date(new Date().setMonth(today.getMonth() - 1)), category: 'Salaries', description: 'Staff salaries for last month', amount: 50000 },
];

export const mockEmployees: Employee[] = [
    { id: 'EMP01', name: 'สมชาย ใจดี', position: 'Manager', hireDate: new Date('2022-01-15'), status: 'Active', salaryType: 'Monthly', salaryRate: 45000 },
    { id: 'EMP02', name: 'มานี รักไทย', position: 'Receptionist', hireDate: new Date('2023-03-01'), status: 'Active', salaryType: 'Monthly', salaryRate: 22000 },
    { id: 'EMP03', name: 'วิชัย มีสุข', position: 'Housekeeping', hireDate: new Date('2023-08-20'), status: 'Active', salaryType: 'Daily', salaryRate: 500 },
    { id: 'EMP04', name: 'สมศรี สุขใจ', position: 'Housekeeping', hireDate: new Date('2022-11-10'), status: 'Inactive', terminationDate: new Date('2024-05-31'), salaryType: 'Daily', salaryRate: 480 },
];

const lastMonth = new Date();
lastMonth.setMonth(lastMonth.getMonth() -1);
export const mockAttendance: Attendance[] = Array.from({ length: 30 }).flatMap((_, i) => 
    mockEmployees.filter(e => e.status === 'Active').map(employee => {
        const date = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), i + 1);
        const dayOfWeek = date.getDay();
        let status: 'Present' | 'Absent' | 'Leave' = 'Present';
        if (dayOfWeek === 0) status = 'Absent'; // Sunday off
        if (employee.id === 'EMP02' && i > 20 && i < 23) status = 'Leave'; // Manee on leave
        return {
            id: `ATT-${employee.id}-${i}`,
            employeeId: employee.id,
            date: date,
            status: status
        };
    })
);

export const mockTenants: Tenant[] = [
    { id: 'T01', name: 'จอห์น โด', phone: '091-111-1111', roomId: 'R15', contractStartDate: new Date('2024-01-01'), contractEndDate: new Date('2024-12-31'), monthlyRent: 15000 }
];

export const mockInvoices: Invoice[] = Array.from({ length: 6 }).map((_, i) => {
    const date = new Date(today.getFullYear(), i, 1);
    return {
        id: `INV-T01-${i+1}`,
        tenantId: 'T01',
        issueDate: date,
        dueDate: new Date(today.getFullYear(), i, 5),
        period: date.toLocaleString('th-TH', { month: 'long', year: 'numeric' }),
        amount: 15000,
        status: i < (today.getMonth()) ? 'Paid' : 'Unpaid'
    }
});

export const mockTasks: Task[] = [
    { id: 'TASK01', description: 'ทำความสะอาดห้อง A107 หลังจากแขกเช็คเอาท์', status: 'To Do', assignedTo: 'EMP03', relatedTo: 'R07', createdAt: new Date(new Date().setDate(today.getDate() -1)) },
    { id: 'TASK02', description: 'ซ่อมเครื่องปรับอากาศไม่เย็น', status: 'In Progress', assignedTo: 'EMP03', relatedTo: 'R03', createdAt: new Date(), dueDate: new Date(new Date().setDate(today.getDate() + 1)) },
    { id: 'TASK03', description: 'เปลี่ยนผ้าปูที่นอนและผ้าเช็ดตัวห้อง A102', status: 'Done', assignedTo: 'EMP03', relatedTo: 'R02', createdAt: new Date(new Date().setDate(today.getDate() -2)) },
    { id: 'TASK04', description: 'ตรวจสอบมินิบาร์ห้อง A101', status: 'To Do', assignedTo: 'EMP03', relatedTo: 'R01', createdAt: new Date() },
];