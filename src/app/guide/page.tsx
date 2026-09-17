"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Store,
  ShieldCheck,
  Smartphone,
  CreditCard,
  WifiOff,
  Cloud,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Lock,
  Layers,
  Award,
  RefreshCw,
  Clock,
  Printer,
  Barcode,
  Receipt,
  MessageCircle,
  Check,
  ChevronRight,
  Zap,
  Users,
  Building,
  ShoppingBag,
  Gift,
  PhoneCall,
  DollarSign,
  Search,
  ExternalLink,
  BookOpen,
  CheckCheck,
  AlertTriangle,
  Play,
} from "lucide-react";
import LandingFooter from "@/components/landing/landing-footer";

interface GuideStep {
  id: string;
  stepNumber: string;
  title: string;
  shortDesc: string;
  badge: string;
  badgeColor: string;
  icon: any;
  sections: {
    title: string;
    description: string;
    tips?: string[];
    details?: { label: string; value: string }[];
    visualType?: "steps" | "security" | "pos" | "whatsapp" | "payment" | "affiliate";
  }[];
}

const GUIDE_STEPS: GuideStep[] = [
  {
    id: "step-1",
    stepNumber: "01",
    title: "Inscription & Création du Commerce",
    shortDesc: "Créez votre compte en 2 minutes, configurez vos devises et votre type d'activité.",
    badge: "Démarrage Rapide",
    badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Store,
    sections: [
      {
        title: "1. Formulaire d'inscription simplifié",
        description:
          "Renseignez votre nom, numéro de téléphone (WhatsApp), adresse email et mot de passe de gérant. Vous recevez un accès immédiat sans avoir besoin de carte bancaire.",
        tips: [
          "Utilisez un numéro WhatsApp valide pour pouvoir recevoir les notifications système et tester les relances de dettes.",
          "Votre mot de passe principal sert uniquement pour la connexion initiale et l'administration.",
        ],
        details: [
          { label: "Temps requis", value: "Moins de 2 minutes" },
          { label: "Documents requis", value: "Aucun document bancaire requis" },
          { label: "Essai gratuit", value: "Accès immédiat à toutes les fonctions" },
        ],
        visualType: "steps",
      },
      {
        title: "2. Choix de votre devise principale & secondaire",
        description:
          "Kuettu Global POS est spécialement calibré pour les économies multi-devises africaines. Définissez votre devise de référence (Franc Congolais CDF, Franc CFA XOF/XAF, Dollar USD) et configurez votre taux de change de caisse.",
        tips: [
          "Le taux de change peut être ajusté à tout moment depuis les Paramètres sans impacter les ventes passées.",
          "La caisse calcule automatiquement le rendu de monnaie dans la devise de votre choix.",
        ],
      },
      {
        title: "3. Sélection du type de commerce",
        description:
          "Choisissez votre secteur d'activité (Alimentation, Supérette, Quincaillerie, Restaurant/Bar, Prêt-à-porter, Service bureautique, Dépôt de boissons) pour pré-configurer les modules adaptés (gestion des tables, unités de mesure, formats de reçu).",
      },
    ],
  },
  {
    id: "step-2",
    stepNumber: "02",
    title: "Sécurité de Caisse & Code PIN Caissier",
    shortDesc: "Protégez vos marges et permettez à vos employés de se relayer en 1 seconde via code PIN.",
    badge: "Anti-Vol & Confidentialité",
    badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: Lock,
    sections: [
      {
        title: "1. Attribution des Codes PIN 4 Chiffres",
        description:
          "Chaque employé (Caissier, Serveur, Vendeur) dispose d'un code PIN personnel à 4 chiffres. Ils peuvent ainsi verrouiller et déverrouiller la caisse instantanément sans ressaisir d'email ni de mot de passe complexe.",
        tips: [
          "Le verrouillage rapide se fait d'un simple clic sur le cadenas en haut à droite de l'écran.",
          "Le nom du caissier actif s'imprime automatiquement sur chaque reçu de vente.",
        ],
        visualType: "security",
      },
      {
        title: "2. Masquage strict des marges et bénéfices",
        description:
          "Les profils Caissiers ne voient JAMAIS vos prix d'achat, vos marges bénéficiaires ni vos rapports financiers de gérance. Ils ont uniquement accès au catalogue de vente, à l'encaissement et à la clôture de leur propre tiroir-caisse.",
        details: [
          { label: "Rôle Gérant / Admin", value: "Accès total (Achats, Marges, Rapports, Clôture Z)" },
          { label: "Rôle Caissier", value: "Vente & Encaissement uniquement, zéros marges visibles" },
          { label: "Historique", value: "Traçabilité intégrale de chaque vente par caissier" },
        ],
      },
    ],
  },
  {
    id: "step-3",
    stepNumber: "03",
    title: "Catalogue Produits & Gestion des Stocks",
    shortDesc: "Ajoutez vos articles avec photos, code-barres, unités de vente et alertes de seuil.",
    badge: "Inventaire Intelligent",
    badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
    icon: Layers,
    sections: [
      {
        title: "1. Ajout express d'articles",
        description:
          "Créez vos produits en saisissant le nom, la catégorie, le prix d'achat, le prix de vente et la quantité en stock. Vous pouvez attribuer une couleur ou une photo pour une identification visuelle instantanée en caisse.",
        tips: [
          "Compatible avec les douchettes et scanners de code-barres USB ou Bluetooth.",
          "Possibilité de définir un seuil d'alerte pour être averti avant la rupture de stock.",
        ],
      },
      {
        title: "2. Suivi des mouvements & Alertes de réassort",
        description:
          "Chaque vente décrémente automatiquement le stock local (Dexie) et synchronise le statut dès qu'une connexion Internet est détectée. Consultez la liste des produits en stock critique d'un coup d'œil.",
      },
    ],
  },
  {
    id: "step-4",
    stepNumber: "04",
    title: "Ventes en Caisse & Mode Hors-Ligne 0ms",
    shortDesc: "Encaissez sans aucune latence, même en cas de coupure de courant ou de panne internet.",
    badge: "100% Offline-First",
    badgeColor: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Zap,
    sections: [
      {
        title: "1. Caisse tactile 0ms (Zéro Latence)",
        description:
          "Grâce à notre moteur de base de données locale (IndexedDB / Dexie), chaque tapotement d'article et encaissement s'exécute en 0 milliseconde. L'application ne dépend pas d'un serveur distant pour valider une vente.",
        visualType: "pos",
        tips: [
          "Fonctionne sans aucune connexion internet active.",
          "Prend en charge les tickets en attente (Hold / Reprise de commande de table).",
        ],
      },
      {
        title: "2. Impression des Reçus & Clôture de Caisse (Rapport Z)",
        description:
          "Imprimez vos tickets de caisse sur imprimantes thermiques 58mm ou 80mm (Bluetooth, USB, Réseau) ou partagez le reçu numérique directement au client. En fin de journée, réalisez votre clôture de caisse avec comptage des espèces et comparaison automatique.",
      },
      {
        title: "3. Synchronisation Cloud Automatique",
        description:
          "Dès que votre téléphone ou ordinateur capte à nouveau le Wi-Fi ou la 3G/4G, la file d'attente synchronise silencieusement toutes vos transactions vers le Cloud chiffré.",
      },
    ],
  },
  {
    id: "step-5",
    stepNumber: "05",
    title: "Carnet de Dettes & Relances WhatsApp",
    shortDesc: "Enregistrez les crédits clients et récupérez vos impayés grâce aux relances WhatsApp en 1 clic.",
    badge: "Récupération Créances",
    badgeColor: "bg-green-100 text-green-700 border-green-200",
    icon: MessageCircle,
    sections: [
      {
        title: "1. Enregistrement d'une vente à crédit",
        description:
          "Lors de la validation du panier, sélectionnez le mode 'Dette / Crédit', choisissez le client ou créez-le en quelques secondes avec son numéro de téléphone. Le solde dû est immédiatement mis à jour.",
        visualType: "whatsapp",
      },
      {
        title: "2. Relance WhatsApp personnalisée en 1 Clic",
        description:
          "Accédez au Carnet de Dettes, cliquez sur l'icône WhatsApp à côté du client. Kuettu génère automatiquement un message prêt à l'envoi avec le détail exact de sa dette et un lien de confirmation.",
        tips: [
          "Trois modèles de messages disponibles : Rappel courtois, Suivi standard ou Relance urgente.",
          "Réduit le taux d'impayés de plus de 40% dès le premier mois d'utilisation.",
        ],
      },
    ],
  },
  {
    id: "step-6",
    stepNumber: "06",
    title: "Forfaits & Paiement Mobile Money (PawaPay)",
    shortDesc: "Activez votre abonnement en quelques secondes via Vodacom M-Pesa, Airtel, Orange, MTN ou Wave.",
    badge: "Activation Instantanée",
    badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
    icon: CreditCard,
    sections: [
      {
        title: "1. Choix du Forfait adapté à votre commerce",
        description:
          "Consultez les offres depuis le menu 'Abonnement / Facturation' : découvrez les forfaits Starter, Pro ou Multi-Boutiques adaptés à la taille de votre équipe.",
        visualType: "payment",
        details: [
          { label: "Plan Starter", value: "1 Caisse, Produits illimités, Ventes hors-ligne, Reçus" },
          { label: "Plan Pro (Recommandé)", value: "Multi-caissiers PIN, Carnet de dettes, WhatsApp, Statistiques" },
          { label: "Plan Entreprise", value: "Multi-boutiques, Transferts de stocks, Super-admin gérance" },
        ],
      },
      {
        title: "2. Paiement pas-à-pas par Mobile Money",
        description:
          "Grâce à notre passerelle sécurisée PawaPay, le paiement s'effectue directement depuis votre numéro de téléphone :",
        tips: [
          "Étape A : Cliquez sur 'S'abonner' sur le forfait de votre choix.",
          "Étape B : Sélectionnez votre opérateur (Vodacom M-Pesa, Airtel Money, Orange Money, Afrimoney, Wave, MTN).",
          "Étape C : Saisissez votre numéro de téléphone de paiement et validez.",
          "Étape D : Une invite USSD (demande de confirmation) s'affiche immédiatement sur votre téléphone.",
          "Étape E : Tapez votre code secret Mobile Money sur votre téléphone.",
          "Étape F : Votre compte GlobalPOS est instantanément débloqué pour 30 jours (ou 1 an).",
        ],
      },
      {
        title: "3. Factures automatiques & Prolongation automatique",
        description:
          "Recevez votre reçu de souscription numérique téléchargeable en PDF. Vous recevez un rappel discret par email et SMS 3 jours avant l'échéance de votre abonnement.",
      },
    ],
  },
  {
    id: "step-7",
    stepNumber: "07",
    title: "Programme Affilié & Autofinancement",
    shortDesc: "Recommandez GlobalPOS à vos collègues commerçants et gagnez jusqu'à 6 mois d'abonnement gratuit.",
    badge: "Gagnez des Mois Gratuits",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    icon: Gift,
    sections: [
      {
        title: "1. Récupérez votre Lien & Code Parrain",
        description:
          "Rendez-vous dans la rubrique 'Programme d'Affiliation' depuis votre tableau de bord. Copiez votre lien unique ou partagez-le directement sur WhatsApp ou Facebook.",
        visualType: "affiliate",
      },
      {
        title: "2. Barème des Récompenses Gamifiées",
        description:
          "Chaque commerçant qui s'inscrit avec votre code vous fait monter de grade et vous débloque des récompenses automatiques :",
        details: [
          { label: "🥉 Tier Bronze (10 filleuls)", value: "15 Jours gratuits du Plan PRO pour booster votre commerce" },
          { label: "🥈 Tier Argent (20 filleuls)", value: "1 Mois gratuit offert chaque trimestre" },
          { label: "🥇 Tier Or (40 filleuls)", value: "6 Mois d'abonnement gratuit débloqués dès le 30ème" },
          { label: "💎 Tier Platine (41+ filleuls)", value: "100% Gratuit à vie + 10% de commissions cash sur chaque paiement" },
        ],
      },
    ],
  },
];

const FAQS = [
  {
    q: "Que se passe-t-il si je perds ma connexion Internet pendant une vente ?",
    a: "Rien ne s'arrête ! Kuettu Global POS enregistre chaque vente, encaissement et modification de stock localement dans votre navigateur ou application mobile. Vous continuez à encaisser vos clients normalement à 0ms. Dès que la connexion revient, les données sont envoyées au Cloud sans que vous n'ayez rien à faire.",
  },
  {
    q: "Comment mes caissiers se connectent-ils sans voir mes bénéfices ?",
    a: "Chaque caissier possède un code PIN à 4 chiffres. Lorsqu'il saisit son PIN, il a uniquement accès à l'écran de caisse pour ajouter des articles et encaisser. Vos prix d'achat, marges, chiffres d'affaires globaux et rapports de trésorerie restent invisibles.",
  },
  {
    q: "Quels sont les opérateurs Mobile Money acceptés pour le paiement des forfaits ?",
    a: "Nous acceptons Vodacom M-Pesa, Airtel Money, Orange Money et Afrimoney pour la RDC, ainsi que Wave, MTN Mobile Money, Moov et Orange Money dans l'espace UEMOA/Afrique de l'Ouest via notre passerelle certifiée PawaPay.",
  },
  {
    q: "Mes données sont-elles protégées si mon téléphone ou ordinateur est perdu ou volé ?",
    a: "Oui. Toutes vos données synchronisées sont stockées de façon sécurisée et chiffrée sur nos serveurs Cloud. Il vous suffit d'ouvrir Kuettu Global POS sur n'importe quel nouvel appareil et de vous connecter avec vos identifiants pour retrouver l'intégralité de vos stocks, ventes et clients.",
  },
  {
    q: "Puis-je tester l'application avant de payer un forfait ?",
    a: "Absolument ! Lors de votre inscription, vous bénéficiez d'une période d'essai gratuite avec toutes les fonctionnalités débloquées pour configurer votre boutique et tester l'encaissement.",
  },
];

export default function GuidePage() {
  const [activeStepId, setActiveStepId] = useState<string>("step-1");
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const activeStep = GUIDE_STEPS.find((s) => s.id === activeStepId) || GUIDE_STEPS[0];

  const filteredSteps = GUIDE_STEPS.filter(
    (step) =>
      step.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      step.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      step.sections.some((sec) => sec.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-500 selection:text-white">
      {/* ========================================================= */}
      {/* 1. HERO HEADER                                            */}
      {/* ========================================================= */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200/80 pt-12 pb-16 px-4 sm:px-6 lg:px-8">
        {/* Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-blue-500/10 via-indigo-500/5 to-transparent blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold mb-4 shadow-xs">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>Guide Officiel & Tutoriel Pas-à-Pas</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
            Maîtrisez votre Commerce de A à Z : <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600">
              De l'Onboarding au Paiement Mobile Money
            </span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Découvrez comment configurer votre boutique, sécuriser vos caisses avec des codes PIN, encaisser à 0ms
            hors-ligne, relancer vos clients endettés par WhatsApp et souscrire à votre forfait en quelques secondes.
          </p>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto mt-8">
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 text-center shadow-xs">
              <div className="text-blue-600 font-extrabold text-lg">⚡ 5 Min</div>
              <div className="text-xs font-semibold text-slate-700">Prise en main</div>
              <div className="text-[10px] text-slate-400">Configuration éclair</div>
            </div>

            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 text-center shadow-xs">
              <div className="text-emerald-600 font-extrabold text-lg">🔌 100% Offline</div>
              <div className="text-xs font-semibold text-slate-700">Mode Hors-Ligne</div>
              <div className="text-[10px] text-slate-400">Zéro dépendance net</div>
            </div>

            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 text-center shadow-xs">
              <div className="text-amber-600 font-extrabold text-lg">📱 PawaPay</div>
              <div className="text-xs font-semibold text-slate-700">Mobile Money</div>
              <div className="text-[10px] text-slate-400">M-Pesa, Orange, Airtel, Wave</div>
            </div>

            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 text-center shadow-xs">
              <div className="text-purple-600 font-extrabold text-lg">🎁 Affiliation</div>
              <div className="text-xs font-semibold text-slate-700">Mois Gratuits</div>
              <div className="text-[10px] text-slate-400">Jusqu'à 6 mois offerts</div>
            </div>
          </div>

          {/* Quick Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <Link
              href="/auth/register"
              className="py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all active:scale-95"
            >
              <span>Créer mon Compte Gratuit</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/pos"
              className="py-3 px-5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-xs flex items-center gap-2 transition-all active:scale-95"
            >
              <Store className="w-4 h-4 text-blue-600" />
              <span>Ouvrir la Caisse Démo</span>
            </Link>

            <Link
              href="/billing"
              className="py-3 px-5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs border border-emerald-200 flex items-center gap-2 transition-all active:scale-95"
            >
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Voir les Forfaits & Tarifs</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. INTERACTIVE STEPPER & CONTENT BROWSER                  */}
      {/* ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Navigation Interactive (7 Étapes Clés)
            </span>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher un sujet (PIN, Mobile Money, Dettes...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Vertical Step Navigation */}
          <div className="lg:col-span-4 space-y-2 sticky top-24">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Étapes du Guide
            </div>

            {filteredSteps.map((step) => {
              const IconComponent = step.icon;
              const isActive = activeStepId === step.id;

              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStepId(step.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3.5 group cursor-pointer ${
                    isActive
                      ? "bg-white border-blue-500/60 shadow-md shadow-blue-500/5 ring-1 ring-blue-500/20"
                      : "bg-white/60 hover:bg-white border-slate-200/70 hover:border-slate-300"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-mono font-bold text-xs transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                    }`}
                  >
                    {step.stepNumber}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-xs font-bold truncate ${
                          isActive ? "text-blue-900" : "text-slate-800 group-hover:text-slate-900"
                        }`}
                      >
                        {step.title}
                      </span>
                      <ChevronRight
                        className={`w-4 h-4 shrink-0 transition-transform ${
                          isActive ? "text-blue-600 translate-x-0.5" : "text-slate-300 group-hover:text-slate-400"
                        }`}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{step.shortDesc}</p>
                  </div>
                </button>
              );
            })}

            {/* Need direct assistance card */}
            <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 shadow-xs">
              <div className="flex items-center gap-2 mb-2 text-emerald-800 font-bold text-xs">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Besoin d'aide immédiate ?</span>
              </div>
              <p className="text-[11px] text-emerald-700/90 leading-relaxed mb-3">
                Notre équipe de support technique vous assiste pas à pas pour la configuration de votre matériel et vos forfaits.
              </p>
              <a
                href="https://wa.me/243990387237?text=Bonjour%20Kuettu%20Global%20POS,%20j%27aimerais%20une%20assistance%20pas%20%C3%A0%20pas%20pour%20mon%20commerce."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-xs transition-all"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Contacter le Support WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Right Column: Step Deep Dive Content */}
          <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm">
            {/* Step Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-6 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  {React.createElement(activeStep.icon, { className: "w-6 h-6" })}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-blue-600">ÉTAPE {activeStep.stepNumber}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${activeStep.badgeColor}`}>
                      {activeStep.badge}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{activeStep.title}</h2>
                </div>
              </div>
            </div>

            {/* Step Sections */}
            <div className="space-y-8">
              {activeStep.sections.map((sec, idx) => (
                <div key={idx} className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                    <span>{sec.title}</span>
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{sec.description}</p>

                  {/* Details table if present */}
                  {sec.details && sec.details.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                      {sec.details.map((d, dIdx) => (
                        <div key={dIdx} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            {d.label}
                          </div>
                          <div className="text-xs font-semibold text-slate-800 mt-0.5">{d.value}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pro Tips if present */}
                  {sec.tips && sec.tips.length > 0 && (
                    <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 space-y-2">
                      <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>Conseils & Astuces Pratiques</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-blue-800/90 pl-5 list-disc">
                        {sec.tips.map((tip, tIdx) => (
                          <li key={tIdx} className="leading-normal">
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Visual Mockups depending on visualType */}
                  {sec.visualType === "security" && (
                    <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                        <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                          <Lock className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Simulation Verrouillage Caisse par Code PIN</span>
                        </span>
                        <span className="text-emerald-400 font-mono text-[10px]">Session Sécurisée</span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-4 py-2">
                        <div className="flex gap-2">
                          {["•", "•", "•", "•"].map((dot, dotIdx) => (
                            <div
                              key={dotIdx}
                              className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg font-bold text-emerald-400 shadow-inner"
                            >
                              {dot}
                            </div>
                          ))}
                        </div>
                        <div className="text-xs text-slate-300 leading-relaxed">
                          Le caissier saisit son code à 4 chiffres (ex: <b>1234</b>) et accède directement à l'écran de vente sans dévoiler le mot de passe propriétaire.
                        </div>
                      </div>
                    </div>
                  )}

                  {sec.visualType === "whatsapp" && (
                    <div className="p-4 rounded-2xl bg-emerald-950/90 text-emerald-100 border border-emerald-800 space-y-3">
                      <div className="flex items-center justify-between text-xs border-b border-emerald-800/80 pb-2">
                        <span className="flex items-center gap-1.5 font-bold text-emerald-300">
                          <MessageCircle className="w-4 h-4 text-emerald-400" />
                          <span>Aperçu Message WhatsApp Pré-rempli</span>
                        </span>
                        <span className="text-[10px] bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-full">
                          1 Clic
                        </span>
                      </div>

                      <div className="bg-emerald-900/60 p-3.5 rounded-xl border border-emerald-700/60 font-sans text-xs space-y-2 text-emerald-100">
                        <p className="font-semibold text-emerald-200">
                          Bonjour <b>M. Patrick</b>,
                        </p>
                        <p className="text-[11px] leading-relaxed text-emerald-200/90">
                          Sauf erreur de notre part, votre solde débiteur auprès de notre établissement <b>Épicerie Centrale</b> est de <b>45 000 CDF</b> (Dette du 12/09/2026).
                        </p>
                        <p className="text-[11px] text-emerald-300">
                          Merci de régulariser par Cash ou Mobile Money. Cordialement !
                        </p>
                      </div>
                    </div>
                  )}

                  {sec.visualType === "payment" && (
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-blue-400" />
                            <span>Parcours Paiement Mobile Money PawaPay</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Vodacom M-Pesa • Airtel Money • Orange Money • Wave • MTN
                          </p>
                        </div>
                        <span className="text-xs font-mono font-bold bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-lg border border-blue-500/30">
                          100% Automatisé
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-1.5">
                          <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">
                            1
                          </div>
                          <div className="text-xs font-bold text-white">Saisie Numéro</div>
                          <p className="text-[11px] text-slate-400 leading-normal">
                            Choisissez votre plan et saisissez votre numéro Mobile Money.
                          </p>
                        </div>

                        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-1.5">
                          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                            2
                          </div>
                          <div className="text-xs font-bold text-white">Validation USSD</div>
                          <p className="text-[11px] text-slate-400 leading-normal">
                            Tapez votre code secret Mobile Money directement sur votre téléphone.
                          </p>
                        </div>

                        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-1.5">
                          <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">
                            3
                          </div>
                          <div className="text-xs font-bold text-white">Activation Directe</div>
                          <p className="text-[11px] text-slate-400 leading-normal">
                            Le compte est prolongé instantanément pour 30 jours sans attente.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {sec.visualType === "affiliate" && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-3">
                      <div className="flex items-center justify-between text-xs border-b border-amber-200 pb-2">
                        <span className="font-bold text-amber-900 flex items-center gap-1.5">
                          <Gift className="w-4 h-4 text-amber-600" />
                          <span>Tableau des Récompenses Gamifiées (Affiliation)</span>
                        </span>
                        <Link
                          href="/affiliate"
                          className="text-[10px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 underline"
                        >
                          <span>Voir mon Espace Affilié</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                        <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                          <div className="text-[10px] font-bold text-amber-700">BRONZE</div>
                          <div className="font-extrabold text-slate-900 mt-0.5">10 filleuls</div>
                          <div className="text-[10px] text-emerald-700 font-semibold mt-1">🎁 15j Plan Pro</div>
                        </div>

                        <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                          <div className="text-[10px] font-bold text-slate-600">ARGENT</div>
                          <div className="font-extrabold text-slate-900 mt-0.5">20 filleuls</div>
                          <div className="text-[10px] text-emerald-700 font-semibold mt-1">🎁 1 mois/trimestre</div>
                        </div>

                        <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                          <div className="text-[10px] font-bold text-amber-600">OR</div>
                          <div className="font-extrabold text-slate-900 mt-0.5">40 filleuls</div>
                          <div className="text-[10px] text-emerald-700 font-semibold mt-1">🎁 6 mois gratuits</div>
                        </div>

                        <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                          <div className="text-[10px] font-bold text-purple-600">PLATINE</div>
                          <div className="font-extrabold text-slate-900 mt-0.5">41+ filleuls</div>
                          <div className="text-[10px] text-emerald-700 font-semibold mt-1">🎁 100% Free + 10% Cash</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom Stepper Pagination */}
            <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between">
              {(() => {
                const currentIndex = GUIDE_STEPS.findIndex((s) => s.id === activeStepId);
                const prevStep = currentIndex > 0 ? GUIDE_STEPS[currentIndex - 1] : null;
                const nextStep = currentIndex < GUIDE_STEPS.length - 1 ? GUIDE_STEPS[currentIndex + 1] : null;

                return (
                  <>
                    {prevStep ? (
                      <button
                        onClick={() => setActiveStepId(prevStep.id)}
                        className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4 rotate-180" />
                        <span>Précédent : {prevStep.title}</span>
                      </button>
                    ) : (
                      <div />
                    )}

                    {nextStep ? (
                      <button
                        onClick={() => setActiveStepId(nextStep.id)}
                        className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                      >
                        <span>Suivant : {nextStep.title}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <Link
                        href="/auth/register"
                        className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all"
                      >
                        <span>Prêt ? Créer mon compte maintenant</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. FAQ SECTION                                            */}
      {/* ========================================================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-200/80">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold mb-2">
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>Foire Aux Questions</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Questions Fréquentes sur le Guide</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Tout ce que vous devez savoir pour démarrer sereinement et gérer votre commerce sans tracas.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden transition-all shadow-xs"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition-colors"
                >
                  <span className="text-xs sm:text-sm font-bold text-slate-900">{faq.q}</span>
                  <ChevronRight
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                      isOpen ? "rotate-90 text-blue-600" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 text-xs sm:text-sm text-slate-600 border-t border-slate-100 pt-3 leading-relaxed bg-slate-50/40">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. BOTTOM FINAL CTA BANNER                                */}
      {/* ========================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-950 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 border border-slate-800">
          <div className="max-w-xl space-y-3 text-center md:text-left">
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
              Commencez en 2 Minutes
            </span>
            <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Prêt à transformer la gestion de votre boutique ?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Rejoignez plus de 1 200 commerçants qui ont éliminé les erreurs de caisse et boosté leurs encaissements avec
              Kuettu Global POS.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            <Link
              href="/auth/register"
              className="py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <span>Créer mon Compte Gratuit</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/billing"
              className="py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <CreditCard className="w-4 h-4 text-blue-400" />
              <span>Voir les Forfaits</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
