"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { call } from "@/lib/http";

export type User = { id: string; name: string; email: string; phone: string | null };
type Result = { ok: true } | { ok: false; error: string };
type Ctx = {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<Result>;
  register: (v: { name: string; email: string; password: string; phone?: string }) => Promise<Result>;
  logout: () => Promise<void>;
  updateProfile: (v: { name?: string; phone?: string }) => Promise<Result>;
};

const AuthContext = createContext<Ctx | null>(null);

/** Customer session. The token lives in an httpOnly cookie set by the /api routes; this only mirrors "who is signed in". */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

   
  useEffect(() => {
    call<{ customer: User | null }>("/api/me")
      .then((r) => setUser(r.ok ? r.data.customer : null))
      .finally(() => setReady(true));
  }, []);
   

  const enter = useCallback(async (path: string, body: unknown): Promise<Result> => {
    const r = await call<{ customer: User }>(path, { method: "POST", body });
    if (!r.ok) return { ok: false, error: r.error };
    setUser(r.data.customer);
    return { ok: true };
  }, []);

  const value: Ctx = {
    user,
    ready,
    login: (email, password) => enter("/api/auth/login", { email, password }),
    register: (v) => enter("/api/auth/register", v),
    logout: async () => {
      await call("/api/auth/logout", { method: "POST", body: {} });
      setUser(null);
    },
    updateProfile: async (v) => {
      const r = await call<User>("/api/me", { method: "PATCH", body: v });
      if (!r.ok) return { ok: false, error: r.error };
      setUser(r.data);
      return { ok: true };
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
