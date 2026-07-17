"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { SessionUser } from "@/lib/types";
import { clearUser, getUser, setUser as persistUser } from "@/lib/storage";

interface SessionContextValue {
  user: SessionUser | null;
  login: (user: SessionUser) => void;
  signOut: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    // One-time hydration from localStorage on mount (not a cascading update):
    // the value doesn't exist during SSR, so it can only be read client-side.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(getUser());
  }, []);

  const login = (nextUser: SessionUser) => {
    persistUser(nextUser);
    setUser(nextUser);
  };

  const signOut = () => {
    clearUser();
    setUser(null);
  };

  return <SessionContext.Provider value={{ user, login, signOut }}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
}
