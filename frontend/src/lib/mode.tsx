import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "./api";

export type BackendMode = "demo" | "live";

interface ModeValue {
  mode: BackendMode;
  ready: boolean;
}

const ModeContext = createContext<ModeValue>({ mode: "demo", ready: false });

export function ModeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ModeValue>({ mode: "demo", ready: false });

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    api
      .health(controller.signal)
      .then(() => setState({ mode: "live", ready: true }))
      .catch(() => setState({ mode: "demo", ready: true }))
      .finally(() => clearTimeout(timer));
  }, []);

  if (!state.ready) return null;
  return <ModeContext.Provider value={state}>{children}</ModeContext.Provider>;
}

export function useMode(): ModeValue {
  return useContext(ModeContext);
}
