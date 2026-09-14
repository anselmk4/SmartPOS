"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle, Sparkles, Search } from "lucide-react";
import { useLandingTheme } from "./landing-theme-context";

interface FAQItem {
  question: string;
  answer: string;
  category: "offline" | "debts" | "hardware" | "business";
}

const FAQS: FAQItem[] = [
  {
    category: "offline",
    question: "Est-ce que l'application fonctionne vraiment sans connexion Internet ?",
    answer:
      "Oui, à 100% ! Kuettu Global POS est conçu selon le paradigme Offline-First avec base de données DexieDB embarquée. Vous pouvez encaisser, imprimer vos tickets, enregistrer de nouveaux clients et tenir votre carnet de dettes toute la journée sans aucun réseau.",
  },
  {
    category: "offline",
    question: "Que se passe-t-il lorsque la connexion Internet revient ?",
    answer:
      "Dès que votre appareil capte la 3G/4G ou le Wi-Fi, toutes les transactions locales sont synchronisées automatiquement vers nos serveurs Cloud sécurisés. Vos rapports sont sauvegardés sans aucune manipulation manuelle.",
  },
  {
    category: "debts",
    question: "Comment fonctionne la relance WhatsApp des clients endettés ?",
    answer:
      "En un clic sur le profil d'un client dans le Carnet de Dettes, Kuettu génère un message WhatsApp pré-rempli avec le montant exact dû en Francs Congolais (CDF) ou Dollars ($). Vous choisissez le ton (Courtois, Standard ou Urgent) et le message s'ouvre directement.",
  },
  {
    category: "business",
    question: "Mes données sont-elles protégées en cas de vol ou de casse d'appareil ?",
    answer:
      "Oui. Dès qu'une synchronisation Cloud a eu lieu, vos données sont chiffrées et sauvegardées. En cas de perte de téléphone ou tablette, reconnectez-vous sur un nouvel appareil pour tout retrouver instantanément.",
  },
  {
    category: "business",
    question: "Puis-je créer des accès caissiers sans qu'ils voient mes marges d'achat ?",
    answer:
      "Absolument. Vous pouvez créer des profils caissiers avec codes PIN à 4 chiffres. Ils ont uniquement accès à l'écran de vente sans jamais voir vos coûts d'achat, vos marges bénéficiaires ni vos rapports financiers de gérance.",
  },
  {
    category: "business",
    question: "Comment fonctionne le mode Multi-Magasins (Plan Business) ?",
    answer:
      "Le forfait Business permet de superviser jusqu'à 10 boutiques ou dépôts distincts avec stocks isolés, gérants dédiés (PIN) et transferts de stock traçables sous un tableau de bord consolidé.",
  },
  {
    category: "hardware",
    question: "Quels moyens de paiement Mobile Money sont supportés ?",
    answer:
      "Kuettu supporte Vodacom M-Pesa, Orange Money, Airtel Money et Afrimoney. Les encaissements en CDF et USD sont isolés pour une réconciliation stricte du tiroir-caisse.",
  },
  {
    category: "hardware",
    question: "Quels matériels (imprimantes, lecteurs code-barre) sont compatibles ?",
    answer:
      "L'application fonctionne sur tout smartphone Android / iOS, tablette, PC ou Mac. Elle est compatible avec les douchettes code-barres USB/Bluetooth et les imprimantes thermiques 58mm/80mm standard ESC/POS.",
  },
];

export default function FaqAccordion() {
  const { isDark } = useLandingTheme();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const filteredFaqs = FAQS.filter((faq) => {
    const matchesCat = selectedCategory === "all" || faq.category === selectedCategory;
    const matchesQuery =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <section
      id="faq"
      className={`py-20 sm:py-24 px-4 sm:px-6 lg:px-8 relative border-b transition-colors duration-300 ${
        isDark ? "bg-slate-950 text-white border-slate-800/80" : "bg-white text-slate-900 border-slate-200"
      }`}
    >
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-12">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold shadow-sm ${
              isDark
                ? "bg-slate-900 border border-emerald-500/30 text-emerald-400"
                : "bg-emerald-50 border border-emerald-300 text-emerald-900 shadow-slate-100"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Foire Aux Questions</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
            Des réponses claires à vos{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400">
              questions.
            </span>
          </h2>

          <p className={`text-sm sm:text-base leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            Tout ce que vous devez savoir pour démarrer et sécuriser votre activité commerciale en toute sérénité.
          </p>

          {/* Search & Category Filter */}
          <div className="pt-6 space-y-4">
            <div className="relative max-w-md mx-auto">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher une question (ex: hors-ligne, WhatsApp, imprimante...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs placeholder-slate-400 focus:outline-none transition-colors border ${
                  isDark
                    ? "bg-slate-900 border-slate-800 text-slate-200 focus:border-emerald-500"
                    : "bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-600"
                }`}
              />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === "all"
                    ? "bg-emerald-500 text-slate-950 font-black shadow-sm"
                    : isDark
                    ? "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200"
                }`}
              >
                Toutes les questions
              </button>
              <button
                onClick={() => setSelectedCategory("offline")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === "offline"
                    ? "bg-emerald-500 text-slate-950 font-black shadow-sm"
                    : isDark
                    ? "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200"
                }`}
              >
                Hors-Ligne & Sync
              </button>
              <button
                onClick={() => setSelectedCategory("debts")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === "debts"
                    ? "bg-emerald-500 text-slate-950 font-black shadow-sm"
                    : isDark
                    ? "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200"
                }`}
              >
                Carnet WhatsApp
              </button>
              <button
                onClick={() => setSelectedCategory("business")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === "business"
                    ? "bg-emerald-500 text-slate-950 font-black shadow-sm"
                    : isDark
                    ? "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200"
                }`}
              >
                Gérance & Multi-Sites
              </button>
              <button
                onClick={() => setSelectedCategory("hardware")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === "hardware"
                    ? "bg-emerald-500 text-slate-950 font-black shadow-sm"
                    : isDark
                    ? "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200"
                }`}
              >
                Matériel & Mobile Money
              </button>
            </div>
          </div>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div
              className={`p-8 rounded-3xl border text-center text-xs ${
                isDark ? "bg-slate-900/60 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"
              }`}
            >
              Aucune question ne correspond à votre recherche.
            </div>
          ) : (
            filteredFaqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? isDark
                        ? "bg-slate-900 border-emerald-500/40 shadow-xl shadow-emerald-950/20"
                        : "bg-white border-emerald-400 shadow-md shadow-emerald-100"
                      : isDark
                      ? "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                      : "bg-slate-50/80 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className={`w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm ${
                      isDark ? "text-slate-200 hover:text-white" : "text-slate-800 hover:text-slate-950"
                    }`}
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-emerald-500 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div
                      className={`px-5 pb-5 pt-1 text-xs leading-relaxed border-t animate-fadeIn ${
                        isDark ? "text-slate-300 border-slate-800/80" : "text-slate-600 border-slate-100"
                      }`}
                    >
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
