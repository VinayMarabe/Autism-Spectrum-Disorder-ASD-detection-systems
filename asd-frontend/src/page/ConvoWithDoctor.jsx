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
            <div className="text-xs text-slate-600">
              {i18n.t("active_patient_label") || "Active patient:"}{" "}
              <span className="font-semibold">{patientLabel}</span>
            </div>
          )}
        </div>

        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <MessageCircle size={20} className="text-sky-500" />
          <span>Convo with doctor</span>
        </h1>
        <p className="text-xs text-slate-600 mt-1 mb-4">
          The assistant uses retrieval-augmented answers with cited sources from
          MRI screenings, reports, and patient metadata.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat area */}
          <div className="lg:col-span-2 bg-white rounded-2xl border shadow-sm flex flex-col min-h-[360px]">
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              {historyLoading && (
                <div className="text-[11px] text-slate-400">Loading history…</div>
              )}
              {!historyLoading && messages.length === 0 && (
                <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-3 text-xs text-slate-600">
                  No chat history yet for this patient. Ask about the latest screening,
                  MRI findings, severity bucket, or supporting evidence.
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
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${
                      m.from === "user"
                        ? "bg-sky-500 text-white rounded-br-sm"
                        : "bg-slate-100 text-slate-800 rounded-bl-sm"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="text-[11px] text-rose-600 px-4">{error}</div>
            )}

            <div className="border-t border-slate-100 p-3 flex items-end gap-2">
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
                className="flex-1 text-xs rounded-xl border border-slate-200 p-2 resize-none focus:outline-none focus:ring-1 focus:ring-sky-400 disabled:bg-slate-50"
              />
              <button
                type="button"
                onClick={handleSend}
                className="inline-flex items-center justify-center px-3 py-2 rounded-xl bg-sky-500 text-white text-xs font-semibold disabled:opacity-60"
                disabled={!uiPatient?.id || !input.trim() || loading}
              >
                {loading ? (
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send size={14} className="mr-1" />
                )}
                Send
              </button>
            </div>
          </div>

          <aside className="bg-white rounded-2xl border shadow-sm p-4 text-xs text-slate-600 space-y-4">
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
                {latestSnapshot.created_at && (
                  <p className="text-slate-400">
                    Recorded: {new Date(latestSnapshot.created_at).toLocaleString()}
                  </p>
                )}
                {latestSnapshot.metadata?.model && (
                  <p>Model: {latestSnapshot.metadata.model}</p>
                )}
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
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ConvoWithDoctor;
