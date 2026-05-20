import axios from "axios";
import { checkAndRefreshToken } from "./tokenRefresher";

const proxyApi = axios.create({
  baseURL: "https://scopeserver.onrender.com/api/jarvis", 
  timeout: 20000,
});

proxyApi.interceptors.request.use(async (config) => {
  const token = await checkAndRefreshToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default proxyApi;
