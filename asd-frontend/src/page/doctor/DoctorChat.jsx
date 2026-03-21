import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, Phone, Video, MoreVertical, ChevronLeft, CheckCheck, File, Search, Circle } from "lucide-react";
import { getPatients } from "../../utils/storage";
import { getAppointments } from "../../utils/appointmentStorage";
import { getHumanMessages, sendHumanMessage } from "../../utils/chatApi";

export default function DoctorChat() {
  const [patientsList, setPatientsList] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const bottomRef = useRef(null);

  // Load patients that have an appointment or are in storage
  useEffect(() => {
    async function load() {
      const fromSt = getPatients() || [];
      const appts = await getAppointments("doctor", "admin") || [];
      const apptPatients = appts.map(a => ({
        id: a.patient_id, name: a.patient_id, age: a.patientAge || "",
        lastMsg: "Connected via Appointment", time: "Recently", unread: 0,
        online: false, img: `https://api.dicebear.com/7.x/notionists/svg?seed=${a.patient_id}&backgroundColor=dbeafe`
      }));
      
      const byId = new Map();
      fromSt.forEach(p => byId.set(p.id, { ...p, unread: 0, time: "Recently", online: false, img: `https://api.dicebear.com/7.x/notionists/svg?seed=${p.name}&backgroundColor=dbeafe` }));
      apptPatients.forEach(p => { if(!byId.has(p.id)) byId.set(p.id, p); });
      setPatientsList(Array.from(byId.values()));
    }
    load();
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!selectedPatient) return;
    try {
      const data = await getHumanMessages(selectedPatient.id);
      const formatted = data.map(m => ({
        id: m.id, from: m.sender_role, text: m.content,
        time: new Date(m.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        read: true
      }));
      setMessages(formatted);
    } catch(err) {
      console.error(err);
    }
  }, [selectedPatient]);

  useEffect(() => {
    fetchMessages();
    const iv = setInterval(fetchMessages, 2000);
    return () => clearInterval(iv);
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !selectedPatient) return;
    const txt = input.trim();
    setInput("");

    setMessages(prev => [...prev, { id: Date.now(), from: "doctor", text: txt, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), read: false }]);

    try {
      await sendHumanMessage(selectedPatient.id, {
        sender_role: "doctor",
        recipient_id: selectedPatient.id,
        content: txt
      });
      fetchMessages();
    } catch(err) {
      console.error(err);
    }
  };

  const filteredPatients = patientsList.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()) || p.id?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-[calc(100vh-65px)] bg-gray-50 dark:bg-gray-950">
      {/* Patient list */}
      <div className={`${selectedPatient ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 xl:w-80 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 shrink-0`}>
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-headline font-bold text-gray-900 dark:text-white text-lg mb-3">Patient Messages</h2>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patients..." className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none dark:text-white dark:placeholder-gray-500" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredPatients.map(p => (
            <button key={p.id} onClick={() => setSelectedPatient(p)} className={`w-full text-left flex items-center gap-3 px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-50 dark:border-gray-800/50 transition-colors ${selectedPatient?.id === p.id ? 'bg-emerald-50 dark:bg-emerald-950/20' : ''}`}>
              <div className="relative shrink-0">
                <img src={p.img} alt={p.name} className="w-12 h-12 rounded-xl border-2 border-gray-100 dark:border-gray-700" />
                {p.online && <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{p.name}</p>
                  <span className="text-[10px] text-gray-400 shrink-0 ml-2">{p.time}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{p.lastMsg}</p>
              </div>
              {p.unread > 0 && <span className="w-5 h-5 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">{p.unread}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      {selectedPatient ? (
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
            <button onClick={() => setSelectedPatient(null)} className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
              <ChevronLeft size={20} />
            </button>
            <div className="relative shrink-0">
              <img src={selectedPatient.img} alt={selectedPatient.name} className="w-10 h-10 rounded-xl border-2 border-gray-100 dark:border-gray-700" />
              {selectedPatient.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white dark:border-gray-900" />}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{selectedPatient.name}</p>
              <p className={`text-xs ${selectedPatient.online ? 'text-emerald-500' : 'text-gray-400'}`}>
                Patient · Age {selectedPatient.age} · {selectedPatient.online ? 'Online' : 'Offline'}
              </p>
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <button className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"><Phone size={18} /></button>
              <button className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"><Video size={18} /></button>
              <button className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"><MoreVertical size={18} /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950">
            {messages.map(msg => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.from === 'doctor' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.from === 'doctor'
                    ? 'bg-emerald-600 text-white rounded-br-md shadow-md shadow-emerald-500/20'
                    : 'bg-white dark:bg-gray-900 text-gray-800 dark:text-white border border-gray-100 dark:border-gray-700 rounded-bl-md'
                }`}>
                  {msg.text}
                  <div className={`flex items-center gap-1 mt-1.5 text-[10px] ${msg.from === 'doctor' ? 'justify-end text-emerald-200' : 'text-gray-400'}`}>
                    <span>{msg.time}</span>
                    {msg.from === 'doctor' && <CheckCheck size={12} className={msg.read ? 'text-white' : 'text-emerald-300'} />}
                  </div>
                </div>
              </motion.div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-3">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-2xl px-2 py-1.5">
              <button className="p-2 text-gray-400 hover:text-gray-600 transition"><Paperclip size={18} /></button>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Type a message to patient..." className="flex-1 bg-transparent text-sm outline-none text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" />
              <button onClick={sendMessage} disabled={!input.trim()} className="w-9 h-9 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-xl flex items-center justify-center text-white transition active:scale-90">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 hidden md:flex items-center justify-center bg-gray-50 dark:bg-gray-950">
          <div className="text-center">
            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/30 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Send size={32} className="text-emerald-600" />
            </div>
            <p className="font-semibold text-gray-700 dark:text-gray-300">Select a patient to start chatting</p>
            <p className="text-sm text-gray-400 mt-1">Your messages are end-to-end encrypted</p>
          </div>
        </div>
      )}
    </div>
  );
}
