"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  PackagePlus,
  Crown,
  Smartphone,
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Store,
  ShieldCheck,
  Zap,
  ShoppingBag,
  Layers,
} from "lucide-react";

interface FirstLoginGuideModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  tenantName?: string;
  isOwner?: boolean;
}

export function FirstLoginGuideModal({
  isOpen: forcedIsOpen,
  onClose: forcedOnClose,
  tenantName = "votre commerce",
  isOwner = true,
}: FirstLoginGuideModalProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof forcedIsOpen === "boolean") {
      setIsOpen(forcedIsOpen);
      return;
    }

    // Check if onboarding guide has already been completed or dismissed
    if (typeof window !== "undefined") {
      const isCompleted = localStorage.getItem("kuettu_onboarding_guide_completed");
      if (!isCompleted && isOwner) {
        // Show after a tiny delay for smooth appearance
        const timer = setTimeout(() => setIsOpen(true), 800);
        return () => clearTimeout(timer);
      }
    }
  }, [forcedIsOpen, isOwner]);

  const handleClose = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("kuettu_onboarding_guide_completed", "true");
    }
    setIsOpen(false);
    if (forcedOnClose) forcedOnClose();
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden text-white flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-gradient-to-r from-blue-950/60 to-indigo-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white flex items-center gap-2">
                <span>Bienvenue sur Kuettu Global POS</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  Guide Rapide
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Étape {currentStep} sur 4 pour bien démarrer</p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Passer le guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-4 gap-1 p-2 bg-slate-950/40 border-b border-slate-800/60">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              onClick={() => setCurrentStep(step)}
              className={`h-1.5 rounded-full cursor-pointer transition-all ${
                step <= currentStep ? "bg-gradient-to-r from-blue-500 to-indigo-500 shadow-xs" : "bg-slate-800"
              }`}
            />
          ))}
        </div>

        {/* Modal Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* STEP 1: AJOUTER DU STOCK */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border border-blue-500/30 flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 shrink-0">
                  <PackagePlus className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-white">1. Référencez vos Articles & Stock</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Pour encaisser vos premières ventes, enregistrez vos produits avec leurs prix et quantités.
                  </p>
                </div>
              </div>

              <div className="space-y-2 bg-slate-800/50 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                  <div>
                    <b className="text-slate-200">Photos & Code-barres :</b> Vous pouvez prendre en photo vos articles et scanner les codes-barres avec l'appareil photo.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                  <div>
                    <b className="text-slate-200">Calcul automatique des marges :</b> Renseignez votre prix d'achat pour connaître vos bénéfices nets sur chaque vente.
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/inventory"
                  onClick={handleClose}
                  className="inline-flex items-center gap-1.5 font-bold text-xs text-blue-400 hover:text-blue-300 underline underline-offset-4"
                >
                  <span>Ouvrir l'espace Stock & Inventaire maintenant</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* STEP 2: FORFAITS & PLANS */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-900/30 to-purple-900/30 border border-amber-500/30 flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-white">2. Débloquez les Forfaits PRO & BUSINESS</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Multi-caisses, tickets WhatsApp, gestion multi-dépôts et ventes illimitées.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                  <span className="font-black text-blue-400 text-xs block">PRO (Recommandé)</span>
                  <p className="text-[10px] text-slate-300 leading-relaxed">
                    Ventes illimitées, tickets WhatsApp automatiques, gestion des dettes clients & crédits.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                  <span className="font-black text-purple-400 text-xs block">BUSINESS</span>
                  <p className="text-[10px] text-slate-300 leading-relaxed">
                    Multi-magasins, transferts de stock avec bons de transfert, clôtures de caisse avancées.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/billing"
                  onClick={handleClose}
                  className="inline-flex items-center gap-1.5 font-bold text-xs text-amber-400 hover:text-amber-300 underline underline-offset-4"
                >
                  <span>Consulter et activer un abonnement</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* STEP 3: LIAISON MULTI-APPAREILS PAR LE PROPRIETAIRE */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-900/30 to-blue-900/30 border border-indigo-500/30 flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 shrink-0">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-white">3. Liaison de vos Téléphones, Tablettes & PC</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Le compte Propriétaire lie la boutique à chaque nouvel appareil.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/80 space-y-2.5">
                <p className="text-slate-200 font-medium leading-relaxed">
                  📱 <b>Comment utiliser Kuettu sur un nouvel appareil ?</b>
                </p>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-300 text-[11px]">
                  <li>
                    Ouvrez <b>globalpos.app</b> sur le téléphone ou la tablette du magasin.
                  </li>
                  <li>
                    Connectez-vous une première fois avec le <b>compte Propriétaire</b> pour synchroniser les données de la boutique sur cet appareil.
                  </li>
                  <li>
                    Une fois lié, vos caissiers ou serveurs peuvent se connecter directement avec leur <b>code PIN</b> sans avoir besoin de votre mot de passe !
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* STEP 4: AJOUTER DES MEMBRES DU STAFF */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border border-emerald-500/30 flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-white">4. Créez les Accès de vos Caissiers & Staff</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Sécurisez votre caisse avec des codes PIN dédiés pour chaque vendeur.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/80 space-y-2">
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">🔒</span>
                  <div>
                    <b className="text-slate-200">Sécurité Totale :</b> Vos caissiers ne voient que la caisse et ne peuvent pas modifier les prix d'achat ni voir vos marges.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">📊</span>
                  <div>
                    <b className="text-slate-200">Rapports par Vendeur :</b> Suivez en temps réel les performances et les encaissements de chaque membre d'équipe.
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/settings"
                  onClick={handleClose}
                  className="inline-flex items-center gap-1.5 font-bold text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-4"
                >
                  <span>Configurer mon équipe dans Paramètres</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Précédent</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all touch-press"
          >
            <span>{currentStep === 4 ? "Terminer & Ouvrir ma Caisse" : "Étape Suivante"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
