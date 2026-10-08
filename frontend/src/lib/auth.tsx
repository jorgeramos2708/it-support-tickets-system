import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, setUnauthorizedHandler } from "./api";
import { ME } from "./data";
import { useMode } from "./mode";

export interface AuthUser {
  name: string;
  email: string;
  role: string;
}

interface AuthValue {
  user: AuthUser | null;
  token: string | null;
  live: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const TOKEN_KEY = "tickitflow.token";
const USER_KEY = "tickitflow.user";

const AuthContext = createContext<AuthValue | null>(null);

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { mode } = useMode();
  const live = mode === "live";
  const [token, setToken] = useState<string | null>(() =>
    live ? localStorage.getItem(TOKEN_KEY) : null,
  );
  const [user, setUser] = useState<AuthUser | null>(() =>
    live ? readStoredUser() : null,
  );

  useEffect(() => {
    if (!live) return;
    setUnauthorizedHandler(() => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setToken(null);
      setUser(null);
    });
  }, [live]);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  const value: AuthValue = live
    ? { user, token, live, login, logout }
    : {
        user: { name: ME, email: "demo@tickitflow.dev", role: "agente" },
        token: null,
        live,
        login: async () => {},
        logout: () => {},
      };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth requiere AuthProvider");
  return ctx;
}
