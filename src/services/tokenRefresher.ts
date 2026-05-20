import axios from "axios";

const API_URL = "https://scopeserver.onrender.com/api/jarvis/get-token";
const REFRESH_BEFORE = 5 * 60 * 1000; // 5 minutos antes de expirar

let refreshPromise: Promise<string | null> | null = null;

export async function checkAndRefreshToken(): Promise<string | null> {
  const clienteJSON = localStorage.getItem("clienteAtivo");
  const expiresAtStr = localStorage.getItem("tokenExpiresAt");
  const tokenLS = localStorage.getItem("token");

  if (!clienteJSON || !expiresAtStr || !tokenLS) {
    return null;
  }

  const expiresAt = new Date(expiresAtStr);
  const agora = Date.now();
  const tempoParaExpirar = expiresAt.getTime() - agora;

  // Se o token expira em menos de 5 minutos ou já expirou, renova
  if (tempoParaExpirar <= REFRESH_BEFORE) {
    if (refreshPromise) {
      console.log("[TokenRefresher] Aguardando refresh concorrente em andamento...");
      return refreshPromise;
    }

    console.log("[TokenRefresher] Token expirado ou próximo de expirar. Renovando...");

    refreshPromise = (async () => {
      try {
        const cliente = JSON.parse(clienteJSON);
        const res = await axios.post(API_URL, {
          username: cliente.username,
          password: cliente.password,
        });

        const token = res.data?.access_token;
        if (!token) {
          throw new Error("Token não retornado pela API");
        }

        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora de duração
        
        localStorage.setItem("token", token);
        localStorage.setItem("tokenExpiresAt", expiresAt.toISOString());

        console.log("[TokenRefresher] Token renovado com sucesso via Interceptor!");

        // Notifica o React Context
        window.dispatchEvent(
          new CustomEvent("tokenRefreshed", {
            detail: { token, expiresAt },
          })
        );

        return token;
      } catch (err) {
        console.error("[TokenRefresher] Falha ao renovar token:", err);
        return null;
      } finally {
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  }

  return tokenLS;
}
