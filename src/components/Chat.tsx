// import React, { useState, useEffect, useRef } from 'react';
// import { db, auth } from '../firebase';
// import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';
// import { MessageSquare, Send, User } from 'lucide-react';
// import { Message } from '../types/messages';
import Intercom from '@intercom/messenger-js-sdk';

export function Chat() {
    Intercom({
        app_id: 'b202qhmz',
    });

    return <div>Example App</div>;
}

// export function Chat() {
//     const [messages, setMessages] = useState<Message[]>([]);
//     const [newMessage, setNewMessage] = useState('');
//     const [isOpen, setIsOpen] = useState(false);
//     const messagesEndRef = useRef<HTMLDivElement>(null);
//     const [isTyping, setIsTyping] = useState(false);
//
//     const scrollToBottom = () => {
//         messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//     };
//
//     useEffect(() => {
//         if (!isOpen) return;
//
//         const user = auth.currentUser;
//         if (!user) return;
//
//         const q = query(
//             collection(db, `users/${user.uid}/chat`),
//             orderBy('timestamp', 'asc'),
//             limit(50)
//         );
//
//         const unsubscribe = onSnapshot(q, (snapshot) => {
//             const newMessages = snapshot.docs.map(doc => ({
//                 id: doc.id,
//                 ...doc.data(),
//                 timestamp: doc.data().timestamp?.toDate(),
//             })) as Message[];
//             setMessages(newMessages);
//             scrollToBottom();
//         });
//
//         return () => unsubscribe();
//     }, [isOpen]);
//
//     useEffect(() => {
//         scrollToBottom();
//     }, [messages]);
//
//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         if (!newMessage.trim()) return;
//
//         const user = auth.currentUser;
//         if (!user) return;
//
//         try {
//             setIsTyping(true);
//             await addDoc(collection(db, `users/${user.uid}/chat`), {
//                 text: newMessage,
//                 sender: user.email,
//                 timestamp: serverTimestamp(),
//                 isAccountant: false,
//             });
//
//             // Simulate accountant response
//             setTimeout(async () => {
//                 await addDoc(collection(db, `users/${user.uid}/chat`), {
//                     text: "Thank you for your message. An accountant will respond shortly during business hours (9 AM - 5 PM EST).",
//                     sender: 'Accountant',
//                     timestamp: serverTimestamp(),
//                     isAccountant: true,
//                 });
//                 setIsTyping(false);
//             }, 1000);
//
//             setNewMessage('');
//         } catch (error) {
//             console.error('Error sending message:', error);
//         }
//     };
//
//     return (
//         <div className="fixed bottom-4 right-4 z-50">
//             {!isOpen && (
//                 <button
//                     onClick={() => setIsOpen(true)}
//                     className="bg-indigo-600 text-white rounded-full p-4 shadow-lg hover:bg-indigo-700 transition-colors"
//                 >
//                     <MessageSquare className="w-6 h-6" />
//                 </button>
//             )}
//
//             {isOpen && (
//                 <div className="bg-white rounded-lg shadow-xl w-96 flex flex-col h-[500px]">
//                     <div className="p-4 bg-indigo-600 text-white rounded-t-lg">
//                         <div className="flex items-center justify-between">
//                             <div className="flex items-center space-x-3">
//                                 <img
//                                     src="https://i.imgur.com/K1tpbtq.jpg"
//                                     alt="Professional Accountant"
//                                     className="w-10 h-10 rounded-full object-cover border-2 border-white"
//                                 />
//                                 <div>
//                                     <h3 className="font-semibold">Yaokun Shen</h3>
//                                     <p className="text-xs text-indigo-100">Tax Professional</p>
//                                 </div>
//                             </div>
//                             <button
//                                 onClick={() => setIsOpen(false)}
//                                 className="text-white hover:text-gray-200 text-xl"
//                             >
//                                 ×
//                             </button>
//                         </div>
//                         <div className="mt-2 text-xs text-indigo-100 flex items-center">
//                             <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
//                             Online - Usually responds in 10 minutes
//                         </div>
//                     </div>
//
//                     <div className="flex-1 overflow-y-auto p-4 space-y-4">
//                         {messages.map((message) => (
//                             <div
//                                 key={message.id}
//                                 className={`flex ${
//                                     message.isAccountant ? 'justify-start' : 'justify-end'
//                                 }`}
//                             >
//                                 {message.isAccountant && (
//                                     <img
//                                         src="https://i.imgur.com/K1tpbtq.jpg"
//                                         alt="YK"
//                                         className="w-8 h-8 rounded-full mr-2 self-end"
//                                     />
//                                 )}
//                                 <div
//                                     className={`max-w-[80%] rounded-lg p-3 ${
//                                         message.isAccountant
//                                             ? 'bg-gray-100 text-gray-800'
//                                             : 'bg-indigo-600 text-white'
//                                     }`}
//                                 >
//                                     <p className="text-sm">{message.text}</p>
//                                     <p className="text-xs mt-1 opacity-75">
//                                         {message.timestamp?.toLocaleTimeString()}
//                                     </p>
//                                 </div>
//                             </div>
//                         ))}
//                         {isTyping && (
//                             <div className="flex justify-start">
//                                 <img
//                                     src="https://i.imgur.com/K1tpbtq.jpg"
//                                     alt="YK"
//                                     className="w-8 h-8 rounded-full mr-2 self-end"
//                                 />
//                                 <div className="bg-gray-100 rounded-lg p-3">
//                                     <div className="flex space-x-2">
//                                         <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
//                                         <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
//                                         <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
//                                     </div>
//                                 </div>
//                             </div>
//                         )}
//                         <div ref={messagesEndRef} />
//                     </div>
//
//                     <form onSubmit={handleSubmit} className="p-4 border-t">
//                         <div className="flex space-x-2">
//                             <input
//                                 type="text"
//                                 value={newMessage}
//                                 onChange={(e) => setNewMessage(e.target.value)}
//                                 placeholder="Type your message..."
//                                 className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                             />
//                             <button
//                                 type="submit"
//                                 className="bg-indigo-600 text-white rounded-lg px-4 py-2 hover:bg-indigo-700 transition-colors"
//                             >
//                                 <Send className="w-4 h-4" />
//                             </button>
//                         </div>
//                     </form>
//                 </div>
//             )}
//         </div>
//     );
// }