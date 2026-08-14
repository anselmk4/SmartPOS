"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { useSync } from "@/lib/sync/sync-context";
import {
  Store,
  ShoppingCart,
  BookOpen,
  Package,
  TrendingUp,
  MessageCircle,
  WifiOff,
  Cloud,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Smartphone,
  ShieldCheck,
  Zap,
  Users,
  Coins,
  Check,
  ChevronRight,
  Crown,
  PlayCircle,
  DollarSign,
} from "lucide-react";

export default function LandingPage() {
  const { user, tenant, isOwner } = useAuth();
  const { formatMoney } = useSync();

  return (
    <div className="flex-1 bg-white text-slate-900 overflow-x-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950 text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8">
        {/* Ambient background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold mb-6 backdrop-blur">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span>100% Offline-First • Kuettu SMART POS pour le Commerce en Afrique</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            Gérez votre Caisse, vos Stocks et vos{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
              Créances Clients
            </span>{" "}
            même sans Internet.
          </h1>

          {/* Subtitle */}
          <p className="text-slate-300 text-sm sm:text-lg max-w-2xl mx-auto mt-4 sm:mt-6 leading-relaxed">
            <b>Kuettu SMART POS</b> est la solution SaaS tout-en-un pour les boutiques, quincailleries et grossistes : caisse tactile ultra-rapide 0ms, carnet de dettes avec relance WhatsApp en 1 clic, et encaissement Mobile Money.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-8 max-w-md mx-auto">
            <Link
              href="/auth/register"
              className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 transition-all touch-press"
            >
              <span>Créer ma Boutique (Essai Gratuit)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/pos"
              className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/15 flex items-center justify-center gap-2 backdrop-blur transition-all touch-press"
            >
              <PlayCircle className="w-4 h-4 text-blue-400" />
              <span>Tester la Caisse Démo</span>
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto mt-12 pt-8 border-t border-white/10 text-left">
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
              <div className="text-blue-400 font-black text-lg sm:text-xl">0ms</div>
              <div className="text-[11px] text-slate-400">Latence Caisse (Offline)</div>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
              <div className="text-amber-400 font-black text-lg sm:text-xl">1-Clic</div>
              <div className="text-[11px] text-slate-400">Relance WhatsApp Dettes</div>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
              <div className="text-sky-400 font-black text-lg sm:text-xl">M-Pesa & MoMo</div>
              <div className="text-[11px] text-slate-400">Paiements Intégrés RDC</div>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
              <div className="text-indigo-400 font-black text-lg sm:text-xl">100% Cloud</div>
              <div className="text-[11px] text-slate-400">Sauvegarde Sécurisée</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CORE FEATURES SHOWCASE */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Fonctionnalités Clés
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mt-3">
            Tous les outils nécessaires pour piloter votre commerce avec Kuettu SMART POS
          </h2>
          <p className="text-slate-500 text-sm mt-2">
            Conçu pour résoudre les problèmes réels des commerçants : coupures de réseau, gestion des dettes sur cahier et contrôle des caissiers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Caisse POS Tactile */}
          <div className="bg-slate-50 hover:bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg mb-2">
                Caisse & Vente Rapide (Smart POS)
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Ajout au panier en 1 clic avec photos d'articles, recherche instantanée par nom ou code-barre, gestion des tickets de caisse et calcul automatique de la monnaie en FC ou Dollars.
              </p>
            </div>
            <Link
              href="/pos"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 mt-5"
            >
              <span>Accéder à la caisse</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 2: Carnet de Dettes & WhatsApp */}
          <div className="bg-slate-50 hover:bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg mb-2">
                Carnet de Dettes & Modèles WhatsApp
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Remplacez les carnets papier volés ou égarés. Suivez les soldes débiteurs en temps réel et envoyez des messages WhatsApp personnalisés d'un simple clic.
              </p>
            </div>
            <Link
              href="/debts"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 mt-5"
            >
              <span>Voir le carnet de dettes</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 3: Mobile Money Native */}
          <div className="bg-slate-50 hover:bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg mb-2">
                Mobile Money Multi-Opérateurs RDC
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Encaissez vos clients par <b>M-Pesa</b>, <b>Airtel Money</b>, <b>Orange Money</b> ou <b>Afrimoney</b> en Francs Congolais (FC) ou Dollars ($) avec traçabilité distincte.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 mt-5"
            >
              <span>Suivre les flux d'encaissement</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 4: Stocks & Marges Bénéficiaires */}
          <div className="bg-slate-50 hover:bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg mb-2">
                Stocks avec Photos & Marges en Direct
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Photos d'articles pour une caisse intuitive, décompte automatique des articles vendus, alertes de rupture et calcul instantané du bénéfice net généré.
              </p>
            </div>
            <Link
              href="/inventory"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 mt-5"
            >
              <span>Gérer l'inventaire</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 5: Supervision Gérant à Distance */}
          <div className="bg-slate-50 hover:bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Crown className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg mb-2">
                Supervision Propriétaire à Distance
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Suivez depuis chez vous sur votre smartphone le montant d'espèces dans le tiroir-caisse, les dettes accordées et les performances de vos employés.
              </p>
            </div>
            <Link
              href="/owner"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 mt-5"
            >
              <span>Espace Propriétaire</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 6: Architecture 100% Offline-First */}
          <div className="bg-slate-50 hover:bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg mb-2">
                Résilience Hors-Ligne & Sync Cloud
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                La caisse enregistre les transactions en local dans l'appareil (IndexedDB Dexie). Dès que la connexion revient, les deltas sont synchronisés automatiquement.
              </p>
            </div>
            <Link
              href="/settings"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 mt-5"
            >
              <span>Voir le centre de synchro</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS IN 3 STEPS */}
      <section className="bg-slate-900 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              Démarrage Express
            </span>
            <h2 className="text-2xl sm:text-4xl font-black mt-3">
              Comment ça marche ?
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              Opérationnel en 3 étapes simples sans formation technique compliquée.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/80 relative">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black text-lg flex items-center justify-center mb-4">
                1
              </div>
              <h3 className="font-bold text-base text-white mb-2">Inscription en 30s</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Renseignez le nom de votre boutique et votre numéro WhatsApp pour créer immédiatement votre espace Kuettu SMART POS.
              </p>
            </div>

            <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/80 relative">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black text-lg flex items-center justify-center mb-4">
                2
              </div>
              <h3 className="font-bold text-base text-white mb-2">Vendez Hors-Ligne</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Ajoutez vos produits avec photos, encaissez en espèces ou Mobile Money, et enregistrez les dettes même sans réseau internet.
              </p>
            </div>

            <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/80 relative">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black text-lg flex items-center justify-center mb-4">
                3
              </div>
              <h3 className="font-bold text-base text-white mb-2">Pilotez & Relancez</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Relancez vos débiteurs sur WhatsApp en 1 clic et contrôlez votre chiffre d'affaires et vos marges à tout moment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PRICING PREVIEW */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Abonnements Simples
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mt-3">
            Des forfaits transparents payables par Mobile Money RDC
          </h2>
          <p className="text-slate-500 text-sm mt-2">
            Sans engagement • Débit direct par M-Pesa, Airtel Money, Orange Money ou Afrimoney
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Découverte</h3>
              <div className="text-2xl font-black text-slate-900 my-3">0 FC</div>
              <p className="text-xs text-slate-500 mb-4">Idéal pour démarrer votre activité</p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">✓ 1 Caisse tactile rapide</li>
                <li className="flex items-center gap-2">✓ Jusqu'à 100 ventes / mois</li>
                <li className="flex items-center gap-2">✓ Carnet de dettes (max 5 clients)</li>
                <li className="flex items-center gap-2">✓ 100% Fonctionnement Hors-ligne</li>
              </ul>
            </div>
            <Link
              href="/auth/register"
              className="mt-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs text-center transition-all"
            >
              Commencer Gratuitement
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-white rounded-3xl p-6 border-2 border-blue-500 shadow-xl flex flex-col justify-between relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase px-3 py-0.5 rounded-full">
              Recommandé
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Commerçant Pro</h3>
              <div className="text-2xl font-black text-slate-900 my-3">15 000 FC <span className="text-xs font-normal text-slate-500">/ mois</span></div>
              <p className="text-xs text-slate-500 mb-4">Pour les boutiques & demi-grossistes</p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">✓ Ventes & caisse illimitées (sans quota)</li>
                <li className="flex items-center gap-2">✓ Relances WhatsApp intelligentes (3 modèles)</li>
                <li className="flex items-center gap-2">✓ Marges bénéficiaires en temps réel</li>
                <li className="flex items-center gap-2">✓ Supervision sur smartphone & Ticket Z</li>
                <li className="flex items-center gap-2">✓ Sauvegarde Cloud continue</li>
              </ul>
            </div>
            <Link
              href="/billing"
              className="mt-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs text-center shadow-md shadow-blue-600/20 transition-all"
            >
              Choisir le Forfait Pro
            </Link>
          </div>

          {/* Business */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Business Réseau</h3>
              <div className="text-2xl font-black text-slate-900 my-3">45 000 FC <span className="text-xs font-normal text-slate-500">/ mois</span></div>
              <p className="text-xs text-slate-500 mb-4">Pour réseaux multi-magasins & dépôts</p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">✓ Multi-boutiques & Multi-caisses (jusqu'à 10)</li>
                <li className="flex items-center gap-2">✓ Transferts de stock inter-magasins</li>
                <li className="flex items-center gap-2">✓ Export comptable Excel (CSV) & PDF</li>
                <li className="flex items-center gap-2">✓ Rôles caissiers & codes PIN</li>
                <li className="flex items-center gap-2">✓ Support prioritaire WhatsApp dédié</li>
              </ul>
            </div>
            <Link
              href="/billing"
              className="mt-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs text-center transition-all"
            >
              Découvrir Business
            </Link>
          </div>
        </div>
      </section>

      {/* 5. FOOTER & CONVERSION CTA */}
      <footer className="bg-slate-950 text-white pt-14 pb-10 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-10 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base">Kuettu SMART POS</h3>
                <p className="text-xs text-slate-400">Commerce de détail & Architecture Offline-First</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-all"
              >
                Se Connecter
              </Link>
              <Link
                href="/auth/register"
                className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all"
              >
                Créer un Compte
              </Link>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
            <p>© {new Date().getFullYear()} Kuettu SMART POS. Tous droits réservés.</p>
            <div className="flex items-center gap-4">
              <Link href="/pos" className="hover:text-slate-300">Caisse</Link>
              <Link href="/debts" className="hover:text-slate-300">Dettes</Link>
              <Link href="/inventory" className="hover:text-slate-300">Stocks</Link>
              <Link href="/billing" className="hover:text-slate-300">Abonnements</Link>
              <Link href="/owner" className="hover:text-slate-300">Supervision</Link>
              <Link href="/admin/login" className="text-blue-400 font-bold hover:text-blue-300 flex items-center gap-1">
                <span>Portail Admin</span>
                <span>🔒</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
