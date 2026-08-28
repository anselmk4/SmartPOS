"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle, Sparkles, Search } from "lucide-react";

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
      "Oui, à 100% ! Kuettu Global POS est conçu selon le paradigme Offline-First avec base de données embarquée. Vous pouvez encaisser des ventes, enregistrer des nouveaux clients, ajouter des produits et tenir votre carnet de dettes toute la journée sans aucun réseau Internet ni électricité continue. Aucune coupure réseau ne bloque votre caisse.",
  },
  {
    category: "offline",
    question: "Que se passe-t-il lorsque la connexion Internet revient ?",
    answer:
      "Dès que votre téléphone, tablette ou ordinateur capte la 3G/4G ou le Wi-Fi, Kuettu Global POS synchronise automatiquement et de manière transparente toutes les transactions enregistrées vers nos serveurs Cloud sécurisés. Vos données sont sauvegardées et consultables à distance par le propriétaire sans aucune intervention manuelle.",
  },
  {
    category: "debts",
    question: "Comment fonctionne la relance WhatsApp des clients endettés ?",
    answer:
      "En un seul clic sur le profil d'un client dans le Carnet de Dettes, Kuettu génère un message WhatsApp pré-rempli avec le nom du client, le montant exact dû en Francs Congolais (CDF) ou Dollars ($), ainsi que la date de la dette. Vous pouvez choisir entre 3 modèles : Courtois, Rappel standard ou Urgent.",
  },
  {
    category: "business",
    question: "Mes données sont-elles protégées en cas de vol ou de casse de mon appareil ?",
    answer:
      "Oui. Dès qu'une synchronisation Cloud a eu lieu, toutes vos données (produits, ventes, dettes, historique) sont chiffrées et sauvegardées sur nos serveurs. En cas de perte d'appareil, il vous suffit de vous reconnecter sur un autre téléphone ou ordinateur avec votre compte pour tout récupérer instantanément.",
  },
  {
    category: "business",
    question: "Puis-je créer des accès pour mes caissiers sans qu'ils voient mes marges d'achat ?",
    answer:
      "Absolument. Vous pouvez créer autant de profils caissiers que nécessaire avec des codes PIN simplifiés à 4 chiffres. Les caissiers ont uniquement accès à l'écran de vente et d'encaissement, sans jamais pouvoir consulter vos prix d'achat, vos marges bénéficiaires ni vos rapports financiers de gérance.",
  },
  {
    category: "business",
    question: "Comment fonctionne le mode Multi-Magasins (Plan Business) ?",
    answer:
      "Le forfait Business vous permet de créer et piloter jusqu'à 10 boutiques ou dépôts indépendants sous le même compte. Chaque magasin dispose de son stock isolé, de ses propres ventes et de son propre Gérant assigné avec son numéro de téléphone et code PIN. Vous pouvez également effectuer des transferts de stock entre vos dépôts.",
  },
  {
    category: "hardware",
    question: "Quels moyens de paiement Mobile Money sont supportés ?",
    answer:
      "Kuettu Global POS prend en charge tous les opérateurs majeurs de Mobile Money en RDC et Afrique : M-Pesa (Vodacom), Airtel Money, Orange Money et Afrimoney. Les encaissements en Francs Congolais (CDF) et en Dollars ($) sont comptabilisés séparément des espèces pour une réconciliation stricte du tiroir-caisse.",
  },
  {
    category: "hardware",
    question: "Quels matériels (imprimantes, lecteurs code-barre) sont compatibles ?",
    answer:
      "L'application fonctionne sur n'importe quel smartphone Android / iPhone, tablette, PC ou Mac. Elle est compatible avec les douchettes et lecteurs de code-barres USB/Bluetooth standard, ainsi que les imprimantes thermiques de reçus 58mm et 80mm ESC/POS.",
  },
];

export default function FaqAccordion() {
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
    <section id="faq" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-slate-950 text-white relative border-b border-slate-800/80">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-md">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Foire Aux Questions</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
            Des réponses claires à vos{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
              questions.
            </span>
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Tout ce que vous devez savoir pour démarrer et sécuriser votre activité commerciale en toute sérénité.
          </p>

          {/* Search & Category Filter */}
          <div className="pt-6 space-y-4">
            <div className="relative max-w-md mx-auto">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher une question (ex: hors-ligne, WhatsApp, imprimante...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === "all"
                    ? "bg-emerald-500 text-slate-950 font-black shadow-sm"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                Toutes les questions
              </button>
              <button
                onClick={() => setSelectedCategory("offline")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === "offline"
                    ? "bg-emerald-500 text-slate-950 font-black shadow-sm"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                Hors-Ligne & Sync
              </button>
              <button
                onClick={() => setSelectedCategory("debts")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === "debts"
                    ? "bg-emerald-500 text-slate-950 font-black shadow-sm"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                Carnet WhatsApp
              </button>
              <button
                onClick={() => setSelectedCategory("business")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === "business"
                    ? "bg-emerald-500 text-slate-950 font-black shadow-sm"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                Gérance & Multi-Sites
              </button>
              <button
                onClick={() => setSelectedCategory("hardware")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === "hardware"
                    ? "bg-emerald-500 text-slate-950 font-black shadow-sm"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
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
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-xs">
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
                      ? "bg-slate-900 border-emerald-500/40 shadow-xl shadow-emerald-950/20"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-200 hover:text-white"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-emerald-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 animate-fadeIn">
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
