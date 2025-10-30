import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from '@google/genai';
import { MicrophoneIcon, PaperclipIcon, CloseIcon } from './icons/Icons';
import type { Room, Employee, AiChatMessage } from '../types';
import { sendAiMessage } from '../services/geminiService';

// --- Audio Helper Functions as per Gemini Documentation ---
function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

function createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
}
// --- End Audio Helper Functions ---

interface AiAssistantProps {
    addBooking: (guestName: string, phone: string, roomNumber: string, checkIn: string, checkOut: string, source: 'ai' | 'manual') => Promise<string>;
    rooms: Room[];
    addTask: (description: string, assignedTo: string, relatedTo: string, dueDate?: string) => Promise<string>;
    employees: Employee[];
    onClose?: () => void;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ addBooking, rooms, addTask, employees, onClose }) => {
    // --- State for Text/Image Chat ---
    const [history, setHistory] = useState<AiChatMessage[]>([
        { role: 'model', parts: [{ text: 'สวัสดีค่ะ มีอะไรให้ช่วยไหมคะ? สามารถสั่งจองห้องพัก, มอบหมายงาน, หรือพูดคุยได้เลยค่ะ' }] }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);

    // --- State for Live Voice Chat ---
    const [liveConnectionStatus, setLiveConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
    const [currentInputTranscription, setCurrentInputTranscription] = useState('');
    const [currentOutputTranscription, setCurrentOutputTranscription] = useState('');
    
    // --- Refs ---
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const currentInputRef = useRef(''); // For callbacks
    const currentOutputRef = useRef(''); // For callbacks


    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(scrollToBottom, [history, currentInputTranscription, currentOutputTranscription]);
    
    const handleRemoveImage = useCallback(() => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    const executeToolCall = useCallback(async (functionCall: { name: string, args: any }) => {
        let result: any = '';
        if (functionCall.name === 'addBooking') {
            const { guestName, phone, roomNumber, checkIn, checkOut } = functionCall.args;
            result = await addBooking(guestName, phone, roomNumber, checkIn, checkOut, 'ai');
        } else if (functionCall.name === 'getAvailableRooms') {
            const availableRooms = rooms.filter(r => r.status === 'ว่าง' || r.status === 'ทำความสะอาด').map(r => r.number).join(', ');
            result = `ห้องที่ว่างอยู่คือ: ${availableRooms || 'ไม่มี'}`;
        } else if (functionCall.name === 'addTask') {
            const { description, employeeName, roomNumber, dueDate } = functionCall.args;
            const employee = employees.find(e => e.name.includes(employeeName));
            const room = rooms.find(r => r.number === roomNumber);
            if (!employee || !room) {
                 result = `ข้อผิดพลาด: ไม่พบพนักงานชื่อ '${employeeName}' หรือห้องหมายเลข '${roomNumber}'`;
            } else {
                 result = await addTask(description, employee.id, room.id, dueDate);
            }
        } else {
            result = `ข้อผิดพลาด: ไม่รู้จัก tool '${functionCall.name}'`;
        }
        return { name: functionCall.name, response: { result }};
    }, [addBooking, rooms, addTask, employees]);

    // --- Text/Image Chat Logic ---
    const handleSend = async () => {
        if (!input.trim() && !imageFile) return;

        const userMessage: AiChatMessage = { role: 'user', parts: [{ text: input }], imagePreview };
        setHistory(prev => [...prev, userMessage]);
        
        const currentInput = input;
        const currentImageFile = imageFile;
        
        setInput('');
        handleRemoveImage();
        setIsLoading(true);

        try {
            const modelResponse = await sendAiMessage(history, currentInput, currentImageFile);
            setHistory(prev => [...prev, modelResponse]);

            const functionCallPart = modelResponse.parts.find((part): part is { functionCall: { name: string; args: any; }; } => 'functionCall' in part);
            if (functionCallPart) {
                const toolResult = await executeToolCall(functionCallPart.functionCall);
                const toolResponseMessage: AiChatMessage = {
                    role: 'system',
                    parts: [{ functionResponse: toolResult }]
                };
                setHistory(prev => [...prev, toolResponseMessage]);

                const finalResponse = await sendAiMessage([...history, modelResponse, toolResponseMessage], "", null);
                setHistory(prev => [...prev, finalResponse]);
            }

        } catch (error) {
            console.error("Error during AI interaction:", error);
            const errorMessage: AiChatMessage = { role: 'model', parts: [{ text: "เกิดข้อผิดพลาดบางอย่าง โปรดลองอีกครั้ง" }] };
            setHistory(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    // --- Live Voice Chat Logic ---
    const stopConversation = useCallback(async () => {
        setLiveConnectionStatus('disconnected');
        if (sessionPromiseRef.current) {
            try { (await sessionPromiseRef.current).close(); } catch (e) { console.error("Error closing session:", e); }
            sessionPromiseRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (scriptProcessorRef.current) scriptProcessorRef.current.disconnect();
        if (mediaStreamSourceRef.current) mediaStreamSourceRef.current.disconnect();
        if (inputAudioContextRef.current?.state !== 'closed') await inputAudioContextRef.current.close();
        if (outputAudioContextRef.current?.state !== 'closed') {
            sourcesRef.current.forEach(source => source.stop());
            sourcesRef.current.clear();
            await outputAudioContextRef.current.close();
        }
        currentInputRef.current = ''; currentOutputRef.current = '';
        setCurrentInputTranscription(''); setCurrentOutputTranscription('');
    }, []);

    const startConversation = useCallback(async () => {
        if (!process.env.API_KEY) {
            setLiveConnectionStatus('error');
            return;
        }
        setLiveConnectionStatus('connecting');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            nextStartTimeRef.current = 0;

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setLiveConnectionStatus('connected');
                        const inputCtx = inputAudioContextRef.current;
                        if (!inputCtx || !streamRef.current) return;
                        mediaStreamSourceRef.current = inputCtx.createMediaStreamSource(streamRef.current);
                        scriptProcessorRef.current = inputCtx.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current.onaudioprocess = (e) => {
                            const pcmBlob = createBlob(e.inputBuffer.getChannelData(0));
                            sessionPromiseRef.current?.then((s) => s.sendRealtimeInput({ media: pcmBlob }));
                        };
                        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputCtx.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.outputTranscription) {
                            currentOutputRef.current += message.serverContent.outputTranscription.text;
                            setCurrentOutputTranscription(currentOutputRef.current);
                        }
                        if (message.serverContent?.inputTranscription) {
                             currentInputRef.current += message.serverContent.inputTranscription.text;
                             setCurrentInputTranscription(currentInputRef.current);
                        }
                        if (message.serverContent?.turnComplete) {
                            const fullInput = currentInputRef.current.trim();
                            const fullOutput = currentOutputRef.current.trim();
                            setHistory(prev => {
                                const newLog = [...prev];
                                if (fullInput) newLog.push({ role: 'user', parts: [{ text: fullInput }] });
                                if (fullOutput) newLog.push({ role: 'model', parts: [{ text: fullOutput }] });
                                return newLog;
                            });
                            currentInputRef.current = ''; currentOutputRef.current = '';
                            setCurrentInputTranscription(''); setCurrentOutputTranscription('');
                        }
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                        const outputCtx = outputAudioContextRef.current;
                        if (base64Audio && outputCtx) {
                             nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                             const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                             const source = outputCtx.createBufferSource();
                             source.buffer = audioBuffer;
                             source.connect(outputCtx.destination);
                             source.addEventListener('ended', () => sourcesRef.current.delete(source));
                             source.start(nextStartTimeRef.current);
                             nextStartTimeRef.current += audioBuffer.duration;
                             sourcesRef.current.add(source);
                        }
                    },
                    onerror: (e) => { console.error('Live error:', e); setLiveConnectionStatus('error'); stopConversation(); },
                    onclose: () => stopConversation(),
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    outputAudioTranscription: {},
                    inputAudioTranscription: {},
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                },
            });
            sessionPromiseRef.current.catch(err => {
                console.error("Failed to connect:", err);
                setLiveConnectionStatus('error');
                stopConversation();
            });
        } catch (err) {
            console.error('Error starting voice chat:', err);
            setLiveConnectionStatus('error');
            stopConversation();
        }
    }, [stopConversation]);

    useEffect(() => () => stopConversation(), [stopConversation]);

    const handleMicClick = () => {
        if (liveConnectionStatus === 'connected' || liveConnectionStatus === 'connecting') {
            stopConversation();
        } else {
            startConversation();
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };
    
    const getLiveStatusDisplay = () => {
        switch (liveConnectionStatus) {
            case 'connecting': return 'กำลังเชื่อมต่อเสียง...';
            case 'connected': return 'กำลังฟัง...';
            case 'error': return 'เกิดข้อผิดพลาดในการเชื่อมต่อเสียง';
            default: return null;
        }
    };

    const isVoiceActive = liveConnectionStatus === 'connected' || liveConnectionStatus === 'connecting';

    return (
        <div className="bg-white p-4 rounded-2xl shadow-lg h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
                <h2 className="text-xl font-bold text-gray-800">AI Assistant</h2>
                {onClose && <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-1 rounded-full"><CloseIcon className="w-6 h-6" /></button>}
            </div>
            <div className="flex-grow flex flex-col bg-gray-50 rounded-lg p-3 overflow-hidden">
                <div className="flex-grow overflow-y-auto space-y-4 pr-2">
                    {history.map((msg, index) => {
                       const textPart = msg.parts.find(p => 'text' in p)?.text;
                       if (msg.role === 'system') return null; // Simplified view, no tool result logging
                       if (!textPart && !msg.imagePreview) return null;
                       return (
                           <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                               <div className={`p-3 rounded-2xl max-w-sm text-sm ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                   {msg.imagePreview && <img src={msg.imagePreview} alt="attachment" className="rounded-lg mb-2 max-h-40"/>}
                                   {textPart}
                               </div>
                           </div>
                       );
                    })}
                    {isLoading && <div className="flex justify-start"><div className="p-3 rounded-2xl max-w-sm bg-gray-200 text-gray-800">กำลังคิด...</div></div>}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <div className="mt-4 pt-4 border-t">
                 {(isVoiceActive || currentInputTranscription || currentOutputTranscription) && (
                    <div className="p-2 mb-2 bg-gray-100 rounded-lg text-sm text-center">
                        <p className="font-semibold">{getLiveStatusDisplay()}</p>
                        {currentInputTranscription && <p className="text-blue-700 italic">คุณ: {currentInputTranscription}</p>}
                        {currentOutputTranscription && <p className="text-gray-600 italic">AI: {currentOutputTranscription}</p>}
                    </div>
                )}
                {imagePreview && (
                    <div className="relative self-start mb-2 ml-2">
                        <img src={imagePreview} alt="Preview" className="h-20 w-20 rounded-lg object-cover" />
                        <button onClick={handleRemoveImage} className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1"><CloseIcon className="w-4 h-4" /></button>
                    </div>
                )}
                <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-full p-1 pl-4">
                     <input
                        type="text" value={input} onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={isVoiceActive ? "กำลังใช้เสียง..." : "พิมพ์คำสั่งของคุณ..."}
                        className="flex-grow bg-transparent focus:outline-none text-sm"
                        disabled={isLoading || isVoiceActive}
                    />
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg, image/webp" />
                    <button onClick={() => fileInputRef.current?.click()} disabled={isVoiceActive} className="p-2 text-gray-500 hover:text-blue-600 disabled:text-gray-300"><PaperclipIcon className="w-5 h-5" /></button>
                    <button onClick={handleMicClick} className={`p-2 rounded-full transition-colors ${liveConnectionStatus === 'connected' ? 'bg-red-500 text-white' : 'text-gray-500 hover:text-blue-600'}`}>
                        <MicrophoneIcon className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={handleSend} disabled={isLoading || isVoiceActive || (!input.trim() && !imageFile)}
                        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-400"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M3.105 3.105a1.5 1.5 0 012.122 0l7.667 7.667-2.122 2.122-7.667-7.667a1.5 1.5 0 010-2.122zM3.105 16.895a1.5 1.5 0 010-2.122l7.667-7.667 2.122 2.122-7.667 7.667a1.5 1.5 0 01-2.122 0z"></path></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AiAssistant;
