// src/utils/appointmentStorage.js
// Connects to the FastAPI live backend for appointments

const API_BASE = "http://127.0.0.1:8000/api";

export async function getAppointments(role, userId) {
  try {
    const res = await fetch(`${API_BASE}/appointments?role=${role}&user_id=${userId || 'admin'}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Failed to fetch appointments:", err);
    return [];
  }
}

export async function addAppointment(appt) {
  try {
    const res = await fetch(`${API_BASE}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patient_id: appt.patientId || appt.patient_id,
        doctor_id: appt.doctorId || "admin",
        date: appt.date,
        time: appt.time,
        symptoms: appt.symptoms || appt.notes || ""
      }),
    });
    if (!res.ok) throw new Error("API Error");
    return await res.json();
  } catch (err) {
    console.error("Failed to add appointment", err);
    throw err;
  }
}

export async function updateAppointmentStatus(id, status) {
  try {
    await fetch(`${API_BASE}/appointments/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  } catch (err) {
    console.error("Failed to update status", err);
  }
}

export async function cancelAppointment(id) {
  return updateAppointmentStatus(id, "cancelled");
}
