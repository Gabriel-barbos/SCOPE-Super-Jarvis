// src/services/proxyApi.ts
import axios from "axios";

const proxyApi = axios.create({
  baseURL: "http://localhost:3001", // backend local, troque para o deploy depois
  timeout: 20000,
});

proxyApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default proxyApi;
