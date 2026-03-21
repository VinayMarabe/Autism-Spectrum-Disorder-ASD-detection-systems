import client from "./client";

export async function fetchPatients() {
  const { data } = await client.get("/patients");
  return data;
}

export async function savePatient(payload) {
  const { data } = await client.post("/patients", payload);
  return data;
}

export async function getPatient(patientId) {
  const { data } = await client.get(`/patients/${patientId}`);
  return data;
}

export async function saveScreening(patientId, payload) {
  const { data } = await client.post(
    `/patients/${patientId}/screenings`,
    payload
  );
  return data;
}
