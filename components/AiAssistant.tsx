import React, { useState, useRef, useEffect, FC } from 'react';
import { Content, Part, GenerateContentResponse } from '@google/genai';
import { runAiChat, generateDocumentContent } from '../services/geminiService';
import type { AiChatMessage, Room, Booking, Guest, Expense, Tenant, Employee, Invoice, GeneratedDocument } from '../types';
import { generateReceiptHtml, generateTaxInvoiceHtml } from '../services/documentService';

const ChatBubble: FC<{ message: AiChatMessage }> = ({ message }) => {
    const isModel = message.role === 'model';
    const bubbleClasses = isModel
        ? 'bg-gray-200 text-gray-800 self-start'
        : 'bg-blue-600 text-white self-end';

    const renderContent = () => {
        if (message.isFunctionResponse) {
            return (
                <div className="text-xs p-2 bg-gray-600 text-gray-100 rounded-md font-mono">
                    <p className="font-semibold mb-1">ผลลัพธ์จากการเรียกใช้ฟังก์ชัน</p>
                    <p className="whitespace-pre-wrap">{message.text}</p>
                </div>
            );
        }
        return <p>{message.text}</p>;
    };

    return (
        <div className={`max-w-xs md:max-w-md p-2 rounded-2xl ${bubbleClasses}`}>
            {renderContent()}
        </div>
    );
};


interface AiAssistantProps {
    chatHistory: AiChatMessage[];
    setChatHistory: React.Dispatch<React.SetStateAction<AiChatMessage[]>>;
    context: { rooms: Room[], bookings: Booking[], guests: Guest[], expenses: Expense[], tenants: Tenant[], employees: Employee[], invoices: Invoice[] };
    actions: {
        addBooking: (guestName: string, phone: string, roomNumber: string, checkIn: string, checkOut: string) => string;
        addDocument: (docType: GeneratedDocument['type'], title: string, content: string) => string;
    };
}

const AiAssistant: React.FC<AiAssistantProps> = ({ chatHistory, setChatHistory, context, actions }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatBodyRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const getRoomAvailability = (checkInDateStr: string, checkOutDateStr: string, roomType?: Room['type']): string => {
        const checkIn = new Date(checkInDateStr);
        const checkOut = new Date(checkOutDateStr);
    
        if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime()) || checkOut <= checkIn) {
            return "ข้อผิดพลาด: วันที่ที่ระบุไม่ถูกต้อง";
        }
    
        const availableRooms = context.rooms.filter(room => {
            if (roomType && room.type.toLowerCase() !== roomType.toLowerCase()) {
                return false;
            }
            if (room.status === 'Monthly Rental') return false;
    
            const isOverlapping = context.bookings.some(booking =>
                booking.roomId === room.id &&
                booking.status !== 'Cancelled' &&
                checkIn < new Date(booking.checkOutDate) &&
                checkOut > new Date(booking.checkInDate)
            );
            return !isOverlapping;
        });
    
        if (availableRooms.length === 0) {
            return "ไม่มีห้องว่างในช่วงวันที่เลือก" + (roomType ? ` สำหรับประเภท ${roomType}` : "") + ".";
        }
    
        return "ห้องที่ว่าง: " + availableRooms.map(r => `${r.number} (${r.type})`).join(', ');
    };

    const convertChatHistoryToApiContent = (history: AiChatMessage[]): Content[] => {
        const apiHistory: Content[] = [];
        history.forEach(msg => {
            if (msg.isFunctionResponse) {
                apiHistory.push({
                    role: 'user', 
                    parts: [{ functionResponse: JSON.parse(msg.text) }]
                });
            } else if (msg.role === 'model' && msg.text.startsWith('{"functionCall"')) {
                 try {
                     const parsed = JSON.parse(msg.text);
                     apiHistory.push({ role: 'model', parts: [{ functionCall: parsed.functionCall }] });
                 } catch(e) { /* ignore malformed JSON */ }
            } else {
                apiHistory.push({ role: msg.role, parts: [{ text: msg.text }] });
            }
        });
        return apiHistory;
    };

    const generateAndStoreDocument = async (documentType: GeneratedDocument['type'], referenceId: string, details?: string): Promise<string> => {
        let prompt = '';
        let title = '';
        let data: any = null;

        switch (documentType) {
            case 'Booking Confirmation':
            case 'Guest Welcome Letter':
                const booking = context.bookings.find(b => b.id === referenceId);
                if (!booking) return `ข้อผิดพลาด: ไม่พบการจอง ID ${referenceId}`;
                const guest = context.guests.find(g => g.id === booking.guestId);
                const room = context.rooms.find(r => r.id === booking.roomId);
                if (!guest || !room) return `ข้อผิดพลาด: ไม่พบข้อมูลผู้เข้าพักหรือห้องพักสำหรับการจอง ID ${referenceId}`;
                
                data = { ...booking, guestName: guest.name, roomNumber: room.number, roomType: room.type };
                
                if (documentType === 'Booking Confirmation') {
                    title = `ยืนยันการจองสำหรับคุณ ${guest.name} (${booking.id})`;
                    prompt = `สร้างเอกสารยืนยันการจองอย่างเป็นทางการเป็นภาษาไทย โดยใช้ข้อมูลต่อไปนี้:\n- ชื่อผู้เข้าพัก: ${data.guestName}\n- ID การจอง: ${data.id}\n- หมายเลขห้อง: ${data.roomNumber}\n- ประเภทห้อง: ${data.roomType}\n- วันที่เช็คอิน: ${data.checkInDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric'})}\n- วันที่เช็คเอาท์: ${data.checkOutDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric'})}\n- ราคารวม: ${data.totalPrice.toLocaleString('th-TH')} บาท\n- สถานะ: ${data.status}\n\nจัดรูปแบบให้ชัดเจน มีหัวเรื่อง รายละเอียด และข้อความขอบคุณ`;
                } else { // Guest Welcome Letter
                    title = `จดหมายต้อนรับสำหรับคุณ ${guest.name}`;
                    prompt = `สร้างจดหมายต้อนรับอย่างอบอุ่นและเป็นมิตรเป็นภาษาไทยสำหรับแขกของโรงแรม VIPAT HMS โดยใช้ข้อมูลต่อไปนี้:\n- ชื่อผู้เข้าพัก: ${data.guestName}\n- หมายเลขห้อง: ${data.roomNumber}\n- วันที่เข้าพัก: ${data.checkInDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric'})} ถึง ${data.checkOutDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric'})}\n\nเนื้อหาควรประกอบด้วย: การกล่าวต้อนรับ, ข้อมูลเบื้องต้นเกี่ยวกับห้องพักและสิ่งอำนวยความสะดวก (เช่น Wi-Fi, เวลาอาหารเช้า), เบอร์ติดต่อสำคัญ, และคำอวยพรให้มีความสุขในการเข้าพัก`;
                }
                break;

            case 'Invoice':
                const tenant = context.tenants.find(t => t.id === referenceId);
                if (!tenant) return `ข้อผิดพลาด: ไม่พบผู้เช่า ID ${referenceId}`;
                const latestInvoice = context.invoices.filter(i => i.tenantId === referenceId).sort((a,b) => b.issueDate.getTime() - a.issueDate.getTime())[0];
                if (!latestInvoice) return `ข้อผิดพลาด: ไม่พบใบแจ้งหนี้สำหรับผู้เช่า ID ${referenceId}`;

                data = { ...latestInvoice, tenantName: tenant.name, roomNumber: context.rooms.find(r => r.id === tenant.roomId)?.number };
                title = `ใบแจ้งหนี้สำหรับคุณ ${tenant.name} - ${data.period}`;
                prompt = `สร้างใบแจ้งหนี้อย่างเป็นทางการเป็นภาษาไทยสำหรับการเช่าห้องรายเดือน โดยใช้ข้อมูลต่อไปนี้:\n- ชื่อผู้เช่า: ${data.tenantName}\n- เลขที่ใบแจ้งหนี้: ${data.id}\n- หมายเลขห้อง: ${data.roomNumber}\n- วันที่ออกใบแจ้งหนี้: ${data.issueDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric'})}\n- วันครบกำหนดชำระ: ${data.dueDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric'})}\n- รอบบิล: ${data.period}\n- ยอดที่ต้องชำระ: ${data.amount.toLocaleString('th-TH')} บาท\n- สถานะ: ${data.status}\n\nจัดรูปแบบโดยมีรายละเอียดโรงแรม (VIPAT HMS), รายละเอียดผู้เช่า, รายละเอียดใบแจ้งหนี้, และข้อมูลการชำระเงิน`;
                break;

            case 'Employee Contract':
                 const employee = context.employees.find(e => e.id === referenceId);
                 if (!employee) return `ข้อผิดพลาด: ไม่พบพนักงาน ID ${referenceId}`;

                 data = employee;
                 title = `สัญญาจ้างงานสำหรับคุณ ${employee.name}`;
                 prompt = `สร้างสัญญาจ้างงานอย่างง่ายเป็นภาษาไทย โดยใช้ข้อมูลต่อไปนี้:\n- ชื่อพนักงาน: ${data.name}\n- ตำแหน่ง: ${data.position}\n- วันที่เริ่มงาน: ${data.hireDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric'})}\n- ประเภทเงินเดือน: ${data.salaryType === 'Monthly' ? 'รายเดือน' : 'รายวัน'}\n- อัตราเงินเดือน: ${data.salaryRate.toLocaleString('th-TH')} บาท\n\nให้มีหัวข้อสำหรับ: คู่สัญญา, ตำแหน่งและหน้าที่, วันที่เริ่มงาน, ค่าตอบแทน, และมีช่องลงนามสำหรับพนักงานและตัวแทนโรงแรม (ผู้จัดการ) ทำให้กระชับ`;
                 break;
            
            case 'Lost and Found Notice':
                title = `ประกาศของหาย: ${referenceId}`;
                prompt = `สร้างประกาศของหายอย่างเป็นทางการเป็นภาษาไทยสำหรับโรงแรม VIPAT HMS.\n- สิ่งของที่พบ: ${referenceId}\n- รายละเอียดเพิ่มเติมจากผู้แจ้ง: ${details || 'ไม่มี'}\n\nประกาศควรระบุว่าพบสิ่งของดังกล่าว และให้เจ้าของติดต่อที่แผนกต้อนรับเพื่อรับคืน พร้อมแสดงหลักฐานความเป็นเจ้าของ`;
                break;

            case 'Maintenance Request':
                const maintenanceRoom = context.rooms.find(r => r.id === referenceId || r.number === referenceId);
                if (!maintenanceRoom) return `ข้อผิดพลาด: ไม่พบห้อง ID หรือหมายเลข ${referenceId}`;
                title = `ใบแจ้งซ่อมห้อง ${maintenanceRoom.number}`;
                prompt = `สร้างใบแจ้งซ่อมบำรุงอย่างเป็นทางการเป็นภาษาไทยสำหรับโรงแรม VIPAT HMS.\n- หมายเลขห้อง: ${maintenanceRoom.number}\n- ปัญหาที่แจ้ง: ${details || 'ยังไม่ได้ระบุ'}\n\nเอกสารควรมีหัวข้อสำหรับ: วันที่แจ้ง, ห้อง, ปัญหาที่พบ, ผู้รับผิดชอบ, และสถานะการดำเนินการ`;
                break;

            case 'Tax Invoice':
                return `ข้อผิดพลาด: ประเภทเอกสาร 'Tax Invoice' ควรถูกสร้างโดยใช้ฟังก์ชันสร้างใบกำกับภาษี`;
            
            case 'Receipt':
                return `ข้อผิดพลาด: ประเภทเอกสาร 'Receipt' ควรถูกสร้างโดยใช้ฟังก์ชันสร้างใบเสร็จ`;

            default:
                // Ensure exhaustive check
                const exhaustiveCheck: never = documentType;
                return `ข้อผิดพลาด: ไม่รองรับประเภทเอกสาร "${exhaustiveCheck}"`;
        }
        
        const content = await generateDocumentContent(prompt);
        if (content.startsWith('Error:')) {
            return content;
        }
        
        return actions.addDocument(documentType, title, content);
    };
    
    const generateAndStoreReceipt = async (bookingId: string, totalAmount: number): Promise<string> => {
        try {
            const booking = context.bookings.find(b => b.id === bookingId);
            if (!booking) return `ข้อผิดพลาด: ไม่พบการจอง ID ${bookingId}`;
            const guest = context.guests.find(g => g.id === booking.guestId);
            const room = context.rooms.find(r => r.id === booking.roomId);
            if (!guest || !room) return `ข้อผิดพลาด: ไม่พบข้อมูลที่จำเป็นสำหรับการสร้างใบเสร็จ`;
    
            const htmlContent = await generateReceiptHtml({ booking, guest, room, totalAmount });
            const title = `ใบเสร็จสำหรับคุณ ${guest.name} (${booking.id})`;
            return actions.addDocument('Receipt', title, htmlContent);
    
        } catch (error: any) {
            console.error("Error generating receipt:", error);
            return `ข้อผิดพลาด: ${error.message || "เกิดข้อผิดพลาดขณะสร้างใบเสร็จ"}`;
        }
    };

    const generateAndStoreTaxInvoice = async (bookingId: string, totalAmount: number): Promise<string> => {
        try {
            const booking = context.bookings.find(b => b.id === bookingId);
            if (!booking) return `ข้อผิดพลาด: ไม่พบการจอง ID ${bookingId}`;
            const guest = context.guests.find(g => g.id === booking.guestId);
            const room = context.rooms.find(r => r.id === booking.roomId);
            if (!guest || !room) return `ข้อผิดพลาด: ไม่พบข้อมูลที่จำเป็นสำหรับการสร้างใบกำกับภาษี`;
    
            const htmlContent = await generateTaxInvoiceHtml({ booking, guest, room, totalAmount });
            const title = `ใบกำกับภาษีสำหรับคุณ ${guest.name} (${booking.id})`;
            return actions.addDocument('Tax Invoice', title, htmlContent);
    
        } catch (error: any) {
            console.error("Error generating tax invoice:", error);
            return `ข้อผิดพลาด: ${error.message || "เกิดข้อผิดพลาดขณะสร้างใบกำกับภาษี"}`;
        }
    };


    const handleFunctionCalls = async (response: GenerateContentResponse): Promise<GenerateContentResponse> => {
        if (!response.functionCalls || response.functionCalls.length === 0) {
            return response;
        }
        
        const fc = response.functionCalls[0];
        const { name, args } = fc;

        setChatHistory(prev => [...prev, { role: 'model', text: `กำลังเรียกใช้ฟังก์ชัน: ${name} ด้วยข้อมูล: ${JSON.stringify(args)}` }]);

        let functionResult: any;
        if (name === 'create_booking') {
            functionResult = actions.addBooking(args.guestName as string, (args.phoneNumber as string) || '', args.roomNumber as string, args.checkInDate as string, args.checkOutDate as string);
        } else if (name === 'get_room_availability') {
            functionResult = getRoomAvailability(args.checkInDate as string, args.checkOutDate as string, args.roomType as Room['type']);
        } else if (name === 'generate_document') {
            functionResult = await generateAndStoreDocument(args.documentType as GeneratedDocument['type'], args.referenceId as string, args.details as string | undefined);
        } else if (name === 'generate_receipt') {
            functionResult = await generateAndStoreReceipt(args.bookingId as string, args.totalAmount as number);
        } else if (name === 'generate_tax_invoice') {
            functionResult = await generateAndStoreTaxInvoice(args.bookingId as string, args.totalAmount as number);
        } else {
            functionResult = `ข้อผิดพลาด: ไม่รู้จักฟังก์ชัน ${name}`;
        }
        
        const functionResponsePart: Part = {
            functionResponse: { name, response: { result: functionResult } }
        };

        setChatHistory(prev => [...prev, { role: 'user', text: JSON.stringify(functionResponsePart.functionResponse), isFunctionResponse: true }]);
        
        const currentApiHistory = convertChatHistoryToApiContent(chatHistory);
        const newHistory: Content[] = [...currentApiHistory, {role: 'model', parts: [{functionCall: fc}]}, {role: 'user', parts: [functionResponsePart]}];
        
        return await runAiChat(newHistory, context);
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading) return;

        const newUserMessage: AiChatMessage = { role: 'user', text: userInput };
        const newHistoryForApi = [...chatHistory, newUserMessage];
        setChatHistory(newHistoryForApi);
        setUserInput('');
        setIsLoading(true);

        const apiHistory = convertChatHistoryToApiContent(newHistoryForApi);

        let response = await runAiChat(apiHistory, context);
        
        response = await handleFunctionCalls(response);

        const modelResponseText = response.text;
        if(modelResponseText) {
            setChatHistory(prev => [...prev, { role: 'model', text: modelResponseText }]);
        }

        setIsLoading(false);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 bg-blue-600 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-3xl hover:bg-blue-700 transition-transform transform hover:scale-110 z-50"
                aria-label="Toggle AI Assistant"
            >
                ✨
            </button>
            {isOpen && (
                <div className="fixed bottom-24 right-6 w-full max-w-sm h-[60vh] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-gray-200">
                    <header className="flex items-center justify-between p-4 bg-gray-50 border-b">
                        <h3 className="text-lg font-semibold text-gray-800">VIPAT AI Assistant</h3>
                        <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-800">&times;</button>
                    </header>
                    <div ref={chatBodyRef} className="flex-1 p-3 space-y-3 overflow-y-auto">
                        {chatHistory.map((msg, index) => <ChatBubble key={index} message={msg} />)}
                         {isLoading && (
                            <div className="self-start bg-gray-200 text-gray-800 p-3 rounded-2xl">
                                <span className="animate-pulse">กำลังพิมพ์...</span>
                            </div>
                        )}
                    </div>
                    <form onSubmit={handleSubmit} className="p-3 border-t bg-white">
                        <div className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={userInput}
                                onChange={e => setUserInput(e.target.value)}
                                placeholder="สอบถามหรือสั่งการได้เลย..."
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={isLoading}
                            />
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 disabled:bg-blue-300" disabled={isLoading}>
                                ส่ง
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
};

export default AiAssistant;