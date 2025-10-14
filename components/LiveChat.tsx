import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from '@google/genai';
import { MicrophoneIcon } from './icons/Icons';

// --- Audio Helper Functions as per Gemini Documentation ---

// Encodes raw audio bytes into a Base64 string.
function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// Decodes a Base64 string into raw audio bytes.
function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

// Decodes raw PCM audio data into an AudioBuffer for playback.
async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
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

// Creates a Gemini API-compatible Blob from microphone audio data.
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


type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
type Transcription = { role: 'user' | 'model', text: string };

const LiveChat: React.FC = () => {
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const [transcriptionLog, setTranscriptionLog] = useState<Transcription[]>([]);
    const [currentInputTranscription, setCurrentInputTranscription] = useState('');
    const [currentOutputTranscription, setCurrentOutputTranscription] = useState('');

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Refs for current turn transcriptions to avoid stale closures in callbacks
    const currentInputRef = useRef('');
    const currentOutputRef = useRef('');

    // Audio context and nodes
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    // Playback queue management
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    const stopConversation = useCallback(async () => {
        setConnectionStatus('disconnected');
        
        if (sessionPromiseRef.current) {
            try {
                const session = await sessionPromiseRef.current;
                session.close();
            } catch (e) {
                console.error("Error closing session:", e);
            }
            sessionPromiseRef.current = null;
        }

        // Stop microphone stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // Disconnect and close audio contexts
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            await inputAudioContextRef.current.close();
            inputAudioContextRef.current = null;
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            sourcesRef.current.forEach(source => source.stop());
            sourcesRef.current.clear();
            await outputAudioContextRef.current.close();
            outputAudioContextRef.current = null;
        }

        // Clear transcription state
        currentInputRef.current = '';
        currentOutputRef.current = '';
        setCurrentInputTranscription('');
        setCurrentOutputTranscription('');
    }, []);

    const startConversation = useCallback(async () => {
        setConnectionStatus('connecting');
        setTranscriptionLog([]);
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            
            // Initialize audio contexts for the new session.
            // The `webkitAudioContext` is for Safari compatibility.
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            nextStartTimeRef.current = 0;

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setConnectionStatus('connected');
                        const inputCtx = inputAudioContextRef.current;
                        if (!inputCtx || !streamRef.current) return;

                        mediaStreamSourceRef.current = inputCtx.createMediaStreamSource(streamRef.current);
                        scriptProcessorRef.current = inputCtx.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };

                        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputCtx.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.outputTranscription) {
                            const text = message.serverContent.outputTranscription.text;
                            currentOutputRef.current += text;
                            setCurrentOutputTranscription(currentOutputRef.current);
                        }
                        if (message.serverContent?.inputTranscription) {
                             const text = message.serverContent.inputTranscription.text;
                             currentInputRef.current += text;
                             setCurrentInputTranscription(currentInputRef.current);
                        }

                        if (message.serverContent?.turnComplete) {
                            const fullInput = currentInputRef.current.trim();
                            const fullOutput = currentOutputRef.current.trim();
                            
                            setTranscriptionLog(prevLog => {
                                const newLog = [...prevLog];
                                if (fullInput) newLog.push({ role: 'user', text: fullInput });
                                if (fullOutput) newLog.push({ role: 'model', text: fullOutput });
                                return newLog;
                            });

                            // Reset for next turn
                            currentInputRef.current = '';
                            currentOutputRef.current = '';
                            setCurrentInputTranscription('');
                            setCurrentOutputTranscription('');
                        }

                        if (message.serverContent?.interrupted) {
                            sourcesRef.current.forEach(source => source.stop());
                            sourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
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
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        setConnectionStatus('error');
                        stopConversation();
                    },
                    onclose: (e: CloseEvent) => {
                        stopConversation();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    outputAudioTranscription: {},
                    inputAudioTranscription: {},
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                },
            });
            // Handle case where session promise rejects immediately
            sessionPromiseRef.current.catch(err => {
                console.error("Failed to connect live session:", err);
                setConnectionStatus('error');
                stopConversation(); // Clean up on connection failure
            });

        } catch (err) {
            console.error('Error starting conversation:', err);
            setConnectionStatus('error');
            stopConversation(); // Clean up on any startup error (e.g., permissions)
        }
    }, [stopConversation]);
    
    // Cleanup on component unmount
    useEffect(() => {
        return () => {
            stopConversation();
        };
    }, [stopConversation]);

    const getStatusDisplay = () => {
        switch (connectionStatus) {
            case 'disconnected': return { text: 'กดปุ่มเพื่อเริ่มการสนทนา', color: 'text-gray-500' };
            case 'connecting': return { text: 'กำลังเชื่อมต่อ...', color: 'text-blue-500 animate-pulse' };
            case 'connected': return { text: 'เชื่อมต่อแล้ว! เริ่มพูดได้เลย...', color: 'text-green-600' };
            case 'error': return { text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ', color: 'text-red-600' };
        }
    };
    
    const {text, color} = getStatusDisplay();

    return (
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg h-full flex flex-col">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-3">Live Chat Assistant</h2>
            <div className="flex-grow flex flex-col bg-gray-50 rounded-lg p-4 overflow-hidden">
                <div className="flex-grow overflow-y-auto space-y-3 pr-2">
                    {transcriptionLog.map((item, index) => (
                        <div key={index} className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-3 rounded-2xl max-w-sm ${item.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                {item.text}
                            </div>
                        </div>
                    ))}
                    {currentInputTranscription && (
                        <div className="flex justify-end"><div className="p-3 rounded-2xl max-w-sm bg-blue-200 text-blue-800 italic">{currentInputTranscription}</div></div>
                    )}
                    {currentOutputTranscription && (
                         <div className="flex justify-start"><div className="p-3 rounded-2xl max-w-sm bg-gray-100 text-gray-600 italic">{currentOutputTranscription}</div></div>
                    )}
                </div>
            </div>
            <div className="mt-4 pt-4 border-t text-center">
                 <p className={`font-medium mb-4 ${color}`}>{text}</p>
                 <div className="flex justify-center space-x-4">
                     <button
                        onClick={startConversation}
                        disabled={connectionStatus === 'connecting' || connectionStatus === 'connected'}
                        className="px-6 py-3 bg-green-600 text-white font-semibold rounded-full shadow-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center transition-transform transform hover:scale-105"
                    >
                         <MicrophoneIcon className="w-6 h-6 mr-2" />
                         เริ่มการสนทนา
                    </button>
                    <button
                        onClick={stopConversation}
                        disabled={connectionStatus === 'disconnected' || connectionStatus === 'error'}
                        className="px-6 py-3 bg-red-600 text-white font-semibold rounded-full shadow-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center transition-transform transform hover:scale-105"
                    >
                        หยุดการสนทนา
                    </button>
                 </div>
            </div>
        </div>
    );
};

export default LiveChat;