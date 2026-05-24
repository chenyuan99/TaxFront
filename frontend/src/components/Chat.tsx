import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, geminiModel } from '../firebase';

interface Message {
    role: 'user' | 'model';
    text: string;
}

const SYSTEM_CONTEXT =
    'You are a helpful tax assistant for TaxFront, a tax document management platform. ' +
    'Answer questions about US taxes, tax documents (W-2, 1099, 1040, etc.), deductions, ' +
    'filing deadlines, and general tax guidance. Keep answers concise and practical. ' +
    'Always recommend consulting a licensed tax professional for specific advice.';

export function Chat() {
    const [isOpen, setIsOpen] = useState(false);
    const [user] = useAuthState(auth);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const chatSessionRef = useRef<ReturnType<typeof geminiModel.startChat> | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (isOpen && !chatSessionRef.current) {
            chatSessionRef.current = geminiModel.startChat({
                history: [],
                systemInstruction: { parts: [{ text: SYSTEM_CONTEXT }] },
            });
        }
    }, [isOpen]);

    const sendMessage = async () => {
        const text = input.trim();
        if (!text || loading || !chatSessionRef.current) return;

        setInput('');
        setMessages(prev => [...prev, { role: 'user', text }]);
        setLoading(true);

        try {
            const result = await chatSessionRef.current.sendMessageStream(text);
            let modelText = '';
            setMessages(prev => [...prev, { role: 'model', text: '' }]);

            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                modelText += chunkText;
                setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: 'model', text: modelText };
                    return updated;
                });
            }
        } catch {
            setMessages(prev => [...prev, {
                role: 'model',
                text: 'Sorry, I encountered an error. Please try again.',
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleToggle = () => {
        setIsOpen(prev => !prev);
    };

    return (
        <>
            <button
                onClick={handleToggle}
                className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 z-50 ${
                    isOpen ? 'bg-dark rotate-90' : 'bg-primary hover:bg-dark'
                }`}
                aria-label="Chat with us"
            >
                {isOpen ? (
                    <X className="h-6 w-6 text-white" />
                ) : (
                    <MessageSquare className="h-6 w-6 text-white" />
                )}
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-6 w-96 bg-white rounded-lg shadow-xl flex flex-col z-50 border border-gray-100" style={{ height: '520px' }}>
                    <div className="p-4 bg-dark text-white rounded-t-lg flex-shrink-0">
                        <h3 className="text-lg font-light">Tax Assistant</h3>
                        <p className="text-xs mt-1 text-secondary font-light">
                            Powered by Gemini · Not a substitute for professional advice
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                        {messages.length === 0 && (
                            <div className="text-center text-gray-400 text-sm mt-8">
                                {user
                                    ? 'Ask me anything about taxes, documents, or deductions.'
                                    : 'Please sign in to use the tax assistant.'}
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                                        msg.role === 'user'
                                            ? 'bg-primary text-white rounded-br-none'
                                            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none shadow-sm'
                                    }`}
                                >
                                    {msg.text}
                                    {msg.role === 'model' && loading && i === messages.length - 1 && msg.text === '' && (
                                        <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1" />
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {user ? (
                        <div className="p-3 bg-white border-t border-gray-100 flex-shrink-0">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask a tax question…"
                                    disabled={loading}
                                    className="flex-1 p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={loading || !input.trim()}
                                    className="p-2 bg-primary text-white rounded-lg hover:bg-dark transition-colors disabled:opacity-50"
                                    aria-label="Send"
                                >
                                    {loading
                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : <Send className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 px-1">Enter to send</p>
                        </div>
                    ) : (
                        <div className="p-4 bg-white border-t border-gray-100 flex-shrink-0 text-center">
                            <p className="text-sm text-gray-500">Sign in to use the assistant</p>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
