"use client";

import React from "react";
import Link from "next/link";
import {
  Store,
  ShieldCheck,
  Smartphone,
  MessageCircle,
  CreditCard,
  WifiOff,
  Cloud,
  Printer,
  Barcode,
  HelpCircle,
  Lock,
  ArrowRight,
  Sparkles,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  Heart,
  Globe,
  Layers,
} from "lucide-react";

export default function LandingFooter() {
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800/80 pt-16 pb-10 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-blue-600/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-12">
        {/* Top Newsletter & Brand Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/80 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white p-2 rounded-2xl border border-slate-700 shadow-md">
                <img src="/images/logo.png" alt="Kuettu Global POS" className="h-7 w-auto object-contain" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Kuettu Global POS</h3>
                <p className="text-xs text-blue-400 font-semibold">Le Micro-ERP Caisse & Gestion N°1 en Afrique</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mt-2">
              Solution complète de point de vente, gestion des stocks, carnet de dettes avec relance WhatsApp et encaissement Mobile Money (M-Pesa, Airtel, Orange, Afrimoney). Fonctionne 100% hors-ligne avec synchronisation Cloud.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <Link
              href="/auth/register"
              className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 touch-press"
            >
              <span>Créer mon Compte Gratuit</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/pos"
              className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-2 transition-all touch-press"
            >
              <Store className="w-4 h-4 text-emerald-400" />
              <span>Ouvrir la Caisse</span>
            </Link>
          </div>
        </div>

        {/* 5 Navigation Columns */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 pt-4">
          {/* Column 1: Produit & Caisse */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-blue-400" />
              <span>Caisse & Ventes</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/pos" className="hover:text-blue-400 transition-colors">
                  Caisse Tactile 0ms (Offline)
                </Link>
              </li>
              <li>
                <Link href="/debts" className="hover:text-blue-400 transition-colors">
                  Carnet de Dettes & WhatsApp
                </Link>
              </li>
              <li>
                <Link href="/inventory" className="hover:text-blue-400 transition-colors">
                  Gestion des Stocks & Alertes
                </Link>
              </li>
              <li>
                <Link href="/sales" className="hover:text-blue-400 transition-colors">
                  Historique des Ventes & Reçus
                </Link>
              </li>
              <li>
                <Link href="/owner" className="hover:text-blue-400 transition-colors">
                  Multi-Magasins & Dépôts
                </Link>
              </li>
              <li>
                <Link href="/reports" className="hover:text-blue-400 transition-colors">
                  Rapports & Clôtures Journalières
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Solutions par Métier */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Par Secteur</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/#types" className="hover:text-indigo-400 transition-colors">
                  Alimentations & Supérettes
                </Link>
              </li>
              <li>
                <Link href="/#types" className="hover:text-indigo-400 transition-colors">
                  Restaurants, Bars & Terrasses
                </Link>
              </li>
              <li>
                <Link href="/#types" className="hover:text-indigo-400 transition-colors">
                  Quincailleries & Matériaux
                </Link>
              </li>
              <li>
                <Link href="/#types" className="hover:text-indigo-400 transition-colors">
                  Prêt-à-porter & Boutiques Mode
                </Link>
              </li>
              <li>
                <Link href="/#types" className="hover:text-indigo-400 transition-colors">
                  Dépôts de Boissons & Grossistes
                </Link>
              </li>
              <li>
                <Link href="/#types" className="hover:text-indigo-400 transition-colors">
                  Services d'Impression & Bureautique
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Paiements & Matériels */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
              <span>Paiements & POS</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/billing" className="hover:text-emerald-400 transition-colors">
                  Vodacom M-Pesa RDC
                </Link>
              </li>
              <li>
                <Link href="/billing" className="hover:text-emerald-400 transition-colors">
                  Airtel Money RDC
                </Link>
              </li>
              <li>
                <Link href="/billing" className="hover:text-emerald-400 transition-colors">
                  Orange Money RDC
                </Link>
              </li>
              <li>
                <Link href="/billing" className="hover:text-emerald-400 transition-colors">
                  Afrimoney
                </Link>
              </li>
              <li>
                <Link href="/#hardware" className="hover:text-emerald-400 transition-colors">
                  Imprimantes Thermiques 58/80mm
                </Link>
              </li>
              <li>
                <Link href="/#hardware" className="hover:text-emerald-400 transition-colors">
                  Scanners & Douchettes Code-barres
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Ressources & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Ressources & Aide</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/#faq" className="hover:text-amber-400 transition-colors">
                  Foire Aux Questions (FAQ)
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="hover:text-amber-400 transition-colors">
                  Tarifs & Abonnements
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-amber-400 transition-colors">
                  Guide de Prise en Main
                </Link>
              </li>
              <li>
                <a
                  href="https://wa.me/243810001122"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1"
                >
                  <MessageCircle className="w-3 h-3 text-emerald-400" />
                  <span>Assistance WhatsApp (+243)</span>
                </a>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-blue-400 transition-colors flex items-center gap-1">
                  <Lock className="w-3 h-3 text-blue-400" />
                  <span>Espace Super-Admin</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Sécurité & Entreprise */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Sécurité & Légal</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <span className="text-slate-300 font-semibold block">Chiffrement AES-256</span>
                <span className="text-[10px] text-slate-500">Données Cloud chiffrées</span>
              </li>
              <li>
                <span className="text-slate-300 font-semibold block">Architecture Offline-First</span>
                <span className="text-[10px] text-slate-500">Base locale protégée</span>
              </li>
              <li>
                <div className="pt-2 text-[11px] text-slate-400 space-y-1">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-blue-400" />
                    <span>Kinshasa • Goma • Lubumbashi</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Globe className="w-3 h-3 text-emerald-400" />
                    <span>République Démocratique du Congo</span>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar with Powered by Kuettu Corporation */}
        <div className="pt-8 mt-8 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} Kuettu Global POS. Tous droits réservés.</span>
          </div>

          {/* Essential Powered by Kuettu Corporation badge */}
          <div className="flex items-center gap-2.5 bg-slate-900/90 px-4 py-2 rounded-2xl border border-slate-800 shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-slate-300">
              Powered by{" "}
              <b className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400 font-black">
                Kuettu Corporation
              </b>
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>Version 3.0 Enterprise</span>
            <span>•</span>
            <span>RDC Cloud Node</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
