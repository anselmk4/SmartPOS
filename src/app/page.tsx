"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import LoginPage from "./auth/login/page";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/pos");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex-1 min-h-[calc(100vh-61px)] flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <img
            src="/images/logo.png"
            alt="Kuettu Global POS"
            className="h-12 w-auto object-contain animate-pulse"
          />
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return <LoginPage />;
}
