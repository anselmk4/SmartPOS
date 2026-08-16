"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export interface SuperAdminSession {
  email: string;
  name: string;
  role: "SUPER_ADMIN";
  loginAt: string;
}

interface AdminAuthContextType {
  admin: SuperAdminSession | null;
  isAdminAuthenticated: boolean;
  isLoading: boolean;
  loginAdmin: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  logoutAdmin: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const ADMIN_STORAGE_KEY = "kuettu_superadmin_session_v1";

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<SuperAdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (stored) {
        const parsed: SuperAdminSession = JSON.parse(stored);
        if (parsed.role === "SUPER_ADMIN") {
          setAdmin(parsed);
        } else {
          localStorage.removeItem(ADMIN_STORAGE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginAdmin = async (email: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: pass }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (!res.ok || !data.success) {
        return { success: false, message: data.error || "Identifiants incorrects" };
      }

      setAdmin(data.admin);
      if (typeof window !== "undefined") {
        localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(data.admin));
        if (data.token) {
          localStorage.setItem("kuettu_admin_token", data.token);
        }
      }

      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, message: err.message || "Erreur de connexion au serveur" };
    }
  };

  const logoutAdmin = () => {
    setAdmin(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
      localStorage.removeItem("kuettu_admin_token");
    }
    router.push("/admin/login");
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        isAdminAuthenticated: !!admin,
        isLoading,
        loginAdmin,
        logoutAdmin,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};
