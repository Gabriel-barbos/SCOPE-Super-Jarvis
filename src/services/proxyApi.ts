import axios from "axios";

const proxyApi = axios.create({
  baseURL: "https://scopeserver.onrender.com/api/jarvis", 
  timeout: 20000,
});

proxyApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default proxyApi;
