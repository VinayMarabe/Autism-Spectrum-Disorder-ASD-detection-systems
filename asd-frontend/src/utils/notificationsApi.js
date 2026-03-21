// src/utils/notificationsApi.js
const API_BASE = "http://127.0.0.1:8000/api";

export async function getNotifications(role, userId) {
  if (!userId) return [];
  try {
    const res = await fetch(`${API_BASE}/notifications?role=${role}&user_id=${userId}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch notifications", err);
    return [];
  }
}

export async function markNotificationRead(notifId) {
  try {
    await fetch(`${API_BASE}/notifications/${notifId}/read`, {
      method: "PATCH"
    });
  } catch (err) {
    console.error("Failed to mark read", err);
  }
}
