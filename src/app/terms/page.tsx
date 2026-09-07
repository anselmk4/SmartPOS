"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, FileText, ArrowLeft, CheckCircle2, Lock, Scale, Building2, HelpCircle } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à l'inscription</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Conditions Générales d'Utilisation & Contrat de Service
              </h1>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Kuettu Global POS • Édition République Démocratique du Congo & Espace OHADA
              </p>
            </div>
          </div>
        </div>

        {/* Contract Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8 text-xs sm:text-sm text-slate-300 leading-relaxed shadow-2xl">
          {/* Article 1 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span className="text-blue-400">Article 1 :</span>
              <span>Objet du Contrat & Présentation du Service</span>
            </h2>
            <p>
              Le présent contrat régit les relations contractuelles entre <b>Kuettu Corporation</b> (ci-après désigné « <i>Le Prestataire</i> » ou « <i>Kuettu</i> ») et le commerçant, entreprise ou établissement utilisateur (ci-après désigné « <i>Le Client</i> » ou « <i>La Boutique</i> »).
            </p>
            <p>
              Kuettu Global POS est une solution logicielle SaaS (Software as a Service) de caisse enregistreuse tactile, de gestion des stocks, de facturation, de suivi des dettes et de réconciliation financière fonctionnant en mode hybride (100% hors-ligne local via IndexedDB et synchronisation Cloud sécurisée).
            </p>
          </section>

          {/* Article 2 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span className="text-blue-400">Article 2 :</span>
              <span>Propriété des Données Commerciales</span>
            </h2>
            <p>
              Le Client conserve la **pleine et entière propriété exclusive** de toutes les données enregistrées dans son application (catalogue de produits, prix de vente et d'achat, chiffre d'affaires, identités des clients et créances).
            </p>
            <p>
              Kuettu s'interdit formellement de divulguer, commercialiser, céder ou exploiter à des tiers les chiffres d'affaires, les marges ou les carnets de dettes du Client.
            </p>
          </section>

          {/* Article 3 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span className="text-blue-400">Article 3 :</span>
              <span>Fonctionnement Hors-Ligne & Sauvegardes</span>
            </h2>
            <p>
              Kuettu Global POS est conçu selon l'architecture « <i>Offline-First</i> ». Toutes les opérations de caisse (ventes, encaissements, impressions de tickets, mises en attente de tables) s'exécutent instantanément sans connexion Internet active.
            </p>
            <p>
              Dès qu'une connexion Internet est disponible (Wi-Fi, 3G/4G/5G), les données sont automatiquement sauvegardées et répliquées de manière chiffrée sur les serveurs sécurisés Cloud de Kuettu.
            </p>
          </section>

          {/* Article 4 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span className="text-blue-400">Article 4 :</span>
              <span>Abonnements, Forfaits & Modalités de Paiement</span>
            </h2>
            <p>
              Le service propose une formule d'évaluation gratuite ainsi que des forfaits mensuels et annuels payants (BASIC, PRO, BUSINESS) offrant des fonctionnalités étendues (multi-caisses, envoi WhatsApp, transferts inter-dépôts).
            </p>
            <p>
              Les règlements s'effectuent en Francs Congolais (CDF) ou Dollars Américains (USD) via les canaux agréés en RDC : Mobile Money (M-Pesa, Airtel Money, Orange Money, Afrimoney), carte bancaire ou versement direct. Tout mois entamé reste acquis.
            </p>
          </section>

          {/* Article 5 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span className="text-blue-400">Article 5 :</span>
              <span>Sécurité des Accès & Comptes Employés</span>
            </h2>
            <p>
              Le compte <b>Propriétaire</b> est le compte administrateur maître responsable de la configuration de la boutique et de l'attribution des codes PIN du personnel (caissiers, serveurs, managers).
            </p>
            <p>
              Chaque nouvel appareil (téléphone, tablette, ordinateur) doit être authentifié par le Propriétaire avant de permettre l'ouverture des sessions des employés.
            </p>
          </section>

          {/* Article 6 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span className="text-blue-400">Article 6 :</span>
              <span>Droit Applicable & Juridiction Compétente</span>
            </h2>
            <p>
              Le présent contrat est soumis au droit de la République Démocratique du Congo et aux règles de l'Acte Uniforme OHADA portant sur le droit commercial général. Tout litige relatif à l'interprétation ou à l'exécution du présent contrat sera soumis aux tribunaux de commerce compétents de Kinshasa, après tentative de règlement à l'amiable.
            </p>
          </section>

          {/* Bottom Footer */}
          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              Dernière mise à jour : <b>Septembre 2026</b> • Kuettu Corporation RDC
            </div>
            <Link
              href="/privacy"
              className="text-xs font-bold text-blue-400 hover:text-blue-300 underline underline-offset-4"
            >
              Consulter la Politique de Confidentialité
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
