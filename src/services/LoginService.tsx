import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";

interface LoginContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const LoginContext = createContext<LoginContextType | null>(null);

const CREDENTIALS = {
  email: "admin@sistema.com",
  password: "admin123",
};

const LOGIN_STORAGE_KEY = "system_authenticated";

function getInitialAuthState(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(LOGIN_STORAGE_KEY) === "true";
}

interface LoginProviderProps {
  children: ReactNode;
}

export function LoginProvider({ children }: LoginProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    getInitialAuthState
  );

  async function login(email: string, password: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (
      email === CREDENTIALS.email &&
      password === CREDENTIALS.password
    ) {
      localStorage.setItem(LOGIN_STORAGE_KEY, "true");
      setIsAuthenticated(true);
      return;
    }

    throw new Error("Credenciais inválidas");
  }

  function logout() {
    localStorage.removeItem(LOGIN_STORAGE_KEY);
    setIsAuthenticated(false);
  }

  return (
    <LoginContext.Provider
      value={{ isAuthenticated, login, logout }}
    >
      {children}
    </LoginContext.Provider>
  );
}

export function useLogin() {
  const context = useContext(LoginContext);

  if (!context) {
    throw new Error("useLogin deve ser usado dentro de LoginProvider");
  }

  return context;
}
