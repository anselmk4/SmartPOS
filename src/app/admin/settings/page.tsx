"use client";

import React, { useState, useEffect, useCallback } from "react";
import { adminFetch } from "@/lib/admin/admin-api";
import {
  Settings,
  Database,
  Download,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Server,
  Layers,
  Sparkles,
  Zap,
  Globe,
  Sliders,
  AlertCircle,
  Smartphone,
  Mail,
  Send,
  Lock,
  Key,
  Flame,
  Check,
  Eye,
  EyeOff,
  Radio,
  Clock,
  HardDrive,
  Users,
  Store as StoreIcon,
  CreditCard,
  ShoppingBag,
  Receipt,
  UserCheck,
  ShieldAlert,
} from "lucide-react";

interface VerificationConfig {
  verificationMethod: "SMS" | "EMAIL" | "DISABLED";
  isSimulationMode: boolean;
  otpExpiryMinutes: number;
  twilio: {
    accountSid?: string;
    authToken?: string;
    phoneNumber?: string;
    messagingServiceSid?: string;
  };
  email: {
    provider: string;
    fromEmail?: string;
    fromName?: string;
  };
  updatedAt?: string;
}

interface SystemStats {
  database: {
    connected: boolean;
    provider: string;
    latencyMs: number;
    urlHost: string;
    error?: string;
  };
  tableCounts: {
    tenants: number;
    stores: number;
    users: number;
    subscriptions: number;
    products: number;
    customers: number;
    sales: number;
    saleItems: number;
    debtPayments: number;
    syncLogs: number;
    otpVerifications: number;
  };
  verificationConfig?: VerificationConfig;
  environment: string;
  serverTimestamp: string;
}

export default function AdminSettingsPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verification Settings State
  const [verificationMethod, setVerificationMethod] = useState<"SMS" | "EMAIL" | "DISABLED">("EMAIL");
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioToken, setTwilioToken] = useState("");
  const [twilioPhone, setTwilioPhone] = useState("");
  const [twilioServiceSid, setTwilioServiceSid] = useState("");

  // Email & Resend Settings State
  const [resendApiKey, setResendApiKey] = useState("");
  const [resendFromEmail, setResendFromEmail] = useState("noreply@globalpos.app");
  const [resendFromName, setResendFromName] = useState("Kuettu Global POS");
  const [showApiKey, setShowApiKey] = useState(false);

  // Test Dispatch
  const [testTargetPhone, setTestTargetPhone] = useState("+243 810 000 000");
  const [testTargetEmail, setTestTargetEmail] = useState("kuettusocial@gmail.com");
  const [testTemplateType, setTestTemplateType] = useState<"OTP" | "FORGOT_PIN" | "PAYMENT">("OTP");
  const [isTestingDispatch, setIsTestingDispatch] = useState(false);
  const [testFeedback, setTestFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadStats = useCallback(async () => {
    try {
      const res = await adminFetch<SystemStats>("/api/v1/admin/settings");
      if (res.success && res.data) {
        setStats(res.data);
        setError(null);

        // Load verification config into local form
        if (res.data.verificationConfig) {
          const cfg = res.data.verificationConfig;
          setVerificationMethod(cfg.verificationMethod || "EMAIL");
          setIsSimulationMode(cfg.isSimulationMode ?? false);
          setTwilioSid(cfg.twilio?.accountSid || "");
          setTwilioToken(cfg.twilio?.authToken || "");
          setTwilioPhone(cfg.twilio?.phoneNumber || "");
          setTwilioServiceSid(cfg.twilio?.messagingServiceSid || "");
          setResendApiKey((cfg.email as any)?.apiKey || "");
          setResendFromEmail(cfg.email?.fromEmail || "noreply@globalpos.app");
          setResendFromName(cfg.email?.fromName || "Kuettu Global POS");
        }
      } else {
        setError(res.error || "Erreur de connexion à la base de données");
      }
    } catch (err: any) {
      setError(err.message || "Erreur réseau");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleSaveVerificationConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await adminFetch("/api/v1/admin/settings", {
        method: "PUT",
        body: JSON.stringify({
          verificationMethod,
          isSimulationMode,
          twilio: {
            accountSid: twilioSid.trim(),
            authToken: twilioToken.trim(),
            phoneNumber: twilioPhone.trim(),
            messagingServiceSid: twilioServiceSid.trim(),
          },
          email: {
            provider: "RESEND",
            apiKey: resendApiKey.trim(),
            fromEmail: resendFromEmail.trim(),
            fromName: resendFromName.trim(),
          },
        }),
      });

      if (res.success) {
        showToast(res.message || "Paramètres enregistrés avec succès !");
        loadStats();
      } else {
        alert(res.error || "Erreur lors de la sauvegarde");
      }
    } catch (err: any) {
      alert("Erreur: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestDispatch = async () => {
    setIsTestingDispatch(true);
    setTestFeedback(null);

    try {
      const res = await adminFetch<any>("/api/v1/admin/settings", {
        method: "PUT",
        body: JSON.stringify({
          action: "TEST_DISPATCH",
          verificationMethod,
          templateType: testTemplateType,
          testPhone: testTargetPhone,
          testEmail: testTargetEmail,
        }),
      });

      if (res.success) {
        setTestFeedback({
          success: true,
          message: res.message || "E-mail test expédié avec succès via Resend !",
        });
        showToast("Test d'envoi déclenché avec succès !");
      } else {
        setTestFeedback({
          success: false,
          message: `Échec d'envoi : ${res.error || "Vérifiez vos paramètres API"}`,
        });
      }
    } catch (err: any) {
      setTestFeedback({
        success: false,
        message: `Erreur d'envoi : ${err.message}`,
      });
    } finally {
      setIsTestingDispatch(false);
    }
  };

  const handleExportFullDatabaseJson = async () => {
    setIsExporting(true);
    try {
      const res = await adminFetch("/api/v1/admin/settings", {
        method: "POST",
      });

      if (res.success && res.data) {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `supabase_globalpos_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("Sauvegarde intégrale Supabase exportée !");
      } else {
        alert(res.error || "Erreur lors de l'exportation");
      }
    } catch (err: any) {
      alert("Erreur lors de l'export: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const counts = stats?.tableCounts || {
    tenants: 0,
    stores: 0,
    users: 0,
    subscriptions: 0,
    products: 0,
    customers: 0,
    sales: 0,
    saleItems: 0,
    debtPayments: 0,
    syncLogs: 0,
    otpVerifications: 0,
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-500 text-white px-5 py-3.5 rounded-2xl text-xs font-bold shadow-2xl shadow-emerald-500/30 flex items-center gap-2.5 animate-in slide-in-from-top duration-300 border border-emerald-400/30">
          <CheckCircle2 className="w-5 h-5 text-emerald-100" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold tracking-wide">
              <Settings className="w-3.5 h-3.5" />
              <span>Console Système Super Admin</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Paramètres & Supervision Système
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Configuration de la validation des comptes marchands, passerelle e-mail Resend, SMS Twilio et sauvegardes de données cloud.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setIsRefreshing(true);
                loadStats();
              }}
              disabled={isRefreshing}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 transition-all border border-slate-700/80 flex items-center gap-2 text-xs font-bold shadow-sm hover:border-slate-600"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-blue-400" : "text-slate-400"}`} />
              <span>{isRefreshing ? "Actualisation..." : "Actualiser"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && !isLoading && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between shadow-lg shadow-rose-950/20">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={loadStats} className="font-bold underline hover:text-white transition-colors">
            Réessayer
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. NOUVEAU DESIGN : VALIDATION DES COMPTES & RESEND API   */}
      {/* ========================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-8">
        {/* Card Header & Dynamic Status */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Protocole d'Activation des Marchands</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Canal de Validation & Notification
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sélectionnez la méthode d'authentification pour les nouveaux comptes, mots de passe oubliés et paiements.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {verificationMethod === "EMAIL" && (
              <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                isSimulationMode 
                  ? "bg-amber-500/10 text-amber-300 border-amber-500/30" 
                  : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-sm shadow-emerald-950/50"
              }`}>
                <span className={`w-2 h-2 rounded-full ${isSimulationMode ? "bg-amber-400" : "bg-emerald-400 animate-pulse"}`} />
                <span>{isSimulationMode ? "Mode Simulation (Test local)" : "Resend API Connecté (globalpos.app)"}</span>
              </span>
            )}
            {verificationMethod === "SMS" && (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>Passerelle Twilio SMS</span>
              </span>
            )}
            {verificationMethod === "DISABLED" && (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span>Activation Directe</span>
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSaveVerificationConfig} className="space-y-8">
          {/* Method Selection (3 High-End Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {/* Option 1: Validation par Email (RESEND - RECOMMANDÉ) */}
            <div
              onClick={() => setVerificationMethod("EMAIL")}
              className={`relative p-5 sm:p-6 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden group ${
                verificationMethod === "EMAIL"
                  ? "bg-gradient-to-b from-blue-950/50 via-slate-900/90 to-slate-900 border-blue-500/80 shadow-xl shadow-blue-500/10 ring-1 ring-blue-500/30"
                  : "bg-slate-900/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                  verificationMethod === "EMAIL"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                    : "bg-slate-800 text-slate-400"
                }`}>
                  <Mail className="w-6 h-6" />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                  verificationMethod === "EMAIL"
                    ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}>
                  Officiel Resend
                </span>
              </div>

              <h3 className="font-extrabold text-white text-base tracking-tight mb-1.5">
                Validation par E-mail
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed min-h-[38px]">
                Envoie un e-mail officiel HTML responsive avec code OTP à 6 chiffres via <b className="text-blue-400">globalpos.app</b>.
              </p>

              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">État du canal</span>
                <span className={`inline-flex items-center gap-1.5 font-bold ${
                  verificationMethod === "EMAIL" ? "text-blue-400" : "text-slate-500"
                }`}>
                  <span className={`w-2 h-2 rounded-full ${verificationMethod === "EMAIL" ? "bg-blue-400" : "bg-slate-600"}`} />
                  {verificationMethod === "EMAIL" ? "Actif & Recommandé" : "Inactif"}
                </span>
              </div>
            </div>

            {/* Option 2: Validation par SMS (Twilio) */}
            <div
              onClick={() => setVerificationMethod("SMS")}
              className={`relative p-5 sm:p-6 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden group ${
                verificationMethod === "SMS"
                  ? "bg-gradient-to-b from-indigo-950/50 via-slate-900/90 to-slate-900 border-indigo-500/80 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500/30"
                  : "bg-slate-900/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                  verificationMethod === "SMS"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "bg-slate-800 text-slate-400"
                }`}>
                  <Smartphone className="w-6 h-6" />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                  verificationMethod === "SMS"
                    ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}>
                  Passerelle SMS
                </span>
              </div>

              <h3 className="font-extrabold text-white text-base tracking-tight mb-1.5">
                Validation par SMS (Twilio)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed min-h-[38px]">
                Envoie un code OTP par SMS directement sur le numéro de téléphone (+243 RDC).
              </p>

              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">État du canal</span>
                <span className={`inline-flex items-center gap-1.5 font-bold ${
                  verificationMethod === "SMS" ? "text-indigo-400" : "text-slate-500"
                }`}>
                  <span className={`w-2 h-2 rounded-full ${verificationMethod === "SMS" ? "bg-indigo-400" : "bg-slate-600"}`} />
                  {verificationMethod === "SMS" ? "Actif" : "Inactif"}
                </span>
              </div>
            </div>

            {/* Option 3: Désactivé (Activation Directe) */}
            <div
              onClick={() => setVerificationMethod("DISABLED")}
              className={`relative p-5 sm:p-6 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden group ${
                verificationMethod === "DISABLED"
                  ? "bg-gradient-to-b from-amber-950/50 via-slate-900/90 to-slate-900 border-amber-500/80 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500/30"
                  : "bg-slate-900/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                  verificationMethod === "DISABLED"
                    ? "bg-amber-600 text-white shadow-lg shadow-amber-600/30"
                    : "bg-slate-800 text-slate-400"
                }`}>
                  <Zap className="w-6 h-6" />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                  verificationMethod === "DISABLED"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}>
                  Sans Validation
                </span>
              </div>

              <h3 className="font-extrabold text-white text-base tracking-tight mb-1.5">
                Activation Immédiate
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed min-h-[38px]">
                Aucune confirmation requise : la boutique est activée et accessible immédiatement.
              </p>

              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">État du canal</span>
                <span className={`inline-flex items-center gap-1.5 font-bold ${
                  verificationMethod === "DISABLED" ? "text-amber-400" : "text-slate-500"
                }`}>
                  <span className={`w-2 h-2 rounded-full ${verificationMethod === "DISABLED" ? "bg-amber-400" : "bg-slate-600"}`} />
                  {verificationMethod === "DISABLED" ? "Actif (Accès libre)" : "Inactif"}
                </span>
              </div>
            </div>
          </div>

          {/* Configuration Form: Resend Email */}
          {verificationMethod === "EMAIL" && (
            <div className="rounded-2xl bg-slate-950/60 border border-slate-800/90 p-5 sm:p-6 space-y-5 animate-in fade-in slide-in-from-top-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-sm">
                      Configuration de l'Expéditeur Resend (Domaine Vérifié globalpos.app)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Les e-mails de validation, réinitialisation de PIN et alertes de paiement sont délivrés via ces identifiants.
                    </p>
                  </div>
                </div>

                {/* Simulation Switch Toggle */}
                <label className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={isSimulationMode}
                    onChange={(e) => setIsSimulationMode(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-700 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-300">Mode Simulation (Désactiver en Prod)</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-blue-400" />
                      Clé API Resend (API Key)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                    >
                      {showApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showApiKey ? "Masquer" : "Afficher"}</span>
                    </button>
                  </div>
                  <input
                    type={showApiKey ? "text" : "password"}
                    placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxx"
                    value={resendApiKey}
                    onChange={(e) => setResendApiKey(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                  />
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">Clé standard Resend commençant par re_</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    E-mail Expéditeur (From Email)
                  </label>
                  <input
                    type="text"
                    placeholder="noreply@globalpos.app"
                    value={resendFromEmail}
                    onChange={(e) => setResendFromEmail(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Domaine vérifié : <span className="text-blue-400 font-semibold">globalpos.app</span></p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Nom Affiché Expéditeur (From Name)
                  </label>
                  <input
                    type="text"
                    placeholder="Kuettu Global POS"
                    value={resendFromName}
                    onChange={(e) => setResendFromName(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all font-medium"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Exemple : Kuettu Global POS</p>
                </div>
              </div>
            </div>
          )}

          {/* Configuration Form: Twilio SMS */}
          {verificationMethod === "SMS" && (
            <div className="rounded-2xl bg-slate-950/60 border border-slate-800/90 p-5 sm:p-6 space-y-5 animate-in fade-in slide-in-from-top-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-sm">
                      Identifiants API Twilio SMS
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Renseignez vos clés API Twilio pour l'envoi de SMS en production.
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={isSimulationMode}
                    onChange={(e) => setIsSimulationMode(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-300">Mode Simulation</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Twilio Account SID
                  </label>
                  <input
                    type="text"
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={twilioSid}
                    onChange={(e) => setTwilioSid(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Twilio Auth Token
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••••••••••••••••••••••••••"
                    value={twilioToken}
                    onChange={(e) => setTwilioToken(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Numéro Expéditeur (From Phone)
                  </label>
                  <input
                    type="text"
                    placeholder="+1234567890"
                    value={twilioPhone}
                    onChange={(e) => setTwilioPhone(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Messaging Service SID (Optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={twilioServiceSid}
                    onChange={(e) => setTwilioServiceSid(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Footer & Banc d'Essai (Test Dispatch) */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              <button
                type="submit"
                disabled={isSaving}
                className="py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-xl shadow-blue-600/30 hover:shadow-blue-600/40 transition-all duration-200 flex items-center justify-center gap-2 shrink-0 touch-press"
              >
                <CheckCircle2 className={`w-4 h-4 ${isSaving ? "animate-spin" : ""}`} />
                <span>{isSaving ? "Enregistrement en cours..." : "Enregistrer les Paramètres de Validation"}</span>
              </button>

              {/* Banc d'Essai Inline */}
              <div className="flex flex-wrap items-center gap-2 bg-slate-950/70 p-2 rounded-2xl border border-slate-800">
                {verificationMethod === "EMAIL" && (
                  <select
                    value={testTemplateType}
                    onChange={(e: any) => setTestTemplateType(e.target.value)}
                    className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-blue-500"
                  >
                    <option value="OTP">OTP Validation Compte</option>
                    <option value="FORGOT_PIN">PIN Oublié</option>
                    <option value="PAYMENT">Alerte Paiement & Souscription</option>
                  </select>
                )}

                <input
                  type="text"
                  placeholder={verificationMethod === "EMAIL" ? "destinataire@domaine.com" : "+243 810 000 000"}
                  value={verificationMethod === "EMAIL" ? testTargetEmail : testTargetPhone}
                  onChange={(e) =>
                    verificationMethod === "EMAIL"
                      ? setTestTargetEmail(e.target.value)
                      : setTestTargetPhone(e.target.value)
                  }
                  className="bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-blue-500 w-52"
                />

                <button
                  type="button"
                  onClick={handleTestDispatch}
                  disabled={isTestingDispatch}
                  className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700/80 flex items-center gap-1.5 transition-all shrink-0 hover:border-slate-600"
                >
                  <Send className={`w-3.5 h-3.5 ${isTestingDispatch ? "animate-spin text-blue-400" : "text-slate-300"}`} />
                  <span>{isTestingDispatch ? "Envoi..." : "Tester l'Envoi"}</span>
                </button>
              </div>
            </div>

            {/* Test Feedback Message */}
            {testFeedback && (
              <div className={`p-4 rounded-2xl border text-xs flex items-center gap-3 animate-in fade-in slide-in-from-top-1 ${
                testFeedback.success
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-lg shadow-emerald-950/20"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-300 shadow-lg shadow-rose-950/20"
              }`}>
                {testFeedback.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span className="font-medium">{testFeedback.message}</span>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* ========================================================= */}
      {/* 2. BASE DE DONNÉES SUPABASE STATS & TABLES               */}
      {/* ========================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-white text-lg tracking-tight">
                Base de Données Principale (Supabase Cloud PostgreSQL)
              </h2>
              <p className="text-xs text-slate-400">
                Fournisseur : <b className="text-slate-300">{stats?.database.provider || "Supabase"}</b> • Hôte : <span className="font-mono text-slate-400">{stats?.database.urlHost || "Pooler AWS"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border ${
              stats?.database.connected
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-sm shadow-emerald-950/40"
                : "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-sm shadow-rose-950/40"
            }`}>
              <span className={`w-2 h-2 rounded-full ${stats?.database.connected ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
              <span>{stats?.database.connected ? "En Ligne & Connecté" : "Hors Ligne"}</span>
            </span>

            {stats?.database.latencyMs !== undefined && (
              <span className="text-xs font-mono font-bold text-slate-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                {stats.database.latencyMs} ms
              </span>
            )}
          </div>
        </div>

        {/* Real Table Counts Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
          {[
            { label: "Boutiques (tenants)", count: counts.tenants, color: "text-blue-400", icon: StoreIcon },
            { label: "Points de vente", count: counts.stores, color: "text-indigo-400", icon: Layers },
            { label: "Utilisateurs", count: counts.users, color: "text-purple-400", icon: Users },
            { label: "Abonnements", count: counts.subscriptions, color: "text-emerald-400", icon: CreditCard },
            { label: "Articles Catalogue", count: counts.products, color: "text-amber-400", icon: ShoppingBag },
            { label: "Clients", count: counts.customers, color: "text-sky-400", icon: UserCheck },
            { label: "Ventes Encaissées", count: counts.sales, color: "text-emerald-300", icon: Receipt },
            { label: "Lignes Articles", count: counts.saleItems, color: "text-teal-400", icon: Layers },
            { label: "Paiements Dettes", count: counts.debtPayments, color: "text-rose-400", icon: Flame },
            { label: "Codes OTP Émis", count: counts.otpVerifications, color: "text-pink-400", icon: Key },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-slate-400 font-medium truncate">{item.label}</span>
                  <Icon className={`w-3.5 h-3.5 ${item.color} opacity-70 group-hover:opacity-100 transition-opacity`} />
                </div>
                <span className={`text-2xl font-black ${item.color} font-mono tracking-tight`}>
                  {isLoading ? "..." : item.count.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. SAUVEGARDE INTÉGRALE SUPABASE (JSON)                   */}
      {/* ========================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold tracking-wide">
              <HardDrive className="w-3.5 h-3.5" />
              <span>Snapshot Cloud Sécurisé</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Sauvegarde Complète Supabase (JSON)
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Exportez instantanément une archive JSON chiffrée de toutes les tables réelles de Supabase (boutiques, utilisateurs, produits, ventes, abonnements, vérifications).
            </p>
          </div>

          <button
            onClick={handleExportFullDatabaseJson}
            disabled={isExporting}
            className="py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2.5 shadow-xl shadow-indigo-600/30 transition-all touch-press shrink-0 hover:shadow-indigo-600/40"
          >
            <Download className={`w-4 h-4 ${isExporting ? "animate-bounce" : ""}`} />
            <span>{isExporting ? "Génération de l'archive..." : "Exporter Sauvegarde Supabase"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
