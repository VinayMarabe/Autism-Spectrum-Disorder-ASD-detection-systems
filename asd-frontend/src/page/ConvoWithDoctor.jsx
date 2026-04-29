// src/page/ConvoWithDoctor.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, Send } from "lucide-react";

import { fetchChatHistory, sendChatMessage } from "../api/chat";
import { getPatient } from "../api/patients";
import { useActivePatient } from "../context/ActivePatientContext";
import i18n from "../i18n";

const ConvoWithDoctor = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { activePatient } = useActivePatient();

  const fallbackPatient = state?.patient || null;
  const uiPatient = activePatient || fallbackPatient;
  const [patientDetail, setPatientDetail] = useState(null);
  const [messages, setMessages] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");

  const latestSnapshot = useMemo(() => {
    return patientDetail?.latest_screening || state?.result || null;
  }, [patientDetail, state]);

  useEffect(() => {
    let ignore = false;
    const loadContext = async () => {
      if (!uiPatient?.id) {
        setPatientDetail(null);
        setMessages([]);
        setEvidence([]);
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
        setMessages(historyMessages);
        const latestSources = [...historyMessages]
          .reverse()
          .find((item) => item.from === "assistant" && item.sources?.length)?.sources;
        setEvidence(latestSources || []);
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
      const syncedHistory = (resp.history || []).map((entry) => ({
        from: entry.role === "assistant" ? "assistant" : "user",
        text: entry.content,
        createdAt: entry.created_at,
        sources: entry.sources || [],
      }));
      setMessages(syncedHistory);
      setEvidence(resp.evidence || []);
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
    <div className="animate-fade-in pb-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-end gap-4 mb-6">

          {uiPatient && (
            <div className="text-xs font-semibold text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
              {i18n.t("active_patient_label") || "Active patient:"}{" "}
              <span className="font-bold text-slate-800">{patientLabel}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shadow-sm">
            <MessageCircle size={20} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Convo with doctor
          </h1>
        </div>
        <p className="text-sm font-medium text-slate-500 mb-8 max-w-2xl leading-relaxed">
          The assistant uses retrieval-augmented answers with cited sources from
          MRI screenings, reports, and patient metadata.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Chat area */}
          <div className="lg:col-span-2 card p-0 overflow-hidden flex flex-col min-h-[500px]">
            <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-slate-50/50">
              {historyLoading && (
                <div className="flex justify-center p-4">
                  <div className="text-[11px] uppercase tracking-widest font-bold text-slate-400 animate-pulse">Loading history…</div>
                </div>
              )}
              {!historyLoading && messages.length === 0 && (
                <div className="rounded-2xl bg-white border border-slate-100 p-6 text-sm text-slate-500 text-center shadow-sm max-w-md mx-auto mt-8">
                  <MessageCircle size={24} className="mx-auto text-slate-300 mb-3" />
                  <p className="font-medium text-slate-800 mb-1">No chat history yet</p>
                  <p>Ask about the latest screening, MRI findings, severity bucket, or supporting evidence.</p>
                </div>
              )}
              {messages.map((m, idx) => (
                <div
                  key={`${m.createdAt || idx}-${idx}`}
                  className={`flex ${
                    m.from === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm font-medium leading-relaxed shadow-sm ${
                      m.from === "user"
                        ? "bg-primary-500 text-white rounded-br-sm"
                        : "bg-white text-slate-700 border border-slate-100 rounded-bl-sm"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="text-xs font-semibold text-rose-600 bg-rose-50 px-4 py-3 border-y border-rose-100">{error}</div>
            )}

            <div className="bg-white border-t border-slate-100 p-4">
              <div className="flex items-end gap-3 max-w-full">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  disabled={!uiPatient?.id}
                  placeholder={
                    uiPatient?.id
                      ? "Type a question you’d like to discuss with the doctor…"
                      : "Select or create a patient to start chatting"
                  }
                  className="input-field min-h-[44px] resize-none"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  className="btn-primary shrink-0 h-[44px] w-[44px] p-0 flex items-center justify-center rounded-xl"
                  disabled={!uiPatient?.id || !input.trim() || loading}
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>
            </div>
          </div>

          <aside className="card space-y-6">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Patient insight</div>
              {uiPatient ? (
                <ul className="space-y-1 text-sm font-medium">
                  <li className="text-slate-800">{patientLabel}</li>
                  {uiPatient.notes && (
                    <li className="text-slate-500 line-clamp-3 leading-relaxed mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100">{uiPatient.notes}</li>
                  )}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 font-medium">Select a patient to load summaries.</p>
              )}
            </div>

            {latestSnapshot && (
              <div className="border-t border-slate-100 pt-6">
                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-3">
                  Latest screening snapshot
                </div>
                <div className="space-y-3 text-sm font-medium text-slate-600">
                  <div className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50">
                    <span>Predicted class</span>
                    <span className="font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-sm">
                      {latestSnapshot.predicted_class || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50">
                    <span>ASD probability</span>
                    <span className="font-bold text-slate-900">
                      {latestSnapshot.prob_asd != null
                        ? `${(latestSnapshot.prob_asd * 100).toFixed(1)}%`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50">
                    <span>Severity bucket</span>
                    <span className="font-bold text-slate-900">
                      {latestSnapshot.severity_bucket || "—"}
                    </span>
                  </div>
                  
                  <div className="pt-2 px-2 text-xs text-slate-400">
                    {latestSnapshot.created_at && (
                      <p>
                        Recorded: {new Date(latestSnapshot.created_at).toLocaleString()}
                      </p>
                    )}
                    {latestSnapshot.metadata?.model && (
                      <p className="mt-1">Model: {latestSnapshot.metadata.model}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {evidence.length > 0 && (
              <div className="border-t border-slate-100 pt-6">
                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-3 flex items-center justify-between">
                  <span>Retrieved evidence</span>
                  <span className="bg-primary-50 text-primary-700 px-2 py-0.5 rounded text-[10px]">{evidence.length}</span>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {evidence.map((item, idx) => (
                    <div
                      key={`${item.source}-${idx}`}
                      className="border border-slate-100 bg-slate-50/50 rounded-xl p-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="text-[10px] uppercase tracking-wider font-bold text-primary-600 mb-1">
                        {item.source}
                      </div>
                      <p className="text-xs font-medium text-slate-700 leading-relaxed line-clamp-4">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ConvoWithDoctor;
