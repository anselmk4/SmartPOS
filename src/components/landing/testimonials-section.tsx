"use client";

import React from "react";
import { Star, ShieldCheck, Sparkles, MapPin } from "lucide-react";
import { useLandingTheme } from "./landing-theme-context";

export default function TestimonialsSection() {
  const { isDark } = useLandingTheme();

  const testimonials = [
    {
      name: "Mireille Boketshu",
      role: "Gérante & Propriétaire",
      business: "Supérette La Grâce (Kinshasa, Gombe)",
      avatarText: "MB",
      stars: 5,
      impact: "+45% de recouvrement",
      quote:
        "Avant Kuettu, je perdais au moins 300$ par mois de crédits oubliés sur des bouts de papier. Maintenant, en un clic sur WhatsApp, mes clients reçoivent le rappel courtois avec leur solde exact. C'est le jour et la nuit !",
    },
    {
      name: "Dieudonné Kabangu",
      role: "Fondateur & Directeur",
      business: "Quincaillerie Pro BTP (Lubumbashi)",
      avatarText: "DK",
      stars: 5,
      impact: "0 coupure réseau",
      quote:
        "À Lubumbashi, les coupures d'électricité et d'Internet sont fréquentes. Avec Kuettu, la caisse continue de fonctionner sur tablette 100% hors-ligne. Le soir quand le Wi-Fi revient, tout se synchronise tout seul.",
    },
    {
      name: "Serge Ndongala",
      role: "Propriétaire Multi-Sites",
      business: "Le Rooftop Lounge & 2 Dépôts (Goma & Kinshasa)",
      avatarText: "SN",
      stars: 5,
      impact: "Marges 100% masquées",
      quote:
        "Le forfait Business me permet de superviser mes 3 établissements depuis mon téléphone. Mes barmans et caissiers encaissent avec leur code PIN sans jamais avoir accès à mes prix d'achat ni à mes marges.",
    },
  ];

  return (
    <section
      className={`py-20 sm:py-28 px-4 sm:px-6 lg:px-8 relative border-b transition-colors duration-300 ${
        isDark ? "bg-slate-950 text-white border-slate-800/80" : "bg-slate-50/70 text-slate-900 border-slate-200"
      }`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold shadow-md ${
              isDark
                ? "bg-slate-900 border border-emerald-500/30 text-emerald-400"
                : "bg-emerald-50 border border-emerald-300 text-emerald-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Retours d'Expérience Réels</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
            Adopté par les commerçants qui{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 dark:from-emerald-400 dark:via-teal-300 dark:to-amber-300">
              font tourner l'économie.
            </span>
          </h2>

          <p className={`text-sm sm:text-base leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            Découvrez comment Kuettu Global POS sécurise les caisses et accélère la croissance des commerces en Afrique.
          </p>
        </div>

        {/* Testimonials Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className={`p-6 sm:p-7 rounded-3xl border flex flex-col justify-between relative transition-all duration-300 ${
                isDark
                  ? "bg-gradient-to-b from-slate-900/90 to-slate-950/90 border-slate-800 hover:border-slate-700 hover:shadow-xl"
                  : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-lg shadow-slate-200"
              }`}
            >
              <div className="space-y-4">
                {/* Rating & Impact Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(t.stars)].map((_, sIdx) => (
                      <Star key={sIdx} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      isDark
                        ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-400"
                        : "bg-emerald-100 border-emerald-300 text-emerald-800"
                    }`}
                  >
                    {t.impact}
                  </span>
                </div>

                {/* Quote */}
                <p className={`text-xs sm:text-sm leading-relaxed italic ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                  "{t.quote}"
                </p>
              </div>

              {/* Author Bio */}
              <div className={`pt-6 mt-6 border-t flex items-center gap-3 ${isDark ? "border-slate-800/80" : "border-slate-200"}`}>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-300 font-bold text-xs shrink-0">
                  {t.avatarText}
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <h4 className={`text-xs font-bold truncate ${isDark ? "text-white" : "text-slate-900"}`}>{t.name}</h4>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{t.role}</p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{t.business}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
