import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

// Types
export type Cliente = {
  id: number;
  name: string;
  username: string;
  password: string;
};

type AuthContextType = {
  clienteAtivo: Cliente | null;
  token: string | null;
  tokenExpiresAt: Date | null;
  isRefreshing: boolean;
  selecionarCliente: (cliente: Cliente) => Promise<void>;
  limparCliente: () => void;
  refreshToken: () => Promise<void>;
};

// Constantes
const API_URL = "https://scopeserver.onrender.com/api/jarvis/get-token";
const TOKEN_DURATION = 60 * 60 * 1000; 
const REFRESH_BEFORE = 5 * 60 * 1000; 

// Storage keys
const STORAGE_KEYS = {
  CLIENTE: "clienteAtivo",
  TOKEN: "token",
  EXPIRES_AT: "tokenExpiresAt",
} as const;

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [clienteAtivo, setClienteAtivo] = useState<Cliente | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Função para gerar/renovar token
  const gerarToken = useCallback(async (cliente: Cliente): Promise<{ token: string; expiresAt: Date }> => {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        username: cliente.username, 
        password: cliente.password 
      }),
    });

    if (!res.ok) {
      throw new Error(`Erro ao gerar token: ${res.status}`);
    }

    const data = await res.json();
    const expiresAt = new Date(Date.now() + TOKEN_DURATION);

    console.log("Token gerado:", data.access_token);
    console.log("Expira em:", expiresAt.toLocaleString());

    return {
      token: data.access_token,
      expiresAt,
    };
  }, []);

  // Função para salvar no localStorage
  const salvarNoStorage = useCallback((cliente: Cliente, token: string, expiresAt: Date) => {
    localStorage.setItem(STORAGE_KEYS.CLIENTE, JSON.stringify(cliente));
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, expiresAt.toISOString());
  }, []);

  // Função para limpar refresh timer
  const limparRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  // Função para agendar refresh automático
  const agendarRefresh = useCallback((expiresAt: Date) => {
    limparRefreshTimer();

    const agora = Date.now();
    const expiraEm = expiresAt.getTime();
    const tempoParaRefresh = expiraEm - agora - REFRESH_BEFORE;

    if (tempoParaRefresh > 0) {
      console.log(`Refresh agendado para: ${new Date(agora + tempoParaRefresh).toLocaleTimeString()}`);
      
      refreshTimerRef.current = setTimeout(() => {
        console.log("Iniciando refresh automático do token...");
        refreshToken();
      }, tempoParaRefresh);
    } else {
      // Token já expirou ou vai expirar muito em breve
      console.warn("Token expirando em breve, renovando imediatamente...");
      refreshToken();
    }
  }, []);

  // Função para renovar o token
  const refreshToken = useCallback(async () => {
    if (!clienteAtivo || isRefreshing) {
      return;
    }

    setIsRefreshing(true);

    try {
      console.log("Renovando token para:", clienteAtivo.name);
      
      const { token: novoToken, expiresAt: novaExpiracao } = await gerarToken(clienteAtivo);
      
      setToken(novoToken);
      setTokenExpiresAt(novaExpiracao);
      salvarNoStorage(clienteAtivo, novoToken, novaExpiracao);
      
      // Agenda o próximo refresh
      agendarRefresh(novaExpiracao);
      
      console.log("Token renovado com sucesso!");
    } catch (error) {
      console.error(" Erro ao renovar token:", error);
      
      // Em caso de erro, tenta novamente em 30 segundos
      refreshTimerRef.current = setTimeout(() => {
        console.log(" Tentando renovar token novamente...");
        refreshToken();
      }, 30000);
    } finally {
      setIsRefreshing(false);
    }
  }, [clienteAtivo, isRefreshing, gerarToken, salvarNoStorage, agendarRefresh]);

  // Recupera cliente/token do localStorage ao iniciar
  useEffect(() => {
    const clienteJSON = localStorage.getItem(STORAGE_KEYS.CLIENTE);
    const tokenLS = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const expiresAtStr = localStorage.getItem(STORAGE_KEYS.EXPIRES_AT);

    if (clienteJSON && tokenLS && expiresAtStr) {
      const expiresAt = new Date(expiresAtStr);
      const agora = Date.now();

      // Verifica se o token ainda é válido
      if (agora < expiresAt.getTime()) {
        const cliente = JSON.parse(clienteJSON);
        setClienteAtivo(cliente);
        setToken(tokenLS);
        setTokenExpiresAt(expiresAt);
        
        console.log(" Sessão recuperada do localStorage");
        console.log(" Cliente:", cliente.name);
        console.log(" Token expira em:", expiresAt.toLocaleString());
        
        // Agenda o refresh
        agendarRefresh(expiresAt);
      } else {
        console.log("Token expirado encontrado no localStorage, limpando...");
        limparCliente();
      }
    }
  }, [agendarRefresh]);

  // Limpa timer quando o componente é desmontado
  useEffect(() => {
    return () => {
      limparRefreshTimer();
    };
  }, [limparRefreshTimer]);

  // Seleciona cliente e gera token
  const selecionarCliente = useCallback(async (cliente: Cliente) => {
    try {
      const { token: novoToken, expiresAt } = await gerarToken(cliente);
      
      setClienteAtivo(cliente);
      setToken(novoToken);
      setTokenExpiresAt(expiresAt);
      
      salvarNoStorage(cliente, novoToken, expiresAt);
      
      // Agenda o refresh automático
      agendarRefresh(expiresAt);
      
      console.log("Cliente selecionado:", cliente.name);
    } catch (err) {
      console.error(" Erro ao selecionar cliente:", err);
      throw err;
    }
  }, [gerarToken, salvarNoStorage, agendarRefresh]);

  // Limpa cliente e token
  const limparCliente = useCallback(() => {
    limparRefreshTimer();
    
    setClienteAtivo(null);
    setToken(null);
    setTokenExpiresAt(null);
    
    localStorage.removeItem(STORAGE_KEYS.CLIENTE);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
    
    console.log("Cliente desconectado");
  }, [limparRefreshTimer]);

  return (
    <AuthContext.Provider 
      value={{ 
        clienteAtivo, 
        token, 
        tokenExpiresAt,
        isRefreshing,
        selecionarCliente, 
        limparCliente,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  
  return context;
}