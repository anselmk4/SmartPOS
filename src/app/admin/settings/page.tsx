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
  const [error, setError] = useState<string | null>(null);

  // Verification Settings State
  const [verificationMethod, setVerificationMethod] = useState<"SMS" | "EMAIL" | "DISABLED">("SMS");
  const [isSimulationMode, setIsSimulationMode] = useState(true);
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioToken, setTwilioToken] = useState("");
  const [twilioPhone, setTwilioPhone] = useState("");
  const [twilioServiceSid, setTwilioServiceSid] = useState("");

  // Test Dispatch
  const [testTargetPhone, setTestTargetPhone] = useState("+243 810 000 000");
  const [testTargetEmail, setTestTargetEmail] = useState("test@commerce.cd");
  const [isTestingDispatch, setIsTestingDispatch] = useState(false);
  const [testFeedback, setTestFeedback] = useState<string | null>(null);

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
          setVerificationMethod(cfg.verificationMethod || "SMS");
          setIsSimulationMode(cfg.isSimulationMode ?? true);
          setTwilioSid(cfg.twilio?.accountSid || "");
          setTwilioToken(cfg.twilio?.authToken || "");
          setTwilioPhone(cfg.twilio?.phoneNumber || "");
          setTwilioServiceSid(cfg.twilio?.messagingServiceSid || "");
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
        }),
      });

      if (res.success) {
        showToast(res.message || "Paramètres de confirmation sauvegardés !");
        loadStats();
      } else {
        alert(res.error || "Erreur lors de la sauvegarde");
      }
    } catch (err: any) {
      alert("Erreur: " + err.message);
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
          testPhone: testTargetPhone,
          testEmail: testTargetEmail,
        }),
      });

      if (res.success) {
        setTestFeedback(res.message || "Envoi test réussi !");
        showToast("Test de confirmation déclenché !");
      } else {
        setTestFeedback(`Erreur: ${res.error || "Échec de l'envoi"}`);
      }
    } catch (err: any) {
      setTestFeedback(`Erreur: ${err.message}`);
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
        showToast("Sauvegarde intégrale Supabase exportée avec succès !");
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2 animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold mb-2">
            <Settings className="w-3.5 h-3.5" />
            <span>Console Système Super Admin</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Paramètres & Supervision Système
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gestion de la confirmation des commerces (SMS Twilio / Email Supabase), monitoring et sauvegardes.
          </p>
        </div>

        <button
          onClick={() => {
            setIsRefreshing(true);
            loadStats();
          }}
          disabled={isRefreshing}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 flex items-center gap-2 text-xs font-bold"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-400" : ""}`} />
          <span>Actualiser le Statut</span>
        </button>
      </div>

      {/* Error state */}
      {error && !isLoading && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button onClick={loadStats} className="font-bold underline hover:text-white">
            Réessayer
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. NOUVELLE SECTION : VALIDATION DES COMPTES (SMS TWILIO / EMAIL) */}
      {/* ========================================================= */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/60 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Système de Validation des Inscriptions</span>
            </div>
            <h3 className="text-lg font-black text-white">
              Confirmation des Nouveaux Commerces (SMS Twilio / Email)
            </h3>
            <p className="text-xs text-slate-400">
              Choisissez le canal de validation utilisé lors de la création d'un nouveau commerce par un utilisateur.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                isSimulationMode
                  ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                  : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
              }`}
            >
              {isSimulationMode ? "🟡 Mode Simulation Actif" : "🟢 Mode Production API Twilio"}
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveVerificationConfig} className="space-y-6">
          {/* Method Selection (3 Large Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Option 1: SMS Twilio (PAR DÉFAUT) */}
            <div
              onClick={() => setVerificationMethod("SMS")}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                verificationMethod === "SMS"
                  ? "border-blue-500 bg-blue-950/30 shadow-lg shadow-blue-500/10"
                  : "border-slate-800 bg-slate-800/40 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500 text-white shadow-sm">
                  Par Défaut
                </span>
              </div>

              <h4 className="font-bold text-white text-sm">Validation par SMS (Twilio)</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Envoie un code OTP à 6 chiffres par SMS sur le numéro de téléphone (+243 RDC).
              </p>

              <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs">
                <span className="text-slate-400">Canal actif</span>
                <span className={`w-3 h-3 rounded-full ${verificationMethod === "SMS" ? "bg-blue-500" : "bg-slate-700"}`} />
              </div>
            </div>

            {/* Option 2: Email Supabase */}
            <div
              onClick={() => setVerificationMethod("EMAIL")}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                verificationMethod === "EMAIL"
                  ? "border-indigo-500 bg-indigo-950/30 shadow-lg shadow-indigo-500/10"
                  : "border-slate-800 bg-slate-800/40 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                  Supabase Mail
                </span>
              </div>

              <h4 className="font-bold text-white text-sm">Validation par Email</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Envoie un code OTP et un lien de confirmation sécurisé sur l'adresse e-mail du gérant.
              </p>

              <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs">
                <span className="text-slate-400">Canal actif</span>
                <span className={`w-3 h-3 rounded-full ${verificationMethod === "EMAIL" ? "bg-indigo-500" : "bg-slate-700"}`} />
              </div>
            </div>

            {/* Option 3: Désactivé (Optionnel / Direct) */}
            <div
              onClick={() => setVerificationMethod("DISABLED")}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                verificationMethod === "DISABLED"
                  ? "border-amber-500 bg-amber-950/30 shadow-lg shadow-amber-500/10"
                  : "border-slate-800 bg-slate-800/40 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-700 text-slate-300 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                  Direct
                </span>
              </div>

              <h4 className="font-bold text-white text-sm">Activation Immédiate</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Aucune confirmation requise : la boutique est activée dès la validation du formulaire.
              </p>

              <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs">
                <span className="text-slate-400">Canal actif</span>
                <span className={`w-3 h-3 rounded-full ${verificationMethod === "DISABLED" ? "bg-amber-500" : "bg-slate-700"}`} />
              </div>
            </div>
          </div>

          {/* Twilio Credentials Configuration Fields */}
          {verificationMethod === "SMS" && (
            <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-800 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-blue-400" />
                  <h4 className="font-bold text-white text-sm">Identifiants API Twilio</h4>
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSimulationMode}
                    onChange={(e) => setIsSimulationMode(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span>Mode Simulation (Actif par défaut sans clés API)</span>
                </label>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Renseignez vos clés API Twilio ci-dessous dès que vous les aurez. En attendant, le mode simulation valide automatiquement et affiche le code généré.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Twilio Account SID
                  </label>
                  <input
                    type="text"
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={twilioSid}
                    onChange={(e) => setTwilioSid(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Twilio Auth Token
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••••••••••••••••••••••••••"
                    value={twilioToken}
                    onChange={(e) => setTwilioToken(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Numéro Expéditeur Twilio (From Number)
                  </label>
                  <input
                    type="text"
                    placeholder="+1234567890"
                    value={twilioPhone}
                    onChange={(e) => setTwilioPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Messaging Service SID (Optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={twilioServiceSid}
                    onChange={(e) => setTwilioServiceSid(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons & Test Dispatch Tool */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
            <button
              type="submit"
              className="py-3 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all touch-press flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Enregistrer les Paramètres de Validation</span>
            </button>

            {/* Test Tool Trigger */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder={verificationMethod === "EMAIL" ? "email@test.cd" : "+243 810 000 000"}
                value={verificationMethod === "EMAIL" ? testTargetEmail : testTargetPhone}
                onChange={(e) =>
                  verificationMethod === "EMAIL"
                    ? setTestTargetEmail(e.target.value)
                    : setTestTargetPhone(e.target.value)
                }
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono w-44"
              />
              <button
                type="button"
                onClick={handleTestDispatch}
                disabled={isTestingDispatch}
                className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition-all shrink-0"
              >
                <Send className={`w-3.5 h-3.5 ${isTestingDispatch ? "animate-spin" : ""}`} />
                <span>{isTestingDispatch ? "Test..." : "Tester l'Envoi"}</span>
              </button>
            </div>
          </div>

          {/* Test Feedback Banner */}
          {testFeedback && (
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300 flex items-center gap-2 animate-in fade-in">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>{testFeedback}</span>
            </div>
          )}
        </form>
      </div>

      {/* ========================================================= */}
      {/* 2. BASE DE DONNÉES SUPABASE STATS & TABLES */}
      {/* ========================================================= */}
      <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                Base de Données Principale (Supabase Cloud PostgreSQL)
              </h3>
              <p className="text-xs text-slate-400">
                Fournisseur : {stats?.database.provider || "Supabase"} • Hôte : {stats?.database.urlHost || "Pooler AWS"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                stats?.database.connected
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  stats?.database.connected ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                }`}
              />
              <span>{stats?.database.connected ? "En Ligne & Connecté" : "Hors Ligne"}</span>
            </span>

            {stats?.database.latencyMs !== undefined && (
              <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                {stats.database.latencyMs} ms
              </span>
            )}
          </div>
        </div>

        {/* Real Table Counts Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-4">
          {[
            { label: "Boutiques (tenants)", count: counts.tenants, color: "text-blue-400" },
            { label: "Points de vente (stores)", count: counts.stores, color: "text-indigo-400" },
            { label: "Utilisateurs (users)", count: counts.users, color: "text-purple-400" },
            { label: "Abonnements (subscriptions)", count: counts.subscriptions, color: "text-emerald-400" },
            { label: "Catalogue (products)", count: counts.products, color: "text-amber-400" },
            { label: "Clients (customers)", count: counts.customers, color: "text-sky-400" },
            { label: "Ventes (sales)", count: counts.sales, color: "text-emerald-300" },
            { label: "Articles vendus (sale_items)", count: counts.saleItems, color: "text-teal-400" },
            { label: "Règlements dettes", count: counts.debtPayments, color: "text-rose-400" },
            { label: "Codes OTP Vérifications", count: counts.otpVerifications, color: "text-pink-400" },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-800/50 p-3.5 rounded-2xl border border-slate-700/60 flex flex-col justify-between"
            >
              <span className="text-[11px] text-slate-400 font-medium truncate">{item.label}</span>
              <span className={`text-xl font-black ${item.color} mt-1 font-mono`}>
                {isLoading ? "..." : item.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. SAUVEGARDE INTÉGRALE SUPABASE (JSON) */}
      {/* ========================================================= */}
      <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-white text-base">
              Sauvegarde Complète de la Base Supabase (JSON)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Générez et téléchargez une archive JSON intégrale contenant toutes les tables réelles de Supabase (boutiques, utilisateurs, produits, ventes, abonnements, codes OTP).
            </p>
          </div>

          <button
            onClick={handleExportFullDatabaseJson}
            disabled={isExporting}
            className="py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all touch-press shrink-0"
          >
            <Download className={`w-4 h-4 ${isExporting ? "animate-bounce" : ""}`} />
            <span>{isExporting ? "Génération en cours..." : "Télécharger Sauvegarde Supabase"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
