import axios from "axios";

export const API_BASE_URL =
  process.env.REACT_APP_API_BASE || "http://127.0.0.1:8001";

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

export default client;
