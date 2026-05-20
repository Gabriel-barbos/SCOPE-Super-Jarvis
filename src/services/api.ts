
import axios from "axios";
import { checkAndRefreshToken } from "./tokenRefresher";

const api = axios.create({
  baseURL: "https://live.mzoneweb.net/mzone62.api",
  timeout: 30000,
});

// pega token do localStorage sempre que mandar requisição (e renova se necessário)
api.interceptors.request.use(async (config) => {
  const token = await checkAndRefreshToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
