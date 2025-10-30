// types.ts

export type Page = 'ภาพรวม' | 'การดำเนินงาน' | 'การเงิน' | 'ข้อมูลบุคคล' | 'เอกสารและส่งออก';

export type RoomType = 'Standard' | 'Standard Twin' | 'Deluxe' | 'Suite';
export type RoomStatus = 'ว่าง' | 'ไม่ว่าง' | 'ทำความสะอาด' | 'เช่ารายเดือน';
export type RoomStatusFilter = 'available' | 'occupied' | null;


export interface Room {
  id: string;
  number: string;
  type: RoomType;
  price: number;
  status: RoomStatus;
}

export interface Guest {
  id: string;
  name: string;
  phone: string;
  history: string[]; // Array of booking IDs
}

export type BookingStatus = 'เช็คอิน' | 'เช็คเอาท์' | 'ยืนยันแล้ว' | 'ยกเลิก';

export interface Booking {
  id: string;
  guestId: string;
  roomId: string;
  checkInDate: Date;
  checkOutDate: Date;
  totalPrice: number;
  status: BookingStatus;
  source: 'ai' | 'manual';
}

export type EmployeePosition = 'ผู้จัดการ' | 'พนักงานต้อนรับ' | 'แม่บ้าน';
export type EmployeeSalaryType = 'รายเดือน' | 'รายวัน';
export type EmployeeStatus = 'ทำงานอยู่' | 'ลาออกแล้ว';

export interface Employee {
  id: string;
  name: string;
  position: EmployeePosition;
  hireDate: Date;
  salaryType: EmployeeSalaryType;
  salaryRate: number;
  status: EmployeeStatus;
}

export interface Tenant {
  id: string;
  name: string;
  phone: string;
  roomId: string;
  monthlyRent: number;
  contractStartDate: Date;
  contractEndDate: Date;
}

export type TaskStatus = 'ต้องทำ' | 'กำลังทำ' | 'เสร็จแล้ว';

export interface Task {
  id: string;
  description: string;
  assignedTo: string; // Employee ID
  relatedTo: string; // Room ID
  dueDate?: Date;
  createdAt: Date;
  status: TaskStatus;
}

export type ExpenseCategory = 'เงินเดือน' | 'สาธารณูปโภค' | 'การตลาด' | 'ซ่อมบำรุง' | 'อื่นๆ';
export interface Expense {
  id: string;
  date: Date;
  category: ExpenseCategory;
  description: string;
  amount: number;
}

export type PaymentMethod = 'เงินสด' | 'โอน' | 'บัตรเครดิต';
export interface Income {
    id: string;
    date: Date;
    bookingId?: string; // Link to a booking if applicable
    description: string;
    paymentMethod: PaymentMethod;
    amount: number;
}

export type InvoiceStatus = 'ยังไม่ชำระ' | 'ชำระแล้ว' | 'เกินกำหนด';
export interface Invoice {
    id: string;
    tenantId: string; // Link to a tenant
    period: string; // e.g., "มิถุนายน 2567"
    amount: number;
    dueDate: Date;
    status: InvoiceStatus;
}

export interface GeneratedDocument {
  title: string;
  type: 'ใบเสร็จ' | 'ใบกำกับภาษี';
  content: string; // HTML content
  createdAt: Date;
}

export interface SheetData {
    sheetName: string;
    headers: string[];
    data: (string | number | Date)[][];
}

export interface FormFieldOption {
    value: string;
    label: string;
}

export interface FormField {
    name: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select' | 'textarea';
    required?: boolean;
    options?: FormFieldOption[];
}

export type AiChatMessage = {
  role: "user" | "model" | "system";
  parts: (
    | { text: string }
    | { functionCall: { name: string, args: any } }
    | { functionResponse: { name: string, response: any } }
  )[];
  imagePreview?: string;
};
