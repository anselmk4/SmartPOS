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
export const SUPER_ADMIN_EMAIL = "info@kuettu.com";
export const SUPER_ADMIN_PASS = "Password1!";

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
        if (parsed.email === SUPER_ADMIN_EMAIL && parsed.role === "SUPER_ADMIN") {
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
    // Standard delay to simulate authentication
    await new Promise((r) => setTimeout(r, 400));

    if (email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() && pass === SUPER_ADMIN_PASS) {
      const session: SuperAdminSession = {
        email: SUPER_ADMIN_EMAIL,
        name: "Super Administrateur Kuettu",
        role: "SUPER_ADMIN",
        loginAt: new Date().toISOString(),
      };
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(session));
      setAdmin(session);
      setIsLoading(false);
      return { success: true };
    }

    setIsLoading(false);
    return {
      success: false,
      message: "Identifiant ou mot de passe Administrateur incorrect.",
    };
  };

  const logoutAdmin = () => {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    setAdmin(null);
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
