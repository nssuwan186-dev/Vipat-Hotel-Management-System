export type Page = 'ภาพรวม' | 'การจอง' | 'การเงิน' | 'จัดการข้อมูล' | 'เอกสารและรายงาน' | 'การจัดการงาน';

export interface Room {
  id: string;
  number: string;
  type: 'Standard' | 'Standard Twin';
  price: number; // Per night for daily, ignored for monthly
  status: 'Available' | 'Occupied' | 'Cleaning' | 'Monthly Rental';
}

export interface Guest {
  id: string;
  name: string;
  phone: string;
  history: string[];
}

export interface Booking {
  id: string;
  guestId: string;
  roomId: string;
  checkInDate: Date;
  checkOutDate: Date;
  status: 'Check-In' | 'Check-Out' | 'Confirmed' | 'Cancelled';
  totalPrice: number;
}

export interface Expense {
    id: string;
    date: Date;
    category: 'Utilities' | 'Supplies' | 'Maintenance' | 'Salaries';
    description: string;
    amount: number;
}

export interface AiChatMessage {
    role: 'user' | 'model';
    text: string;
    isFunctionResponse?: boolean;
}

export interface Employee {
    id: string;
    name: string;
    position: 'Manager' | 'Receptionist' | 'Housekeeping';
    hireDate: Date;
    terminationDate?: Date;
    status: 'Active' | 'Inactive';
    salaryType: 'Monthly' | 'Daily';
    salaryRate: number;
}

export interface Attendance {
    id:string;
    employeeId: string;
    date: Date;
    status: 'Present' | 'Absent' | 'Leave';
}

export interface Tenant {
    id: string;
    name: string;
    phone: string;
    roomId: string;
    contractStartDate: Date;
    contractEndDate: Date;
    monthlyRent: number;
}

export interface Invoice {
    id: string;
    tenantId: string;
    issueDate: Date;
    dueDate: Date;
    period: string; // e.g., "July 2024"
    amount: number;
    status: 'Paid' | 'Unpaid';
}

export interface GeneratedDocument {
  id: string;
  type: 'Invoice' | 'Booking Confirmation' | 'Employee Contract' | 'Guest Welcome Letter' | 'Lost and Found Notice' | 'Maintenance Request' | 'Receipt' | 'Tax Invoice';
  title: string;
  content: string; // Markdown or plain text for most, HTML for Receipts and Tax Invoices
  createdAt: Date;
}

export type TaskStatus = 'To Do' | 'In Progress' | 'Done';

export interface Task {
  id: string;
  description: string;
  status: TaskStatus;
  assignedTo: string; // Employee ID
  relatedTo: string; // Room ID
  createdAt: Date;
  dueDate?: Date;
}

export interface SheetExportData {
    sheetTitle: string;
    headers: string[];
    rows: (string | number | null)[][];
}

export interface MultiSheetExportPayload {
    sheets: SheetExportData[];
}