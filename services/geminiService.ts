import { GoogleGenAI, FunctionDeclaration, Type, GenerateContentParameters, Content, GenerateContentResponse, FinishReason } from "@google/genai";
import type { Room, Booking, Guest } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
const model = "gemini-2.5-flash";

const getRoomAvailabilityFunctionDeclaration: FunctionDeclaration = {
    name: 'get_room_availability',
    parameters: {
        type: Type.OBJECT,
        description: 'Get availability of rooms for a given date range.',
        properties: {
            checkInDate: {
                type: Type.STRING,
                description: 'Start date for booking in YYYY-MM-DD format.',
            },
            checkOutDate: {
                type: Type.STRING,
                description: 'End date for booking in YYYY-MM-DD format.',
            },
            roomType: {
                 type: Type.STRING,
                 description: 'Type of room to check for (e.g., Single, Double, Suite). Optional.',
            }
        },
        required: ['checkInDate', 'checkOutDate'],
    },
};

const createBookingFunctionDeclaration: FunctionDeclaration = {
    name: 'create_booking',
    parameters: {
        type: Type.OBJECT,
        description: 'Create a new booking for a guest in a specific room for a given date range.',
        properties: {
            guestName: {
                type: Type.STRING,
                description: 'Full name of the guest.',
            },
            phoneNumber: {
                type: Type.STRING,
                description: 'Phone number of the guest. Optional.',
            },
            roomNumber: {
                type: Type.STRING,
                description: 'The room number to book.',
            },
            checkInDate: {
                type: Type.STRING,
                description: 'Check-in date in YYYY-MM-DD format.',
            },
            checkOutDate: {
                type: Type.STRING,
                description: 'Check-out date in YYYY-MM-DD format.',
            }
        },
        required: ['guestName', 'roomNumber', 'checkInDate', 'checkOutDate'],
    },
};

const generateDocumentFunctionDeclaration: FunctionDeclaration = {
    name: 'generate_document',
    parameters: {
        type: Type.OBJECT,
        description: 'Generate a document such as an invoice, booking confirmation, employee contract, guest welcome letter, lost and found notice, or maintenance request.',
        properties: {
            documentType: {
                type: Type.STRING,
                description: 'The type of document. Supported values: "Invoice", "Booking Confirmation", "Employee Contract", "Guest Welcome Letter", "Lost and Found Notice", "Maintenance Request".',
            },
            referenceId: {
                type: Type.STRING,
                description: 'The primary ID for the document. Booking ID for confirmations/welcome letters, Room ID for maintenance, Tenant ID for invoices, Employee ID for contracts. For Lost and Found, use the item name.',
            },
            details: {
                type: Type.STRING,
                description: 'Optional additional details for the document, such as the specific maintenance issue or the location where an item was found.',
            }
        },
        required: ['documentType', 'referenceId'],
    },
};

const generateReceiptFunctionDeclaration: FunctionDeclaration = {
    name: 'generate_receipt',
    parameters: {
        type: Type.OBJECT,
        description: 'Generates a simple, non-tax receipt for a guest booking payment.',
        properties: {
            bookingId: {
                type: Type.STRING,
                description: 'The Booking ID for which to generate the receipt.',
            },
            totalAmount: {
                type: Type.NUMBER,
                description: 'The total amount paid.',
            },
        },
        required: ['bookingId', 'totalAmount'],
    },
};

const generateTaxInvoiceFunctionDeclaration: FunctionDeclaration = {
    name: 'generate_tax_invoice',
    parameters: {
        type: Type.OBJECT,
        description: 'Generates an official document that serves as both a receipt and a tax invoice for a guest booking. This is the standard document for all payments.',
        properties: {
            bookingId: {
                type: Type.STRING,
                description: 'The Booking ID for which to generate the tax invoice.',
            },
            totalAmount: {
                type: Type.NUMBER,
                description: 'The total amount paid, inclusive of VAT.',
            },
        },
        required: ['bookingId', 'totalAmount'],
    },
};


const generateContextPrompt = (context: { rooms: Room[], bookings: Booking[], guests: Guest[] }): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const roomStatusCounts = context.rooms.reduce((acc, room) => {
        acc[room.status] = (acc[room.status] || 0) + 1;
        return acc;
    }, {} as Record<Room['status'], number>);

    const todaysCheckIns = context.bookings.filter(b => {
        const checkIn = new Date(b.checkInDate);
        checkIn.setHours(0, 0, 0, 0);
        return checkIn.getTime() === today.getTime() && (b.status === 'Confirmed' || b.status === 'Check-In');
    }).map(b => {
        const room = context.rooms.find(r => r.id === b.roomId);
        const guest = context.guests.find(g => g.id === b.guestId);
        return `${guest?.name || 'N/A'} (ห้อง ${room?.number || 'N/A'})`;
    });

    const todaysCheckOuts = context.bookings.filter(b => {
        const checkOut = new Date(b.checkOutDate);
        checkOut.setHours(0, 0, 0, 0);
        return checkOut.getTime() === today.getTime() && (b.status === 'Check-In' || b.status === 'Check-Out');
    }).map(b => {
        const room = context.rooms.find(r => r.id === b.roomId);
        const guest = context.guests.find(g => g.id === b.guestId);
        return `${guest?.name || 'N/A'} (ห้อง ${room?.number || 'N/A'})`;
    });

    const roomSummary = context.rooms.map(r => `Room ${r.number} (${r.type}, Price: ${r.price}, Status: ${r.status})`).join('\n');

    return `
You are an AI assistant for a hotel management system called VIPAT HMS.
Your role is to help the hotel manager with daily tasks.
You can check room availability, create bookings, and generate documents.
Always be polite and helpful. Use Thai language for responses unless the user uses English.
Today's date is ${today.toISOString().split('T')[0]}.

--- REAL-TIME HOTEL STATUS ---
Room Summary:
- Available: ${roomStatusCounts['Available'] || 0}
- Occupied: ${roomStatusCounts['Occupied'] || 0}
- Cleaning: ${roomStatusCounts['Cleaning'] || 0}
- Monthly Rental: ${roomStatusCounts['Monthly Rental'] || 0}

Today's Check-ins (${todaysCheckIns.length}): ${todaysCheckIns.length > 0 ? todaysCheckIns.join(', ') : 'None'}
Today's Check-outs (${todaysCheckOuts.length}): ${todaysCheckOuts.length > 0 ? todaysCheckOuts.join(', ') : 'None'}
---

Detailed Room List for reference:
${roomSummary}
`.trim();
};

export const runAiChat = async (history: Content[], context: { rooms: Room[], bookings: Booking[], guests: Guest[] }): Promise<GenerateContentResponse> => {
    const systemInstruction = generateContextPrompt(context);

    const request: GenerateContentParameters = {
        model: model,
        contents: history,
        config: {
            systemInstruction: systemInstruction,
            tools: [{
                functionDeclarations: [
                    getRoomAvailabilityFunctionDeclaration, 
                    createBookingFunctionDeclaration, 
                    generateDocumentFunctionDeclaration,
                    generateReceiptFunctionDeclaration,
                    generateTaxInvoiceFunctionDeclaration
                ]
            }],
        },
    };

    try {
        const result = await ai.models.generateContent(request);
        return result;
    } catch (e) {
        console.error("Error calling Gemini API:", e);
        const errorText = "ขออภัยค่ะ เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI Assistant กรุณาลองใหม่อีกครั้ง";
        const mockCandidates = [{
            content: {
                role: 'model',
                parts: [{ text: errorText }]
            },
            finishReason: FinishReason.OTHER,
            index: 0,
            safetyRatings: [],
        }];

        return {
            text: errorText,
            candidates: mockCandidates,
            functionCalls: [],
            executableCode: undefined,
            codeExecutionResult: undefined,
            data: '{}',
        };
    }
};

export const generateDocumentContent = async (prompt: string): Promise<string> => {
    try {
        const result = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 0 }
            }
        });
        return result.text ?? "Error: AI returned an empty response.";
    } catch (e) {
        console.error("Error generating document content:", e);
        return "Error: Could not generate document content.";
    }
};
