"use client";

import React, { useState } from "react";
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
        "Oui, à 100% ! Kuettu SMART POS est conçu avec une architecture Offline-First (Dexie IndexedDB). Vous pouvez encaisser des ventes, enregistrer des nouveaux clients, ajouter des produits et tenir votre carnet de dettes toute la journée sans aucun réseau Internet ni électricité continue. Aucune coupure réseau ne bloque votre caisse.",
    },
    {
      question: "Que se passe-t-il lorsque la connexion Internet revient ?",
      answer:
        "Dès que votre téléphone, tablette ou ordinateur capte la 3G/4G ou le Wi-Fi, Kuettu SMART POS synchronise automatiquement toutes les transactions enregistrées en local vers notre Cloud sécurisé. Vos données sont sauvegardées et consultables à distance par le propriétaire sans intervention manuelle.",
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
        "Kuettu SMART POS prend en charge tous les opérateurs majeurs de Mobile Money en RDC : M-Pesa (Vodacom), Airtel Money, Orange Money et Afrimoney. Les encaissements en Francs Congolais (CDF) et en Dollars ($) sont comptabilisés séparément des espèces.",
    },
    {
      question: "Quels matériels (imprimantes, lecteurs code-barre) sont compatibles ?",
      answer:
        "L'application fonctionne sur n'importe quel smartphone Android / iPhone, tablette, PC ou Mac. Elle est compatible avec les douchettes et lecteurs de code-barres USB/Bluetooth, ainsi que les imprimantes thermiques de reçus 58mm et 80mm.",
    },
  ];

  const businessTypes = [
    {
      title: "Alimentations & Supérettes",
      subtitle: "Ventes rapides, articles multiples & monnaie instantanée",
      desc: "Encaissez en moins de 3 secondes avec photos d'articles, gestion des devises doubles (CDF / USD) et contrôle strict du tiroir-caisse.",
      icon: "🥫",
      badge: "Très Populaire",
      gradient: "from-amber-500/10 to-orange-500/10 border-amber-200/80",
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
      title: "Dépôts de Boissons & Grossistes",
      subtitle: "Transferts entre dépôts & gros volumes",
      desc: "Gérez vos casiers, cartons et fûts avec alertes de seuil critique, encaissements Mobile Money et consolidation multi-boutiques.",
      icon: "🍺",
      badge: "Multi-Dépôts",
      gradient: "from-emerald-500/10 to-teal-500/10 border-emerald-200/80",
    },
    {
      title: "Boutiques Prêt-à-porter & Mode",
      subtitle: "Catalogue avec photos & suivi des tailles/couleurs",
      desc: "Caisse tactile visuelle avec photos haute définition des vêtements et chaussures pour une expérience client moderne et sans erreur.",
      icon: "👗",
      badge: "Visuel & Photos",
      gradient: "from-purple-500/10 to-pink-500/10 border-purple-200/80",
    },
    {
      title: "Pharmacies & Cosmétiques",
      subtitle: "Gestion précise des stocks & alerte péremption",
      desc: "Recherche instantanée de médicaments ou produits de beauté par code-barre ou nom avec suivi strict des quantités restantes.",
      icon: "💊",
      badge: "Stock Strict",
      gradient: "from-rose-500/10 to-red-500/10 border-rose-200/80",
    },
    {
      title: "Kiosques & Multi-Services",
      subtitle: "Encaissement Mobile Money & cartes prépayées",
      desc: "Idéal pour les points de vente mixtes combinant vente de marchandises au détail et encaissements M-Pesa, Airtel Money et Orange Money.",
      icon: "📱",
      badge: "Mobile Money",
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
        className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950 text-white pt-14 pb-24 px-4 sm:px-6 lg:px-8"
      >
        {/* Ambient background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[320px] bg-blue-500/20 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-[350px] h-[200px] bg-indigo-500/15 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 text-center">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-bold mb-6 backdrop-blur shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>100% Hors-Ligne • Caisse Tactile & Carnet de Dettes WhatsApp pour l'Afrique</span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            Pilotez votre Caisse, vos Stocks et vos{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
              Créances Clients
            </span>{" "}
            même sans Internet.
          </h1>

          {/* Subtitle */}
          <p className="text-slate-300 text-sm sm:text-lg max-w-3xl mx-auto mt-5 sm:mt-6 leading-relaxed">
            <b>Kuettu SMART POS</b> est la solution tout-en-un conçue pour les commerces africains :
            caisse tactile <b>0ms sans latence</b>, carnet de dettes avec <b>relance WhatsApp en 1 clic</b>,
            gestion <b>multi-magasins</b> et encaissement <b>Mobile Money (M-Pesa, Airtel, Orange, Afrimoney)</b>.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 mt-8 max-w-lg mx-auto">
            <Link
              href="/auth/register"
              className="w-full sm:w-auto py-3.5 px-7 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition-all touch-press"
            >
              <span>Créer ma Boutique (Essai Gratuit)</span>
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto mt-14 pt-8 border-t border-white/10 text-left">
            <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
              <div className="text-blue-400 font-black text-xl sm:text-2xl">0ms</div>
              <div className="text-xs text-slate-300 font-semibold mt-0.5">Latence Caisse</div>
              <div className="text-[10px] text-slate-400">100% Fonctionnel Offline</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
              <div className="text-amber-400 font-black text-xl sm:text-2xl">1 Clic</div>
              <div className="text-xs text-slate-300 font-semibold mt-0.5">Relance WhatsApp</div>
              <div className="text-[10px] text-slate-400">Récupération des dettes</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
              <div className="text-sky-400 font-black text-xl sm:text-2xl">M-Pesa & MoMo</div>
              <div className="text-xs text-slate-300 font-semibold mt-0.5">Paiements RDC</div>
              <div className="text-[10px] text-slate-400">CDF & USD séparés</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
              <div className="text-indigo-400 font-black text-xl sm:text-2xl">Multi-Boutiques</div>
              <div className="text-xs text-slate-300 font-semibold mt-0.5">Gérants Dédiés</div>
              <div className="text-[10px] text-slate-400">Réseau & dépôts isolés</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. CORE FEATURES SECTION (#features) */}
      {/* ========================================================= */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-3.5 py-1 rounded-full border border-blue-200">
            Fonctionnalités Majeures
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mt-3">
            Tous les outils nécessaires pour gérer votre commerce sans faille
          </h2>
          <p className="text-slate-500 text-sm sm:text-base mt-2">
            Résolvez les défis réels du quotidien : instabilité du réseau internet, pertes sur cahier de crédit et fraudes de caisse.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1: Caisse & Vente Tactile */}
          <div className="bg-slate-50 hover:bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg mb-2">
                Caisse Tactile 0ms Ultra-Rapide
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Ajout d'articles au panier en 1 clic avec photos, scan rapide par code-barre, sélection de client, et calcul automatique de la monnaie rendue en Francs Congolais ou Dollars.
              </p>
            </div>
            <Link
              href="/pos"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 mt-5 pt-3 border-t border-slate-200/60"
            >
              <span>Accéder à la caisse</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Feature 2: Carnet de Dettes & WhatsApp */}
          <div className="bg-slate-50 hover:bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg mb-2">
                Carnet de Dettes & Relance WhatsApp
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Fini les cahiers tachés ou égarés. Suivez les dettes de chaque client en temps réel et envoyez des messages WhatsApp personnalisés d'un seul clic avec le solde exact dû.
              </p>
            </div>
            <Link
              href="/debts"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 mt-5 pt-3 border-t border-slate-200/60"
            >
              <span>Voir le carnet de dettes</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Feature 3: Mobile Money RDC */}
          <div className="bg-slate-50 hover:bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg mb-2">
                Mobile Money Multi-Opérateurs RDC
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Encaissez sans confusion par <b>M-Pesa</b>, <b>Airtel Money</b>, <b>Orange Money</b> ou <b>Afrimoney</b>. Suivez séparément les flux sur téléphone et l'argent liquide du tiroir.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 mt-5 pt-3 border-t border-slate-200/60"
            >
              <span>Suivre les encaissements</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Feature 4: Stocks & Marges Brutes */}
          <div className="bg-slate-50 hover:bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg mb-2">
                Stocks avec Photos & Marges en Direct
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Photos haute qualité pour chaque article, décompte automatique à la vente, alertes de rupture paramétrables et calcul immédiat de la marge brute réalisée.
              </p>
            </div>
            <Link
              href="/inventory"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 mt-5 pt-3 border-t border-slate-200/60"
            >
              <span>Gérer les stocks</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Feature 5: Multi-Magasins & Gérants Dédiés */}
          <div className="bg-slate-50 hover:bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Building className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg mb-2">
                Réseau Multi-Boutiques & Dépôts
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Créez plusieurs points de vente sous un même compte (Business). Chaque boutique dispose de son stock isolé, de ses ventes et d'un gérant dédié avec code PIN sécurisé.
              </p>
            </div>
            <Link
              href="/owner"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 mt-5 pt-3 border-t border-slate-200/60"
            >
              <span>Espace Propriétaire</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Feature 6: Architecture 100% Offline-First & Synchro */}
          <div className="bg-slate-50 hover:bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg mb-2">
                Résilience Hors-Ligne & Sauvegarde Cloud
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Toutes vos données restent disponibles sur l'appareil. Dès qu'un accès réseau est détecté, la synchronisation Cloud sauvegarde tout en arrière-plan sans bloquer la caisse.
              </p>
            </div>
            <Link
              href="/settings"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 mt-5 pt-3 border-t border-slate-200/60"
            >
              <span>Centre de synchronisation</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. TYPES D'ENTREPRISES SECTION (#types) */}
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
      {/* 4. À PROPOS DE KUETTU (#about) */}
      {/* ========================================================= */}
      <section id="about" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-3.5 py-1 rounded-full border border-blue-200">
              À Propos de Kuettu SMART POS
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mt-3 leading-tight">
              Conçu en Afrique, pour surmonter les réalités du commerce local
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-4 leading-relaxed">
              La plupart des logiciels de caisse occidentaux exigent une connexion Internet permanente, des abonnements par carte bancaire internationale et des ordinateurs coûteux.
            </p>
            <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed">
              <b>Kuettu SMART POS</b> a été pensé dès le premier jour pour l'Afrique :
              résistance totale aux coupures d'électricité et de réseau, paiement des abonnements par <b>Mobile Money</b>, et simplicité extrême pour que tout employé ou caissier soit opérationnel en 2 minutes.
            </p>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>Zéro Coupure</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Continuez à vendre même en cas de panne réseau ou électrique.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Anti-Fraude</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Les caissiers n'ont pas accès aux marges ni aux prix d'achat.
                </p>
              </div>
            </div>
          </div>

          {/* Visual Showcase Card */}
          <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/15 blur-3xl rounded-full" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2">
                <Store className="w-6 h-6 text-blue-400" />
                <span className="font-black text-lg">Kuettu Smart Architecture</span>
              </div>

              <div className="space-y-3 pt-2">
                <div className="p-3 bg-white/10 rounded-2xl border border-white/10 flex items-start gap-3">
                  <span className="text-xl">⚡</span>
                  <div>
                    <div className="font-bold text-xs">Moteur Local-First (IndexedDB)</div>
                    <div className="text-[11px] text-slate-300">Temps de réponse instantané & autonomie totale.</div>
                  </div>
                </div>

                <div className="p-3 bg-white/10 rounded-2xl border border-white/10 flex items-start gap-3">
                  <span className="text-xl">🔄</span>
                  <div>
                    <div className="font-bold text-xs">Synchronisation Bidirectionnelle</div>
                    <div className="text-[11px] text-slate-300">File d'attente intelligente dès la reconnexion.</div>
                  </div>
                </div>

                <div className="p-3 bg-white/10 rounded-2xl border border-white/10 flex items-start gap-3">
                  <span className="text-xl">📱</span>
                  <div>
                    <div className="font-bold text-xs">Multi-Support Smartphone / PC</div>
                    <div className="text-[11px] text-slate-300">Fonctionne sur n'importe quel écran tactile ou clavier.</div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/auth/register"
                  className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs text-center flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Créer mon compte maintenant</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. PRICING SECTION (#pricing) */}
      {/* ========================================================= */}
      <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-3.5 py-1 rounded-full border border-blue-200">
              Forfaits & Tarifs Clairs
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mt-3">
              Des abonnements accessibles payables par Mobile Money
            </h2>
            <p className="text-slate-500 text-sm mt-2">
              Sans carte bancaire • Sans engagement • Règlement direct par M-Pesa, Airtel, Orange ou Afrimoney
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Découverte</h3>
                <div className="text-2xl font-black text-slate-900 my-3">0 FC <span className="text-xs font-normal text-slate-500">/ mois</span></div>
                <p className="text-xs text-slate-500 mb-4">Pour tester et démarrer votre activité</p>
                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-center gap-2">✓ 1 Caisse tactile ultra-rapide</li>
                  <li className="flex items-center gap-2">✓ Jusqu'à 100 ventes par mois</li>
                  <li className="flex items-center gap-2">✓ Carnet de dettes (jusqu'à 5 clients)</li>
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
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase px-3 py-0.5 rounded-full shadow-xs">
                Le Plus Choisi
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Commerçant Pro</h3>
                <div className="text-2xl font-black text-slate-900 my-3">
                  15 000 FC <span className="text-xs font-normal text-slate-500">/ mois (~5$)</span>
                </div>
                <p className="text-xs text-slate-500 mb-4">Pour les boutiques & demi-grossistes</p>
                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-center gap-2">✓ Ventes & caisse illimitées sans quota</li>
                  <li className="flex items-center gap-2">✓ Relances WhatsApp illimitées (3 modèles)</li>
                  <li className="flex items-center gap-2">✓ Marges bénéficiaires en temps réel</li>
                  <li className="flex items-center gap-2">✓ Clôture de Caisse & Ticket Z journalier</li>
                  <li className="flex items-center gap-2">✓ Sauvegarde Cloud chiffrée continue</li>
                </ul>
              </div>
              <Link
                href="/billing"
                className="mt-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs text-center shadow-md shadow-blue-600/25 transition-all"
              >
                Choisir Forfait Pro
              </Link>
            </div>

            {/* Business */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Business Réseau</h3>
                <div className="text-2xl font-black text-slate-900 my-3">
                  45 000 FC <span className="text-xs font-normal text-slate-500">/ mois (~15$)</span>
                </div>
                <p className="text-xs text-slate-500 mb-4">Pour réseaux multi-magasins & dépôts</p>
                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-center gap-2">✓ Multi-Boutiques & Dépôts isolés</li>
                  <li className="flex items-center gap-2">✓ Gérants dédiés par boutique (PIN caisse)</li>
                  <li className="flex items-center gap-2">✓ Transferts de stock inter-magasins</li>
                  <li className="flex items-center gap-2">✓ Export comptable Excel (CSV) & PDF</li>
                  <li className="flex items-center gap-2">✓ Support prioritaire WhatsApp 7j/7</li>
                </ul>
              </div>
              <Link
                href="/billing"
                className="mt-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs text-center transition-all"
              >
                Découvrir Business
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. FAQ SECTION (#faq) */}
      {/* ========================================================= */}
      <section id="faq" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3.5 py-1 rounded-full border border-indigo-200">
            Foire Aux Questions
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mt-3">
            Questions Fréquemment Posées
          </h2>
          <p className="text-slate-500 text-sm mt-2">
            Tout ce que vous devez savoir pour démarrer sereinement avec Kuettu SMART POS.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={faq.question}
                className={`rounded-2xl border transition-all ${
                  isOpen
                    ? "bg-white border-blue-300 shadow-md ring-1 ring-blue-500/10"
                    : "bg-slate-50/80 hover:bg-white border-slate-200/80"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4"
                >
                  <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-blue-600" : "text-slate-400"
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. FOOTER */}
      {/* ========================================================= */}
      <footer className="bg-slate-950 text-white pt-14 pb-10 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-10 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base">Kuettu SMART POS</h3>
                <p className="text-xs text-slate-400">Commerce de détail & Caisse Offline-First</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-all"
              >
                Connexion PIN
              </Link>
              <Link
                href="/auth/register"
                className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all"
              >
                Créer Boutique
              </Link>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
            <p>© {new Date().getFullYear()} Kuettu SMART POS. Tous droits réservés.</p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/#features" className="hover:text-slate-300">Fonctionnalités</Link>
              <Link href="/#types" className="hover:text-slate-300">Types d'entreprises</Link>
              <Link href="/#pricing" className="hover:text-slate-300">Tarifs</Link>
              <Link href="/#about" className="hover:text-slate-300">À propos</Link>
              <Link href="/#faq" className="hover:text-slate-300">FAQ</Link>
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
