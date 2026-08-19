"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAdminAuth } from "@/lib/admin/admin-context";
import {
  ShieldAlert,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  Server,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Store,
} from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const { loginAdmin, isAdminAuthenticated, isLoading } = useAdminAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAdminAuthenticated) {
      router.push("/admin");
    }
  }, [isAdminAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const res = await loginAdmin(email, password);
    setIsSubmitting(false);

    if (res.success) {
      router.push("/admin");
    } else {
      setErrorMsg(res.message || "Accès refusé.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/15 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-indigo-600/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Top Navbar Brand */}
      <header className="relative z-10 p-6 max-w-7xl mx-auto w-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-white text-base tracking-wide">
              Kuettu <span className="text-blue-400">Global POS</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono">Portail Super Administrateur</p>
          </div>
        </Link>

        <Link
          href="/"
          className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl border border-slate-800 hover:bg-slate-900 transition-colors"
        >
          ← Retour au site
        </Link>
      </header>

      {/* Main Login Card */}
      <main className="relative z-10 max-w-md w-full mx-auto p-4 my-auto">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              Espace Administration
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Accès réservé à la supervision globale de la plateforme SaaS Kuettu Global POS.
            </p>
          </div>

          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-2xl text-xs font-semibold mb-4 flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Email Administrateur
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="info@kuettu.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/80 rounded-2xl text-sm border border-slate-700/80 focus:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-medium transition-all text-white placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Mot de Passe Principal
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 bg-slate-800/80 rounded-2xl text-sm border border-slate-700/80 focus:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-medium transition-all text-white placeholder-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition-all touch-press disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Connexion sécurisée en cours...</span>
              ) : (
                <>
                  <span>Accéder au Dashboard Master</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Kuettu Global POS • Console de Contrôle Centralisée</p>
      </footer>
    </div>
  );
}
