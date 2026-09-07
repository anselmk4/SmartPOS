"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
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
  Lock,
} from "lucide-react";

interface FirstLoginGuideModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function FirstLoginGuideModal({
  isOpen: forcedIsOpen,
  onClose: forcedOnClose,
}: FirstLoginGuideModalProps) {
  const pathname = usePathname();
  const { isAuthenticated, isOwner, tenant, store, plan } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // If explicitly controlled from outside
    if (typeof forcedIsOpen === "boolean") {
      setIsOpen(forcedIsOpen);
      return;
    }

    // STRICT RULES:
    // 1. Must be authenticated with active store & must be OWNER / Gérant
    // 2. NEVER show on landing page (/), auth pages (/auth/*) or admin (/admin/*)
    // 3. Only show when terminal session is actively open on dashboard/caisse
    if (!isAuthenticated || !isOwner || !tenant?.id) {
      setIsOpen(false);
      return;
    }

    if (
      pathname === "/" ||
      pathname === "" ||
      pathname?.startsWith("/auth") ||
      pathname?.startsWith("/admin")
    ) {
      setIsOpen(false);
      return;
    }

    // Check if onboarding guide has already been completed for this specific tenant
    if (typeof window !== "undefined") {
      const storageKey = `kuettu_onboarding_guide_completed_${tenant.id}`;
      const isCompleted = localStorage.getItem(storageKey);
      if (!isCompleted) {
        // Show with a smooth 1s delay on first login
        const timer = setTimeout(() => setIsOpen(true), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [forcedIsOpen, isAuthenticated, isOwner, tenant?.id, pathname]);

  const handleClose = () => {
    if (typeof window !== "undefined" && tenant?.id) {
      const storageKey = `kuettu_onboarding_guide_completed_${tenant.id}`;
      localStorage.setItem(storageKey, "true");
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

  // If closed or unauthenticated, render nothing
  if (!isOpen || !isAuthenticated) return null;

  const storeName = store?.name || tenant?.name || "votre commerce";

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden text-white flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white flex items-center gap-2">
                <span>Bienvenue sur Kuettu Global POS</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  Guide Gérant
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Étape {currentStep} sur 4 &bull; Configuration de <b>{storeName}</b>
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Fermer le guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-4 gap-1.5 p-2.5 bg-slate-950/60 border-b border-slate-800/80">
          {[
            { num: 1, label: "Stock & Articles" },
            { num: 2, label: "Forfaits" },
            { num: 3, label: "Liaison Appareils" },
            { num: 4, label: "Staff & Caissiers" },
          ].map((s) => (
            <div
              key={s.num}
              onClick={() => setCurrentStep(s.num)}
              className="cursor-pointer group text-center"
            >
              <div
                className={`h-1.5 rounded-full transition-all ${
                  s.num <= currentStep
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 shadow-xs"
                    : "bg-slate-800 group-hover:bg-slate-700"
                }`}
              />
              <span
                className={`block text-[9px] font-bold mt-1 truncate ${
                  s.num === currentStep
                    ? "text-blue-400"
                    : s.num < currentStep
                    ? "text-slate-400"
                    : "text-slate-600"
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Modal Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          
          {/* STEP 1: AJOUTER DU STOCK */}
          {currentStep === 1 && (
            <div className="space-y-3.5 animate-in fade-in slide-in-from-right-3 duration-200">
              {/* Realistic Context Image */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-lg group">
                <img
                  src="/images/guide/guide_step1_stock.jpg"
                  alt="Commerçant ajoutant ses articles et stocks au magasin"
                  className="w-full h-44 sm:h-48 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-3.5">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-600 text-white w-fit mb-1 shadow-sm">
                    Étape 1 : Pour débuter
                  </span>
                  <h4 className="text-sm font-black text-white leading-tight">
                    Enregistrez vos premiers articles et stocks
                  </h4>
                </div>
              </div>

              <div className="space-y-2 bg-slate-800/60 p-3.5 rounded-2xl border border-slate-800">
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-black mt-0.5">✓</span>
                  <div className="text-slate-200">
                    <b>Prise de photos & Code-barres :</b> Prenez vos articles en photo et scannez leurs codes-barres avec l&apos;appareil photo de votre smartphone ou tablette.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-black mt-0.5">✓</span>
                  <div className="text-slate-200">
                    <b>Bénéfices & Prix de revient :</b> Renseignez votre prix d&apos;achat pour suivre vos marges réelles et votre rentabilité en direct.
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <Link
                  href="/inventory"
                  onClick={handleClose}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white border border-blue-500/40 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <PackagePlus className="w-4 h-4 text-blue-400" />
                  <span>Ouvrir l&apos;Inventaire & Ajouter un Produit</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* STEP 2: FORFAITS & PLANS SUPERIEURS */}
          {currentStep === 2 && (
            <div className="space-y-3.5 animate-in fade-in slide-in-from-right-3 duration-200">
              {/* Realistic Context Image */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-lg group">
                <img
                  src="/images/guide/guide_step2_plans.jpg"
                  alt="Gérante d'entreprise suivant la croissance de sa boutique sur tablette"
                  className="w-full h-44 sm:h-48 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-3.5">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500 text-slate-950 w-fit mb-1 shadow-sm">
                    Étape 2 : Croissance du Commerce
                  </span>
                  <h4 className="text-sm font-black text-white leading-tight">
                    Débloquez les Forfaits Supérieurs (PRO & BUSINESS)
                  </h4>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-2xl bg-slate-800/70 border border-slate-700/80 space-y-1">
                  <span className="font-black text-blue-400 text-xs block">Formule PRO</span>
                  <p className="text-[10px] text-slate-300 leading-relaxed">
                    Ventes illimitées, tickets reçus par WhatsApp en 1 clic, carnet de dettes clients & relances.
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-800/70 border border-slate-700/80 space-y-1">
                  <span className="font-black text-purple-400 text-xs block">Formule BUSINESS</span>
                  <p className="text-[10px] text-slate-300 leading-relaxed">
                    Multi-dépôts (jusqu&apos;à 10 magasins), transferts de stock entre boutiques et clôtures de caisse.
                  </p>
                </div>
              </div>

              <div className="pt-1">
                <Link
                  href="/billing"
                  onClick={handleClose}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-white border border-amber-500/40 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>Consulter et Mettre à Niveau mon Forfait</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* STEP 3: LIAISON DES APPAREILS PAR LE PROPRIETAIRE */}
          {currentStep === 3 && (
            <div className="space-y-3.5 animate-in fade-in slide-in-from-right-3 duration-200">
              {/* Realistic Context Image */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-lg group">
                <img
                  src="/images/guide/guide_step3_device.jpg"
                  alt="Propriétaire liant un nouvel appareil au comptoir de son magasin"
                  className="w-full h-44 sm:h-48 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-3.5">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-indigo-500 text-white w-fit mb-1 shadow-sm">
                    Étape 3 : Règle Multi-Appareils
                  </span>
                  <h4 className="text-sm font-black text-white leading-tight">
                    Le compte Propriétaire lie chaque nouvel appareil
                  </h4>
                </div>
              </div>

              <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/80 space-y-2">
                <p className="text-slate-200 font-bold">
                  📱 Comment connecter un téléphone, tablette ou PC au magasin ?
                </p>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-300 text-[11px]">
                  <li>
                    Ouvrez <b>globalpos.app</b> sur le nouvel appareil physique.
                  </li>
                  <li>
                    Connectez-vous une première fois avec le <b>compte Propriétaire</b> pour télécharger et synchroniser les données du commerce.
                  </li>
                  <li>
                    L&apos;appareil est alors lié ! Vos caissiers ou serveurs peuvent désormais s&apos;y connecter uniquement avec leur <b>code PIN</b>.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* STEP 4: AJOUTER DES MEMBRES DU STAFF */}
          {currentStep === 4 && (
            <div className="space-y-3.5 animate-in fade-in slide-in-from-right-3 duration-200">
              {/* Realistic Context Image */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-lg group">
                <img
                  src="/images/guide/guide_step4_staff.jpg"
                  alt="Caissière souriante encaissant un client sur l'écran tactile du POS"
                  className="w-full h-44 sm:h-48 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-3.5">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500 text-slate-950 w-fit mb-1 shadow-sm">
                    Étape 4 : Équipe & Vendeurs
                  </span>
                  <h4 className="text-sm font-black text-white leading-tight">
                    Ajoutez vos Caissiers & Attribuez des PINs Secrets
                  </h4>
                </div>
              </div>

              <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/80 space-y-2">
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">🔒</span>
                  <div className="text-slate-200">
                    <b>Protection Totale :</b> Les caissiers n&apos;ont accès qu&apos;à l&apos;encaissement. Vos prix d&apos;achat et marges bénéficiaires leur sont strictement masqués.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">📊</span>
                  <div className="text-slate-200">
                    <b>Historique par Caissier :</b> Chaque vente indique le nom du caissier pour une traçabilité parfaite lors des clôtures journalières.
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <Link
                  href="/settings"
                  onClick={handleClose}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-white border border-emerald-500/40 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Gérer mon Staff & Caissiers dans Paramètres</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
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

export default FirstLoginGuideModal;
