"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth/auth-context";
import { useSync } from "@/lib/sync/sync-context";
import LandingFooter from "@/components/landing/landing-footer";
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
  ChevronDown,
  Crown,
  PlayCircle,
  DollarSign,
  Building,
  HelpCircle,
  Lock,
  Layers,
  Award,
  RefreshCw,
  Clock,
  Printer,
  ShieldAlert,
  Flame,
  ArrowRightLeft,
  Receipt,
  FileSpreadsheet,
  Barcode,
  Laptop,
  CheckCheck,
} from "lucide-react";

export default function LandingPage() {
  const { user, tenant, isOwner } = useAuth();
  const { formatMoney } = useSync();

  // State for active FAQ accordion items
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "Est-ce que l'application fonctionne vraiment sans connexion Internet ?",
      answer:
        "Oui, à 100% ! Kuettu Global POS est conçu avec une technologie hors-ligne avancée. Vous pouvez encaisser des ventes, enregistrer des nouveaux clients, ajouter des produits et tenir votre carnet de dettes toute la journée sans aucun réseau Internet ni électricité continue. Aucune coupure réseau ne bloque votre caisse.",
    },
    {
      question: "Que se passe-t-il lorsque la connexion Internet revient ?",
      answer:
        "Dès que votre téléphone, tablette ou ordinateur capte la 3G/4G ou le Wi-Fi, Kuettu Global POS synchronise automatiquement et de manière transparente toutes les transactions enregistrées vers nos serveurs Cloud sécurisés. Vos données sont sauvegardées et consultables à distance par le propriétaire sans intervention manuelle.",
    },
    {
      question: "Comment fonctionne la relance WhatsApp des clients endettés ?",
      answer:
        "En un seul clic sur le profil d'un client dans le Carnet de Dettes, Kuettu génère un message WhatsApp pré-rempli avec le nom du client, le montant exact dû en Francs Congolais ou Dollars, ainsi que la date de la dette. Vous pouvez choisir entre 3 modèles : Courtois, Rappel standard ou Urgent.",
    },
    {
      question: "Mes données sont-elles protégées en cas de vol ou de casse de mon appareil ?",
      answer:
        "Oui. Dès qu'une synchronisation Cloud a eu lieu, toutes vos données (produits, ventes, dettes, historique) sont chiffrées et sauvegardées sur nos serveurs. En cas de perte d'appareil, il vous suffit de vous reconnecter sur un autre téléphone ou ordinateur avec votre compte pour tout récupérer instantanément.",
    },
    {
      question: "Puis-je créer des accès pour mes caissiers sans qu'ils voient mes marges d'achat ?",
      answer:
        "Absolument. Vous pouvez créer autant de profils caissiers que nécessaire avec des codes PIN simplifiés à 4 chiffres. Les caissiers ont uniquement accès à l'écran de vente et d'encaissement, sans jamais pouvoir consulter vos prix d'achat, vos marges bénéficiaires ni vos rapports financiers de gérance.",
    },
    {
      question: "Comment fonctionne le mode Multi-Magasins (Plan Business) ?",
      answer:
        "Le forfait Business vous permet de créer et piloter plusieurs boutiques ou dépôts indépendants sous le même compte. Chaque magasin dispose de son stock isolé, de ses propres ventes et de son propre Gérant assigné avec son numéro de téléphone et code PIN. Vous pouvez également effectuer des transferts de stock entre vos dépôts.",
    },
    {
      question: "Quels moyens de paiement Mobile Money sont supportés ?",
      answer:
        "Kuettu Global POS prend en charge tous les opérateurs majeurs de Mobile Money en RDC : M-Pesa (Vodacom), Airtel Money, Orange Money et Afrimoney avec confirmation instantanée sur le téléphone. Les encaissements en Francs Congolais (CDF) et en Dollars ($) sont comptabilisés séparément des espèces.",
    },
    {
      question: "Quels matériels (imprimantes, lecteurs code-barre) sont compatibles ?",
      answer:
        "L'application fonctionne sur n'importe quel smartphone Android / iPhone, tablette, PC ou Mac. Elle est compatible avec les douchettes et lecteurs de code-barres USB/Bluetooth, ainsi que les imprimantes thermiques de reçus 58mm et 80mm.",
    },
  ];

  const businessTypes = [
    {
      title: "Restaurants, Bars & Terrasses",
      subtitle: "Additions proforma, gestion de tables (Hold) & multi-paiements",
      desc: "Gérez les commandes en attente par table, imprimez des additions proforma avant règlement et encaissez en plusieurs modes (Cash + Mobile Money).",
      icon: "🍽️",
      badge: "Nouveau • Spécial Resto",
      gradient: "from-amber-500/10 to-orange-500/10 border-amber-200/80",
    },
    {
      title: "Alimentations & Supérettes",
      subtitle: "Ventes rapides, articles multiples & monnaie instantanée",
      desc: "Encaissez en moins de 3 secondes avec photos d'articles, gestion des devises doubles (CDF / USD) et contrôle strict du tiroir-caisse.",
      icon: "🥫",
      badge: "Très Populaire",
      gradient: "from-emerald-500/10 to-teal-500/10 border-emerald-200/80",
    },
    {
      title: "Quincailleries & Matériaux",
      subtitle: "Carnet de dettes fournisseurs & crédit chantiers",
      desc: "Suivez les livraisons de ciment, fers à béton et outillage. Envoyez des récapitulatifs de créances par WhatsApp aux entrepreneurs en 1 clic.",
      icon: "🔨",
      badge: "Spécial Crédit",
      gradient: "from-blue-500/10 to-indigo-500/10 border-blue-200/80",
    },
    {
      title: "Services d'Impression & Bureautique",
      subtitle: "Facturation de prestations, devis & photocopies",
      desc: "Générez des factures professionnelles pour tirages, impressions grand format, saisie et fournitures de bureau avec remises négociées.",
      icon: "🖨️",
      badge: "Services & Devis",
      gradient: "from-indigo-500/10 to-purple-500/10 border-indigo-200/80",
    },
    {
      title: "Magasins Prêt-à-porter & Mode",
      subtitle: "Catalogue avec photos & suivi des tailles/couleurs",
      desc: "Caisse tactile visuelle avec photos haute définition des vêtements et chaussures pour une expérience client moderne et sans erreur.",
      icon: "👗",
      badge: "Visuel & Photos",
      gradient: "from-purple-500/10 to-pink-500/10 border-purple-200/80",
    },
    {
      title: "Dépôts de Boissons & Grossistes",
      subtitle: "Transferts entre dépôts & gros volumes",
      desc: "Gérez vos casiers, cartons et fûts avec alertes de seuil critique, encaissements Mobile Money et consolidation multi-points de vente.",
      icon: "🍺",
      badge: "Multi-Dépôts",
      gradient: "from-sky-500/10 to-cyan-500/10 border-sky-200/80",
    },
  ];

  return (
    <div className="flex-1 bg-white text-slate-900 overflow-x-hidden scroll-smooth">
      {/* ========================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================= */}
      <section
        id="hero"
        className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950 text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8"
      >
        {/* Ambient background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-blue-500/20 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Col: Headline & CTAs */}
            <div className="lg:col-span-7 text-left space-y-6">
              {/* Top Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-bold backdrop-blur shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>100% Hors-Ligne • Caisse Tactile & Carnet de Dettes WhatsApp</span>
              </div>

              {/* Main Hero Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black tracking-tight leading-tight">
                Pilotez votre Caisse, vos Stocks et vos{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
                  Créances Clients
                </span>{" "}
                même sans Internet.
              </h1>

              {/* Subtitle */}
              <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
                <b>Kuettu Global POS</b> est la solution tout-en-un conçue pour les commerces d'Afrique :
                caisse tactile <b>0ms sans latence</b>, carnet de dettes avec <b>relance WhatsApp en 1 clic</b>,
                supervision <b>multi-magasins</b> et encaissement direct <b>Mobile Money (Vodacom M-Pesa, Airtel Money, Orange Money, Afrimoney)</b>.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <Link
                  href="/auth/register"
                  className="w-full sm:w-auto py-3.5 px-7 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition-all touch-press"
                >
                  <span>Créer mon Commerce Gratuitement</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/pos"
                  className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 flex items-center justify-center gap-2 backdrop-blur transition-all touch-press"
                >
                  <PlayCircle className="w-4 h-4 text-sky-400" />
                  <span>Tester la Caisse Démo</span>
                </Link>
              </div>

              {/* Key Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-white/10">
                <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
                  <div className="text-blue-400 font-black text-xl">0ms</div>
                  <div className="text-xs text-slate-300 font-semibold">Mode Hors-Ligne</div>
                  <div className="text-[10px] text-slate-400">Zéro coupure</div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
                  <div className="text-amber-400 font-black text-xl">1 Clic</div>
                  <div className="text-xs text-slate-300 font-semibold">WhatsApp</div>
                  <div className="text-[10px] text-slate-400">Relance dettes</div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
                  <div className="text-sky-400 font-black text-xl">M-Pesa</div>
                  <div className="text-xs text-slate-300 font-semibold">Mobile Money</div>
                  <div className="text-[10px] text-slate-400">CDF & USD</div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
                  <div className="text-indigo-400 font-black text-xl">Multi-Shop</div>
                  <div className="text-xs text-slate-300 font-semibold">Supervision</div>
                  <div className="text-[10px] text-slate-400">Gérant à distance</div>
                </div>
              </div>
            </div>

            {/* Right Col: Realistic African Store Image Frame */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20 group">
                <img
                  src="/images/og-image.jpg"
                  alt="Commerçante africaine utilisant le logiciel de caisse Kuettu Global POS avec son client"
                  className="w-full h-[380px] sm:h-[450px] object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                {/* Floating Live Badge Top Left */}
                <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md text-white p-2.5 rounded-2xl border border-white/15 flex items-center gap-2 shadow-lg animate-fadeIn">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <div className="text-left">
                    <div className="text-[11px] font-bold text-slate-200">Mode Hors-Ligne Actif</div>
                    <div className="text-[9px] text-emerald-400 font-semibold">Ventes & Encaissements sans coupure</div>
                  </div>
                </div>

                {/* Floating Stat Badge Bottom Right */}
                <div className="absolute bottom-4 right-4 bg-blue-900/90 backdrop-blur-md text-white p-3 rounded-2xl border border-blue-400/30 text-left shadow-xl">
                  <div className="flex items-center gap-1.5 text-xs font-black text-blue-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>+38% Recouvrement</span>
                  </div>
                  <div className="text-[10px] text-slate-300 mt-0.5">Grâce aux rappels WhatsApp automatiques</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. SECTION 1 : OFFLINE & CLOUD (#features) */}
      {/* ========================================================= */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-slate-100">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column : Realistic Image */}
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 group">
              <img
                src="/images/offline-pos.jpg"
                alt="Encaissement tactile sans coupure réseau sur tablette"
                className="w-full h-[340px] sm:h-[400px] object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 right-4 bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-black shadow-md flex items-center gap-1.5">
                <WifiOff className="w-3.5 h-3.5" />
                <span>0ms Latence Locale</span>
              </div>
              <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-sm text-white p-3 rounded-2xl text-xs max-w-xs border border-white/10">
                <p className="font-bold text-emerald-400">Déconnexion Internet ?</p>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Aucun blocage. Le stock se décompte et les tickets s'impriment immédiatement.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column : Features */}
          <div className="lg:col-span-6 order-1 lg:order-2 space-y-4 text-left">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
              Résilience & Continuité d'Activité
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight">
              Vendez sans aucune interruption, même sans Internet ni électricité continue
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              En Afrique, les pannes d'électricité et les coupures 3G/4G ne doivent plus jamais paralyser votre caisse.
              <b> Kuettu Global POS</b> stocke 100% des articles, clients et ventes dans la mémoire locale sécurisée de votre appareil.
            </p>

            <div className="space-y-2.5 pt-2">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/70">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs sm:text-sm text-slate-900">Encaissement Tactile Ultra-Fluide</div>
                  <div className="text-xs text-slate-500">Ajout d'articles au panier instantané, calcul automatique de la monnaie et rendu en CDF ou USD.</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/70">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs sm:text-sm text-slate-900">Sauvegarde Automatique Continue</div>
                  <div className="text-xs text-slate-500">Dès que le réseau revient, toutes les ventes sont sauvegardées automatiquement sur nos serveurs Cloud sécurisés.</div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/pos"
                className="inline-flex items-center gap-2 py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow transition-all"
              >
                <span>Tester la caisse tactile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. SECTION 2 : CARNET DE DETTES & WHATSAPP */}
      {/* ========================================================= */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-slate-100 bg-gradient-to-b from-rose-50/30 to-white">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column : Features */}
          <div className="lg:col-span-6 space-y-4 text-left">
            <span className="text-xs font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-3.5 py-1 rounded-full border border-rose-200">
              Recouvrement Intelligent
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight">
              Carnet de Dettes & Relances WhatsApp en 1 Clic
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Fini les cahiers de crédit tachés, raturés ou égarés qui vous font perdre de l'argent.
              Suivez l'historique complet de chaque débiteur et encaissez vos créances plus rapidement.
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-white border border-rose-100 shadow-sm flex items-start gap-3">
                <MessageCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs sm:text-sm text-slate-900">3 Modèles de Messages Personnalisés</div>
                  <div className="text-xs text-slate-500">Courtois, Rappel d'échéance ou Recouvrement ferme pré-rempli avec le nom et le montant exact.</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-rose-100 shadow-sm flex items-start gap-3">
                <Receipt className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs sm:text-sm text-slate-900">Reçus Numériques & Historique de Remboursement</div>
                  <div className="text-xs text-slate-500">Envoyez les reçus de paiement par WhatsApp pour rassurer vos clients et éviter toute contestation.</div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/debts"
                className="inline-flex items-center gap-2 py-3 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all"
              >
                <span>Explorer le Carnet de Dettes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Column : Realistic Image */}
          <div className="lg:col-span-6">
            <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 group">
              <img
                src="/images/whatsapp-debt.jpg"
                alt="Commerçant effectuant une relance de dette par WhatsApp"
                className="w-full h-[340px] sm:h-[400px] object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-black shadow-md flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp Connecté</span>
              </div>
              <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur-sm text-white p-3 rounded-2xl text-xs max-w-xs border border-white/10 text-left">
                <p className="font-bold text-emerald-400">Message Pré-rempli :</p>
                <p className="text-[10px] text-slate-300 mt-0.5">
                  "Bonjour M. Kasongo, rappel de votre solde de 45 000 FC pour votre achat du 12/08..."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. SECTION 3 : MULTI-BOUTIQUES & SUPERVISION */}
      {/* ========================================================= */}
      <section id="about" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-slate-100">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column : Realistic Image */}
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 group">
              <img
                src="/images/multi-store.jpg"
                alt="Gérant supervisant son réseau de boutiques et dépôts"
                className="w-full h-[340px] sm:h-[400px] object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 right-4 bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-black shadow-md flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" />
                <span>Multi-Boutiques & Dépôts</span>
              </div>
              <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-sm text-white p-3 rounded-2xl text-xs max-w-xs border border-white/10 text-left">
                <p className="font-bold text-indigo-300">Supervision en Temps Réel :</p>
                <p className="text-[10px] text-slate-300 mt-0.5">
                  Consolidation du chiffre d'affaires et contrôle des transferts de stock entre vos dépôts.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column : Features */}
          <div className="lg:col-span-6 order-1 lg:order-2 space-y-4 text-left">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3.5 py-1 rounded-full border border-indigo-200">
              Plan Business Multi-Magasins
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight">
              Pilotez vos Boutiques & Dépôts à Distance sur Votre Smartphone
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Vous possédez plusieurs points de vente ou des dépôts de distribution ?
              Créez jusqu'à 10 boutiques sous le même compte avec des stocks étanches et des gérants dédiés.
            </p>

            <div className="space-y-2.5 pt-2">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/70">
                <ArrowRightLeft className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs sm:text-sm text-slate-900">Transferts de Stock Traçables</div>
                  <div className="text-xs text-slate-500">Déplacez des cartons ou marchandises d'un dépôt central vers vos magasins avec traçabilité complète.</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/70">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs sm:text-sm text-slate-900">Protection Anti-Fraude & Marges Masquées</div>
                  <div className="text-xs text-slate-500">Les caissiers n'ont pas accès à vos bénéfices réels ni à vos prix d'achat fournisseurs.</div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/owner"
                className="inline-flex items-center gap-2 py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all"
              >
                <span>Accéder à l'Espace Gérant</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. SECTION 4 : MOBILE MONEY (#mobile-money) */}
      {/* ========================================================= */}
      <section id="mobile-money" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-slate-100 bg-gradient-to-b from-sky-50/40 to-white">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column : Features */}
          <div className="lg:col-span-6 space-y-4 text-left">
            <span className="text-xs font-black uppercase tracking-wider text-sky-700 bg-sky-50 px-3.5 py-1 rounded-full border border-sky-200">
              Paiements Mobile Money Intégrés
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight">
              Paiements Mobile Money & Double Devise CDF / USD
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Acceptez les paiements par **Vodacom M-Pesa**, **Airtel Money**, **Orange Money** et **Afrimoney** en direct à la caisse et pour vos abonnements.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-white rounded-2xl border border-sky-100 shadow-sm">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span>Francs & Dollars</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Gestion séparée des espèces en CDF et en Dollars avec taux paramétrable.
                </p>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-sky-100 shadow-sm">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-sky-600" />
                  <span>Push USSD Mobile Direct</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Débit direct et confirmation instantanée sur le téléphone du client.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/billing"
                className="inline-flex items-center gap-2 py-3 px-5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition-all"
              >
                <span>Découvrir les forfaits Mobile Money</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Column : Realistic Image */}
          <div className="lg:col-span-6">
            <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 group">
              <img
                src="/images/mobile-money.jpg"
                alt="Paiement Mobile Money M-Pesa au comptoir d'une boutique"
                className="w-full h-[340px] sm:h-[400px] object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4 bg-sky-600 text-white px-3 py-1 rounded-full text-xs font-black shadow-md flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" />
                <span>M-Pesa • Airtel • Orange</span>
              </div>
              <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur-sm text-white p-3 rounded-2xl text-xs max-w-xs border border-white/10 text-left">
                <p className="font-bold text-sky-300">Rapprochement de Caisse :</p>
                <p className="text-[10px] text-slate-300 mt-0.5">
                  Clôture journalière (Ticket Z) séparant le cash du tiroir et les soldes Mobile Money.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. TYPES D'ENTREPRISES SECTION (#types) */}
      {/* ========================================================= */}
      <section id="types" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3.5 py-1 rounded-full border border-indigo-200">
              Adapté à Votre Activité
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mt-3">
              Une solution taillée sur mesure pour tous les secteurs de commerce
            </h2>
            <p className="text-slate-500 text-sm sm:text-base mt-2">
              Que vous gériez une boutique de quartier, un dépôt de gros ou une quincaillerie, Kuettu s'adapte à votre mode de fonctionnement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businessTypes.map((b) => (
              <div
                key={b.title}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl p-2.5 bg-slate-100 rounded-2xl">{b.icon}</span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {b.badge}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-slate-900 text-base mb-1">{b.title}</h3>
                  <div className="text-xs font-semibold text-indigo-600 mb-2.5">{b.subtitle}</div>
                  <p className="text-xs text-slate-600 leading-relaxed">{b.desc}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Prêt à l'emploi</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. SECTION TARIFS & LES 4 PLANS OFFICIELS (#pricing) */}
      {/* ========================================================= */}
      <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-3.5 py-1 rounded-full border border-blue-200">
            Forfaits & Tarifs Transparents
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mt-3">
            Des formules adaptées à chaque taille de commerce
          </h2>
          <p className="text-slate-500 text-sm sm:text-base mt-2">
            Payez simplement en Francs Congolais ou Dollars via Vodacom M-Pesa, Airtel Money, Orange Money ou Afrimoney.
          </p>
        </div>

        {/* 4 Official Plans Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {/* Plan 1: FREE (Découverte) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                Pour démarrer
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-3">Découverte</h3>
              <div className="mt-3 mb-5">
                <span className="text-3xl font-black text-slate-900">0 FC</span>
                <span className="text-xs text-slate-500 ml-1">Gratuit à vie</span>
              </div>
              <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                Idéal pour tester la caisse tactile locale sans aucun frais.
              </p>

              <ul className="space-y-2.5 text-xs text-slate-700">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>1 Caisse tactile locale</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>100 ventes par mois</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Carnet de dettes (max 10 clients)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Fonctionne 100% hors-ligne</span>
                </li>
              </ul>
            </div>

            <Link
              href="/auth/register"
              className="mt-6 w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs text-center transition-colors block"
            >
              Créer un Compte Gratuit
            </Link>
          </div>

          {/* Plan 2: BASIC (Commerçant Basic) */}
          <div className="bg-white rounded-3xl p-6 border border-emerald-300 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Accessible & Efficace
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-3">Commerçant Basic</h3>
              <div className="mt-3 mb-5">
                <span className="text-3xl font-black text-slate-900">15 000 FC</span>
                <span className="text-xs text-slate-500 ml-1">/ mois (~5,50 $)</span>
              </div>
              <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                Parfait pour les boutiques de quartier avec relances de dettes.
              </p>

              <ul className="space-y-2.5 text-xs text-slate-700">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>1 000 ventes par mois</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Jusqu'à 10 Caisses & Caissiers</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Carnet de dettes (100 clients)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Relances WhatsApp en 1 clic</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Sauvegarde Cloud automatique</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Clôture quotidienne (Ticket Z)</span>
                </li>
              </ul>
            </div>

            <Link
              href="/auth/register"
              className="mt-6 w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs text-center shadow transition-colors block"
            >
              Choisir le Forfait Basic
            </Link>
          </div>

          {/* Plan 3: PRO (Commerçant Pro - Star) */}
          <div className="bg-gradient-to-b from-blue-900 via-slate-900 to-blue-950 text-white rounded-3xl p-6 border-2 border-blue-500 shadow-2xl flex flex-col justify-between relative overflow-hidden transform lg:-translate-y-2">
            <div className="absolute top-3.5 right-3.5 bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow">
              Plus Populaire ⭐
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Performance Maximale
              </span>
              <h3 className="text-xl font-black text-white mt-3">Commerçant Pro</h3>
              <div className="mt-3 mb-5">
                <span className="text-3xl font-black text-white">30 000 FC</span>
                <span className="text-xs text-blue-300 ml-1">/ mois (~11 $)</span>
              </div>
              <p className="text-xs text-slate-300 mb-5 leading-relaxed">
                Le choix N°1 pour éliminer les pertes, marges nettes et dettes illimitées.
              </p>

              <ul className="space-y-2.5 text-xs text-slate-200">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><b>Ventes & Caisses illimitées</b></span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><b>Carnet de dettes illimité</b></span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Relances WhatsApp automatiques</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Calcul des marges & bénéfices net</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Supervision gérant à distance</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Sauvegarde Cloud continue</span>
                </li>
              </ul>
            </div>

            <Link
              href="/auth/register"
              className="mt-6 w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs text-center shadow-lg shadow-blue-600/40 transition-all block"
            >
              Essai Gratuit 14 Jours
            </Link>
          </div>

          {/* Plan 4: BUSINESS (Multi-Magasins) */}
          <div className="bg-white rounded-3xl p-6 border border-indigo-300 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Réseaux & Dépôts
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-3">Business Multi-Magasins</h3>
              <div className="mt-3 mb-5">
                <span className="text-3xl font-black text-slate-900">100 000 FC</span>
                <span className="text-xs text-slate-500 ml-1">/ mois (~35 $)</span>
              </div>
              <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                Multi-boutiques, transferts entre dépôts et gérants isolés.
              </p>

              <ul className="space-y-2.5 text-xs text-slate-700">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span><b>Jusqu'à 10 Boutiques & Dépôts</b></span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>Transferts de stock inter-magasins</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>Gérants de boutiques dédiés</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>Export comptable Excel (CSV) & PDF</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>Consolidation réseau en temps réel</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>Support prioritaire VIP WhatsApp</span>
                </li>
              </ul>
            </div>

            <Link
              href="/auth/register"
              className="mt-6 w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs text-center shadow transition-all block"
            >
              Choisir le Plan Business
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 8. MATÉRIEL COMPATIBLE (#hardware) */}
      {/* ========================================================= */}
      <section id="hardware" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/20">
              Prêt Pour Votre Matériel
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white mt-3">
              100% Compatible avec vos Équipements de Caisse
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2">
              Pas besoin d'acheter de matériel propriétaire coûteux. Utilisez ce que vous possédez déjà.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-800/60 p-6 rounded-3xl border border-slate-700/60 text-left space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Smartphones & Tablettes</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Fonctionne sur Android, iPhone, iPad ou tablettes tactiles bon marché sans configuration complexe.
              </p>
            </div>

            <div className="bg-slate-800/60 p-6 rounded-3xl border border-slate-700/60 text-left space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Printer className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Imprimantes Thermiques</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Impression directe de tickets de caisse 58mm et 80mm via Bluetooth, Wi-Fi ou câble USB.
              </p>
            </div>

            <div className="bg-slate-800/60 p-6 rounded-3xl border border-slate-700/60 text-left space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Barcode className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Lecteurs Code-Barres</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Compatible avec les douchettes USB et scanners Bluetooth pour scanner vos articles en 1 seconde.
              </p>
            </div>

            <div className="bg-slate-800/60 p-6 rounded-3xl border border-slate-700/60 text-left space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Laptop className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">PC & Ordinateurs Portables</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Utilisable sur navigateur Chrome/Edge sous Windows, macOS ou Linux avec raccourcis clavier caisse.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 9. FAQ ACCORDION SECTION (#faq) */}
      {/* ========================================================= */}
      <section id="faq" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-3.5 py-1 rounded-full border border-blue-200">
            Foire Aux Questions
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mt-3">
            Questions Fréquentes sur Kuettu Global POS
          </h2>
          <p className="text-slate-500 text-sm sm:text-base mt-2">
            Tout ce que vous devez savoir pour démarrer sereinement votre commerce.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="border border-slate-200 rounded-2xl overflow-hidden transition-all bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full p-4 sm:p-5 text-left font-bold text-sm sm:text-base text-slate-900 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-blue-600" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 10. BOTTOM FINAL CTA BANNER */}
      {/* ========================================================= */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Essai Gratuit 14 Jours Sans Engagement</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black max-w-2xl mx-auto leading-tight">
            Transformez la Gestion de Votre Commerce Dès Aujourd'hui
          </h2>

          <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Rejoignez les commerçants, supermarchés, quincailleries et dépôts d'Afrique qui éliminent les pertes de caisse et récupèrent leurs dettes avec Kuettu Global POS.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/auth/register"
              className="w-full sm:w-auto py-3.5 px-8 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm shadow-xl shadow-blue-600/30 transition-all touch-press flex items-center justify-center gap-2"
            >
              <span>Créer ma Boutique en 30s</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/login"
              className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-all touch-press"
            >
              <span>Se Connecter au Terminal</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 11. MODERN LANDING FOOTER (POWERED BY KUETTU CORPORATION) */}
      {/* ========================================================= */}
      <LandingFooter />
    </div>
  );
}
