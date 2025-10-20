import { createContext, useContext, useState, useEffect } from "react";

export type Cliente = {
  id: string;
  name: string;
  username: string;
  password: string;
};

type AuthContextType = {
  clienteAtivo: Cliente | null;
  token: string | null;
  selecionarCliente: (cliente: Cliente) => Promise<void>;
  limparCliente: () => void;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [clienteAtivo, setClienteAtivo] = useState<Cliente | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Recupera cliente/token do localStorage
  useEffect(() => {
    const clienteJSON = localStorage.getItem("clienteAtivo");
    const tokenLS = localStorage.getItem("token");
    const tokenExpira = Number(localStorage.getItem("tokenExpira") || 0);

    if (clienteJSON && tokenLS && Date.now() < tokenExpira) {
      setClienteAtivo(JSON.parse(clienteJSON));
      setToken(tokenLS);
    } else {
      limparCliente();
    }
  }, []);

  // Seleciona cliente e gera token
async function selecionarCliente(cliente: Cliente) {
  try {
    const res = await fetch("http://localhost:3001/api/get-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: cliente.username, password: cliente.password }),
    });

    if (!res.ok) throw new Error("Erro ao gerar token");

    const data = await res.json();

    console.log("🔑 Token retornado do backend:", data.access_token); // <-- PRINT NO CONSOLE DO NAVEGADOR

    setClienteAtivo(cliente);
    setToken(data.access_token);

    localStorage.setItem("clienteAtivo", JSON.stringify(cliente));
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("tokenExpira", String(Date.now() + 60 * 60 * 1000));
  } catch (err) {
    console.error("Erro ao gerar token:", err);
    throw err;
  }
}

  function limparCliente() {
    setClienteAtivo(null);
    setToken(null);
    localStorage.removeItem("clienteAtivo");
    localStorage.removeItem("token");
    localStorage.removeItem("tokenExpira");
  }

  return (
    <AuthContext.Provider value={{ clienteAtivo, token, selecionarCliente, limparCliente }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
