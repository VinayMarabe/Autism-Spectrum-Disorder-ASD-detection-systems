// src/utils/chatApi.js
const API_BASE = "http://127.0.0.1:8000/api";

export async function getHumanMessages(patientId) {
  if (!patientId) return [];
  try {
    const res = await fetch(`${API_BASE}/chat/messages?patient_id=${patientId}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch messages", err);
    return [];
  }
}

export async function sendHumanMessage(patientId, payload) {
  try {
    const res = await fetch(`${API_BASE}/chat/messages?patient_id=${patientId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender_role: payload.sender_role,
        recipient_id: payload.recipient_id || "",
        content: payload.content,
        sources: []
      }),
    });
    if (!res.ok) throw new Error("API Error");
    return await res.json();
  } catch (err) {
    console.error("Failed to send message", err);
    throw err;
  }
}
