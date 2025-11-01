import { GoogleGenAI, FunctionDeclaration, GenerateContentRequest, Type } from '@google/genai';
import type { Room, Employee, AiChatMessage } from '../types';

let ai: GoogleGenAI | null = null;

const getAi = () => {
    if (!ai) {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set");
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
};

// --- Function Declarations for AI Tools ---
const addBookingDeclaration: FunctionDeclaration = {
    name: "addBooking",
    description: "สร้างการจองห้องพักใหม่สำหรับแขก",
    parameters: {
        type: Type.OBJECT,
        properties: {
            guestName: { type: Type.STRING, description: "ชื่อเต็มของแขก" },
            phone: { type: Type.STRING, description: "เบอร์โทรศัพท์ของแขก" },
            roomNumber: { type: Type.STRING, description: "หมายเลขห้องที่ต้องการจอง" },
            checkIn: { type: Type.STRING, description: "วันที่เช็คอินในรูปแบบ YYYY-MM-DD" },
            checkOut: { type: Type.STRING, description: "วันที่เช็คเอาท์ในรูปแบบ YYYY-MM-DD" },
        },
        required: ["guestName", "phone", "roomNumber", "checkIn", "checkOut"],
    }
};

const getAvailableRoomsDeclaration: FunctionDeclaration = {
    name: "getAvailableRooms",
    description: "ดึงข้อมูลห้องพักที่ว่างอยู่ในปัจจุบันทั้งหมด",
    parameters: {
        type: Type.OBJECT,
        properties: {},
        required: [],
    }
};

const addTaskDeclaration: FunctionDeclaration = {
    name: "addTask",
    description: "สร้างและมอบหมายงานใหม่ให้กับพนักงาน",
    parameters: {
        type: Type.OBJECT,
        properties: {
            description: { type: Type.STRING, description: "รายละเอียดของงานที่ต้องทำ" },
            employeeName: { type: Type.STRING, description: "ชื่อของพนักงานที่รับผิดชอบงาน" },
            roomNumber: { type: Type.STRING, description: "หมายเลขห้องที่เกี่ยวข้องกับงาน" },
            dueDate: { type: Type.STRING, description: "วันครบกำหนดส่งงานในรูปแบบ YYYY-MM-DD (ถ้ามี)" },
        },
        required: ["description", "employeeName", "roomNumber"],
    }
}

const tools = [{ functionDeclarations: [addBookingDeclaration, getAvailableRoomsDeclaration, addTaskDeclaration] }];

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const sendAiMessage = async (
    history: AiChatMessage[],
    newMessage: string,
    imageFile: File | null
): Promise<AiChatMessage> => {
    const genAI = getAi();

    const userParts: any[] = [{ text: newMessage }];

    if (imageFile) {
        const base64Data = await blobToBase64(imageFile);
        userParts.unshift({
            inlineData: {
                mimeType: imageFile.type,
                data: base64Data
            }
        });
    }

    const contents: any[] = [...history.map(msg => ({...msg, parts: msg.parts.map(p => {
        // Remove non-serializable imagePreview
        const { imagePreview, ...rest } = msg as any;
        return p;
    }) })), { role: "user", parts: userParts }];

    const request: GenerateContentRequest = {
        model: 'gemini-2.5-flash',
        contents,
        config: {
            tools: tools
        },
    };

    try {
        const response = await genAI.models.generateContent(request);
        const modelResponse = response.candidates?.[0]?.content;
        
        if (!modelResponse) {
             return { role: 'model', parts: [{ text: "ขออภัยค่ะ ไม่สามารถประมวลผลคำขอได้ในขณะนี้" }] };
        }
        
        return {
            role: 'model',
            parts: modelResponse.parts.map(part => {
                if (part.text) {
                    return { text: part.text };
                }
                if (part.functionCall) {
                    return { functionCall: { name: part.functionCall.name, args: part.functionCall.args }};
                }
                return { text: "" }; // Should not happen
            })
        };
    } catch (e: any) {
        console.error("Gemini API Error:", e);
        return { role: 'model', parts: [{ text: `เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI: ${e.message}` }] };
    }
};
