import client from "./client";

export async function fetchChatHistory(patientId) {
  if (!patientId) return [];
  const { data } = await client.get(`/patients/${patientId}/chat`);
  return data;
}

export async function sendChatMessage(patientId, payload) {
  const { data } = await client.post(`/patients/${patientId}/chat`, payload);
  return data;
}
