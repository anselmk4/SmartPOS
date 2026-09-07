"use client";

import React, { useState, useEffect } from "react";
import { Lock, ShieldAlert, X, Eye, EyeOff, AlertTriangle, Trash2, Eraser, Ban, CheckCircle2 } from "lucide-react";
import { adminFetch } from "@/lib/admin/admin-api";

export type AdminActionType = "DELETE" | "CLEAN" | "SUSPEND";

interface AdminPasswordConfirmModalProps {
  isOpen: boolean;
  actionType: AdminActionType;
  tenantName: string;
  onClose: () => void;
  onConfirm: (adminPassword: string) => Promise<void> | void;
  isProcessing?: boolean;
}

export function AdminPasswordConfirmModal({
  isOpen,
  actionType,
  tenantName,
  onClose,
  onConfirm,
  isProcessing = false,
}: AdminPasswordConfirmModalProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassword("");
      setShowPassword(false);
      setError(null);
      setIsVerifying(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getActionDetails = () => {
    switch (actionType) {
      case "DELETE":
        return {
          title: "Suppression Définitive de la Boutique",
          badge: "Action Irréversible",
          badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/40",
          icon: <Trash2 className="w-6 h-6 text-rose-400" />,
          buttonBg: "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30",
          buttonLabel: "Supprimer Définitivement",
          description: (
            <>
              Vous êtes sur le point de supprimer définitivement la boutique{" "}
              <b className="text-white">"{tenantName}"</b>.
              <ul className="list-disc list-inside mt-2 space-y-1 text-slate-300 text-xs">
                <li>Tous les dépôts et caisses liés seront supprimés</li>
                <li>Tous les comptes caissiers et gérants seront détruits</li>
                <li>L'ensemble des ventes, articles et clients seront effacés</li>
              </ul>
            </>
          ),
        };
      case "CLEAN":
        return {
          title: "Nettoyage Intégral des Données",
          badge: "Purge Transactionnelle",
          badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          icon: <Eraser className="w-6 h-6 text-amber-400" />,
          buttonBg: "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30",
          buttonLabel: "Purger & Réinitialiser",
          description: (
            <>
              Vous êtes sur le point de réinitialiser à zéro toutes les données de{" "}
              <b className="text-white">"{tenantName}"</b>.
              <ul className="list-disc list-inside mt-2 space-y-1 text-slate-300 text-xs">
                <li>Toutes les ventes et encaissements seront supprimés</li>
                <li>Tous les articles, stocks et clients seront purgés</li>
                <li>Le compte boutique et les accès caissiers resteront intacts</li>
              </ul>
            </>
          ),
        };
      case "SUSPEND":
        return {
          title: "Suspension de l'Accès Boutique",
          badge: "Verrouillage de Sécurité",
          badgeColor: "bg-orange-500/20 text-orange-300 border-orange-500/40",
          icon: <Ban className="w-6 h-6 text-orange-400" />,
          buttonBg: "bg-orange-600 hover:bg-orange-500 text-white shadow-orange-600/30",
          buttonLabel: "Confirmer la Suspension",
          description: (
            <>
              Vous êtes sur le point de suspendre l'accès pour la boutique{" "}
              <b className="text-white">"{tenantName}"</b>.
              <ul className="list-disc list-inside mt-2 space-y-1 text-slate-300 text-xs">
                <li>La caisse et les terminaux de vente seront immédiatement bloqués</li>
                <li>Les caissiers et gérants ne pourront plus se connecter</li>
              </ul>
            </>
          ),
        };
    }
  };

  const details = getActionDetails();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Veuillez saisir le mot de passe administrateur.");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      // 1. Verify password via Admin API
      const res = await adminFetch("/api/v1/admin/auth/verify-password", {
        method: "POST",
        body: JSON.stringify({ password: password.trim() }),
      });

      if (!res.success) {
        setError(res.error || "Mot de passe administrateur incorrect.");
        setIsVerifying(false);
        return;
      }

      // 2. Trigger action callback with verified password
      await onConfirm(password.trim());
      setIsVerifying(false);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Erreur de validation");
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
              {details.icon}
            </div>
            <div>
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border mb-1 ${details.badgeColor}`}
              >
                {details.badge}
              </span>
              <h3 className="font-extrabold text-white text-base leading-snug">
                {details.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isVerifying || isProcessing}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Warning Description */}
        <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-800 text-slate-300 text-xs leading-relaxed">
          {details.description}
        </div>

        {/* Security Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Saisissez votre Mot de Passe Super-Admin :</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe Super Administrateur..."
                disabled={isVerifying || isProcessing}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isVerifying || isProcessing}
              className="py-2.5 px-4 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-bold text-xs transition-colors disabled:opacity-50"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={isVerifying || isProcessing || !password.trim()}
              className={`py-2.5 px-4 rounded-xl font-bold text-xs shadow-md transition-all touch-press flex items-center justify-center gap-1.5 disabled:opacity-50 ${details.buttonBg}`}
            >
              {isVerifying || isProcessing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Validation...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>{details.buttonLabel}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
