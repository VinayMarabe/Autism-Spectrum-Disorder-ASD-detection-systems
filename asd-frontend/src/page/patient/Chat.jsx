import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, Phone, Video, MoreVertical, ChevronLeft, CheckCheck, File } from "lucide-react";
import { useActivePatient } from "../../context/ActivePatientContext";
import { getHumanMessages, sendHumanMessage } from "../../utils/chatApi";

const doctors = [
  { id: 1, name: "Dr. Emily Johnson", title: "Pediatric Neurologist", img: "https://api.dicebear.com/7.x/notionists/svg?seed=Emily&backgroundColor=dbeafe", online: true },
  { id: 2, name: "Dr. Michael Chen", title: "Developmental Specialist", img: "https://api.dicebear.com/7.x/notionists/svg?seed=Michael&backgroundColor=dcfce7", online: false },
  { id: 3, name: "Dr. Sofia Rostova", title: "Child Psychiatrist", img: "https://api.dicebear.com/7.x/notionists/svg?seed=Sofia&backgroundColor=fce7f3", online: true },
];

const initialMessages = [
  { id: 1, from: "doctor", text: "Hello! I've reviewed your recent MRI results. They look stable overall.", time: "10:05 AM", read: true },
  { id: 2, from: "patient", text: "Thank you, Doctor! I was a bit worried. What did the AI analysis show?", time: "10:07 AM", read: true },
  { id: 3, from: "doctor", text: "The AI flagged mild connectivity variations in the prefrontal cortex. Nothing alarming, but we should continue monitoring.", time: "10:09 AM", read: true },
];

export default function Chat() {
  const { activePatient } = useActivePatient();
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    if (!activePatient) return;
    try {
      const data = await getHumanMessages(activePatient.id);
      
      // format for ui (which expects { id, from, text, time, read, file })
      const formatted = data.map(m => ({
        id: m.id,
        from: m.sender_role, 
        text: m.content,
        time: new Date(m.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        read: true,
      }));
      setMessages(formatted);
    } catch(err) {
      console.error(err);
    }
  }, [activePatient]);

  useEffect(() => {
    fetchMessages();
    const iv = setInterval(fetchMessages, 2000);
    return () => clearInterval(iv);
  }, [fetchMessages]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !activePatient || !selectedDoctor) return;
    const txt = input.trim();
    setInput("");
    
    // Optimistic UI update
    setMessages(prev => [...prev, { 
      id: Date.now(), from: "patient", text: txt, 
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), 
      read: false 
    }]);

    try {
      await sendHumanMessage(activePatient.id, {
        sender_role: "patient",
        recipient_id: selectedDoctor.name, // or ID
        content: txt
      });
      fetchMessages();
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-[calc(100vh-65px)] md:h-[calc(100vh-57px)] bg-gray-50 dark:bg-gray-950">
      {/* Sidebar: Doctor List */}
      <div className={`${selectedDoctor ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 xl:w-80 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 shrink-0`}>
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-headline font-bold text-gray-900 dark:text-white text-lg">Messages</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Chat with your care team</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {doctors.map(doc => (
            <button
              key={doc.id}
              onClick={() => setSelectedDoctor(doc)}
              className={`w-full text-left flex items-center gap-3 px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-50 dark:border-gray-800/50 ${selectedDoctor?.id === doc.id ? 'bg-blue-50 dark:bg-blue-950/30' : ''}`}
            >
              <div className="relative shrink-0">
                <img src={doc.img} alt={doc.name} className="w-12 h-12 rounded-xl border-2 border-gray-100 dark:border-gray-700" />
                {doc.online && <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{doc.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{doc.title}</p>
                <p className={`text-xs font-medium mt-0.5 ${doc.online ? 'text-emerald-500' : 'text-gray-400'}`}>{doc.online ? "Online" : "Offline"}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      {selectedDoctor ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat Header */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
            <button onClick={() => setSelectedDoctor(null)} className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
              <ChevronLeft size={20} />
            </button>
            <div className="relative shrink-0">
              <img src={selectedDoctor.img} alt={selectedDoctor.name} className="w-10 h-10 rounded-xl border-2 border-gray-100 dark:border-gray-700" />
              {selectedDoctor.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white dark:border-gray-900" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{selectedDoctor.name}</p>
              <p className={`text-xs ${selectedDoctor.online ? 'text-emerald-500' : 'text-gray-400'}`}>{selectedDoctor.online ? "Online — Active now" : "Offline"}</p>
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <button className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><Phone size={18} /></button>
              <button className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><Video size={18} /></button>
              <button className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><MoreVertical size={18} /></button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.from === 'patient' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%]`}>
                  {msg.file ? (
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${msg.from === 'patient' ? 'bg-blue-600 text-white rounded-br-md' : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-bl-md'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${msg.from === 'patient' ? 'bg-white/20' : 'bg-red-50 dark:bg-red-950/40'}`}>
                        <File size={20} className={msg.from === 'patient' ? 'text-white' : 'text-red-500'} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{msg.file.name}</p>
                        <p className={`text-xs ${msg.from === 'patient' ? 'text-blue-200' : 'text-gray-400'}`}>{msg.file.size}</p>
                      </div>
                    </div>
                  ) : (
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.from === 'patient' ? 'bg-blue-600 text-white rounded-br-md shadow-md shadow-blue-500/20' : 'bg-white dark:bg-gray-900 text-gray-800 dark:text-white border border-gray-100 dark:border-gray-700 rounded-bl-md shadow-sm'}`}>
                      {msg.text}
                    </div>
                  )}
                  <div className={`flex items-center gap-1 mt-1.5 text-[10px] text-gray-400 ${msg.from === 'patient' ? 'justify-end' : ''}`}>
                    <span>{msg.time}</span>
                    {msg.from === 'patient' && <CheckCheck size={12} className={msg.read ? 'text-blue-500' : ''} />}
                  </div>
                </div>
              </motion.div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-3">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-2xl px-2 py-1.5">
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"><Paperclip size={18} /></button>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-transparent text-sm outline-none text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className="w-9 h-9 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-xl flex items-center justify-center text-white transition active:scale-90"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 hidden md:flex items-center justify-center bg-gray-50 dark:bg-gray-950">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-950/30 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Send size={32} className="text-blue-600" />
            </div>
            <p className="font-semibold text-gray-700 dark:text-gray-300">Select a doctor to start chatting</p>
            <p className="text-sm text-gray-400 mt-1">Choose from your care team on the left</p>
          </div>
        </div>
      )}
    </div>
  );
}
