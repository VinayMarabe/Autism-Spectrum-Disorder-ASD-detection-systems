// src/page/ConvoWithDoctor.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, Send, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { fetchChatHistory, sendChatMessage } from "../../api/chat";
import { getPatient } from "../../api/patients";
import { useActivePatient } from "../../context/ActivePatientContext";
import i18n from "../../i18n";

const introMessage = {
  from: "assistant",
  text:
    "This workspace connects to dr.THYNK's backend. Ask focused clinical questions and the assistant will cite patient-specific evidence.",
};

const ConvoWithDoctor = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { activePatient } = useActivePatient();

  const fallbackPatient = state?.patient || null;
  const uiPatient = activePatient || fallbackPatient;
  const [patientDetail, setPatientDetail] = useState(null);
  const [messages, setMessages] = useState([introMessage]);
  const [evidence, setEvidence] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");
  const chatBottomRef = useRef(null);

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const latestSnapshot = useMemo(() => {
    return patientDetail?.latest_screening || state?.result || null;
  }, [patientDetail, state]);

  useEffect(() => {
    let ignore = false;
    const loadContext = async () => {
      if (!uiPatient?.id) {
        setPatientDetail(null);
        setMessages([introMessage]);
        return;
      }
      setHistoryLoading(true);
      try {
        const [detail, history] = await Promise.all([
          getPatient(uiPatient.id).catch(() => uiPatient),
          fetchChatHistory(uiPatient.id),
        ]);
        if (ignore) return;
        setPatientDetail(detail);
        const historyMessages = history.map((entry) => ({
          from: entry.role === "assistant" ? "assistant" : "user",
          text: entry.content,
          createdAt: entry.created_at,
          sources: entry.sources || [],
        }));
        setMessages([introMessage, ...historyMessages]);
      } catch (err) {
        console.warn("Failed to hydrate chat", err);
      } finally {
        if (!ignore) setHistoryLoading(false);
      }
    };
    loadContext();
    return () => {
      ignore = true;
    };
  }, [uiPatient]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || !uiPatient?.id) return;
    setError("");
    setLoading(true);
    const optimistic = {
      from: "user",
      text: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");

    try {
      const payload = {
        message: trimmed,
        patient: {
          id: uiPatient.id,
          name: uiPatient.name,
          age: uiPatient.age,
          gender: uiPatient.gender,
          notes: uiPatient.notes,
        },
      };
      const resp = await sendChatMessage(uiPatient.id, payload);
      const assistantMsg = {
        from: "assistant",
        text: resp.reply,
        createdAt: new Date().toISOString(),
      };
      setEvidence(resp.evidence || []);
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to reach clinician assistant"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const patientLabel = uiPatient
    ? `${uiPatient.name} • ${uiPatient.age ?? "—"}`
    : i18n.t("select_patient") || "Select patient";

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-sky-50 via-white to-emerald-50">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>

          {uiPatient && (
            <div className="text-xs text-slate-600 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {i18n.t("active_patient_label") || "Active patient:"}{" "}
              <span className="font-semibold">{patientLabel}</span>
            </div>
          )}
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Sparkles size={20} />
            </div>
            <span>Clinical Assistant</span>
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-2xl">
            This AI assistant uses retrieval-augmented generation grounded in the patient's MRI screenings, reports, and clinical notes to provide evidence-based answers.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat area */}
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col min-h-[500px] overflow-hidden">
            <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-slate-50/50">
              {historyLoading && (
                <div className="text-xs text-slate-400 flex justify-center py-4">Loading conversation history...</div>
              )}
              <AnimatePresence>
                {messages.map((m, idx) => (
                  <motion.div
                    key={`${m.createdAt || idx}-${idx}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${
                      m.from === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm shadow-sm ${
                        m.from === "user"
                          ? "bg-slate-900 text-white rounded-br-sm"
                          : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                      }`}
                    >
                      {m.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={chatBottomRef} />
            </div>

            {error && (
              <div className="text-xs text-rose-600 px-6 py-2 bg-rose-50 border-t border-rose-100">{error}</div>
            )}

            <div className="border-t border-slate-100 p-4 bg-white flex items-center gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                disabled={!uiPatient?.id}
                placeholder={
                  uiPatient?.id
                    ? "Type a clinical question regarding the patient..."
                    : "Select or create a patient to start chatting"
                }
                className="flex-1 text-sm rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors disabled:bg-slate-50 disabled:text-slate-400"
              />
              <button
                type="button"
                onClick={handleSend}
                className="inline-flex items-center justify-center p-3 rounded-xl bg-slate-900 text-white font-semibold shadow-md hover:bg-slate-800 transition disabled:opacity-50"
                disabled={!uiPatient?.id || !input.trim() || loading}
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
          </motion.div>

          <motion.aside initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 text-sm text-slate-600 space-y-6">
            <div>
              <div className="font-semibold text-slate-900 mb-1">Patient insight</div>
              {uiPatient ? (
                <ul className="space-y-1">
                  <li>{patientLabel}</li>
                  {uiPatient.notes && (
                    <li className="text-slate-500 line-clamp-2">{uiPatient.notes}</li>
                  )}
                </ul>
              ) : (
                <p>Select a patient to load summaries.</p>
              )}
            </div>

            {latestSnapshot && (
              <div className="border-t border-dashed border-slate-200 pt-3">
                <div className="font-semibold text-slate-900 mb-1">
                  Latest screening snapshot
                </div>
                <p>
                  Predicted class:{" "}
                  <span className="font-semibold">
                    {latestSnapshot.predicted_class || "—"}
                  </span>
                </p>
                <p>
                  ASD probability:{" "}
                  {latestSnapshot.prob_asd != null
                    ? `${(latestSnapshot.prob_asd * 100).toFixed(1)}%`
                    : "N/A"}
                </p>
                <p>
                  Severity bucket: {latestSnapshot.severity_bucket || "—"}
                </p>
              </div>
            )}

            {evidence.length > 0 && (
              <div className="border-t border-dashed border-slate-200 pt-3 space-y-2">
                <div className="font-semibold text-slate-900">
                  Retrieved evidence
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {evidence.map((item, idx) => (
                    <div
                      key={`${item.source}-${idx}`}
                      className="border border-slate-100 rounded-xl p-2"
                    >
                      <div className="text-[11px] text-slate-400">
                        {item.source}
                      </div>
                      <p className="text-[11px] text-slate-700 line-clamp-3">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.aside>
        </div>
      </div>
    </div>
  );
};

export default ConvoWithDoctor;
