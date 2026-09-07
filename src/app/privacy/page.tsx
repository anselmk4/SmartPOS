"use client";

import Link from "next/link";
import { ShieldCheck, Lock, Eye, Server, RefreshCw, ArrowLeft, Building2 } from "lucide-react";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
            {/* Header / Nav */}
            <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Retour à l&apos;accueil</span>
                    </Link>
                    <div className="flex items-center gap-2.5">
                        <img src="/images/logo.png" alt="Kuettu Global POS" className="h-7 w-auto object-contain" />
                        <span className="font-extrabold tracking-tight text-white text-base">Kuettu Global POS</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-16">
                {/* Badge & Title */}
                <div className="mb-10 text-center sm:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Protection des Données & Confidentialité Commerciale (RDC)
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                        Politique de Confidentialité & Sécurité des Données
                    </h1>
                    <p className="mt-3 text-slate-400 text-sm sm:text-base">
                        Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })} &bull; Applicable aux commerces opérant en République Démocratique du Congo (RDC).
                    </p>
                </div>

                {/* Sections */}
                <div className="space-y-8 text-slate-300 text-sm sm:text-base leading-relaxed">
                    
                    {/* 1. Introduction */}
                    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2.5 mb-4">
                            <span className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">1</span>
                            Engagement de Confidentialité
                        </h2>
                        <p>
                            La plateforme <strong>Kuettu POS</strong> accorde une importance primordiale à la confidentialité, l&apos;intégrité et la souveraineté des données de votre entreprise. 
                            La présente politique définit la manière dont Kuettu collecte, traite, sécurise et protège vos informations commerciales, financières et d&apos;inventaire conformément au cadre légal applicable en <strong>République Démocratique du Congo (RDC)</strong>.
                        </p>
                    </section>

                    {/* 2. Données Collectées */}
                    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2.5 mb-4">
                            <span className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">2</span>
                            Données Collectées
                        </h2>
                        <p className="mb-3">
                            Kuettu traite uniquement les données strictement nécessaires au fonctionnement de votre logiciel de caisse et de gestion :
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-slate-300">
                            <li><strong>Informations du Marchand :</strong> Nom du propriétaire, dénomination commerciale, numéro de téléphone (WhatsApp/SMS), adresse email, ville (Kinshasa, Lubumbashi, Goma, etc.), RCCM ou Id. Nat (si renseigné).</li>
                            <li><strong>Données d&apos;Exploitation :</strong> Liste des articles, références (SKU), prix de vente, coûts de revient, mouvements de stocks et alertes d&apos;inventaire.</li>
                            <li><strong>Données de Ventes & Transactions :</strong> Tickets de caisse, montants encaissés, modes de règlement (Cash USD, Franc Congolais CDF, M-Pesa, Airtel Money, Orange Money).</li>
                            <li><strong>Données des Utilisateurs :</strong> Profils des caissiers, codes PIN hachés, journaux de session et historiques de clôture de caisse.</li>
                        </ul>
                    </section>

                    {/* 3. Propriété Exclusive des Données */}
                    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2.5 mb-4">
                            <span className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">3</span>
                            Propriété Exclusive & Secret Commercial
                        </h2>
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4 text-amber-200 text-sm">
                            <strong>Garantie absolue :</strong> Kuettu ne vend, ne loue, ni ne divulgue <strong>JAMAIS</strong> vos chiffres d&apos;affaires, marges bénéficiaires ou listes de fournisseurs à aucun tiers ou concurrent.
                        </div>
                        <p>
                            Toutes les données de vente, d&apos;inventaire et de clientèle enregistrées dans votre espace restent votre propriété exclusive. Kuettu n&apos;agit qu&apos;en qualité d&apos;opérateur technique d&apos;hébergement et de synchronisation chiffrée.
                        </p>
                    </section>

                    {/* 4. Sécurité et Mode Hors-Ligne */}
                    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2.5 mb-4">
                            <span className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">4</span>
                            Sécurité & Synchronisation Hors-Ligne (Offline First)
                        </h2>
                        <p className="mb-3">
                            Pour répondre aux contraintes d&apos;instabilité du réseau Internet en RDC, Kuettu utilise une architecture <em>Offline-First</em> :
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-slate-300">
                            <li><strong>Stockage Local Sécurisé :</strong> Les données de caisse courantes sont chiffrées et enregistrées localement sur l&apos;appareil dans une base IndexedDB / SQLite isolée.</li>
                            <li><strong>Chiffrement en Transit :</strong> Toutes les synchronisations vers les serveurs cloud de Kuettu s&apos;effectuent via des protocoles sécurisés SSL/TLS (HTTPS).</li>
                            <li><strong>Authentification & PIN :</strong> Les mots de passe et codes PIN caissiers sont chiffrés selon des algorithmes cryptographiques irréversibles.</li>
                        </ul>
                    </section>

                    {/* 5. Notifications par SMS & WhatsApp */}
                    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2.5 mb-4">
                            <span className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">5</span>
                            Communications & Notifications (SMS / WhatsApp)
                        </h2>
                        <p>
                            En créant un compte, vous acceptez de recevoir des notifications opérationnelles liées à la vie de votre compte : code de vérification, confirmation d&apos;activation manuelle par nos administrateurs, alertes de clôture journalière ou rappels d&apos;échéance de forfait. Vous pouvez configurer vos préférences d&apos;alerte depuis les paramètres de votre établissement.
                        </p>
                    </section>

                    {/* 6. Droits de Rectification et Suppression */}
                    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2.5 mb-4">
                            <span className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">6</span>
                            Vos Droits d&apos;Accès, Rectification et Export
                        </h2>
                        <p>
                            En tant que propriétaire du compte, vous disposez d&apos;un droit d&apos;accès, d&apos;exportation intégrale de vos données (Excel / CSV) et de suppression définitive de votre établissement sur simple demande motivée adressée au support Kuettu.
                        </p>
                    </section>

                    {/* 7. Contact Support */}
                    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2.5 mb-4">
                            <span className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">7</span>
                            Contact et Délégué à la Sécurité
                        </h2>
                        <p>
                            Pour toute question relative à la protection de vos données ou pour signaler un incident technique, contactez l&apos;équipe Kuettu :
                        </p>
                        <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm space-y-1">
                            <p><strong className="text-white">Kuettu Global POS - Département Sécurité & Conformité</strong></p>
                            <p className="text-slate-400">Kinshasa & Bukavu, République Démocratique du Congo</p>
                            <p className="text-emerald-400">Email : support@kuettu.com | WhatsApp Officiel : +243 990 387 237</p>
                        </div>
                    </section>

                </div>

                {/* Footer links */}
                <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
                    <p>&copy; {new Date().getFullYear()} Kuettu Global POS. Tous droits réservés.</p>
                    <div className="flex gap-4">
                        <Link href="/terms" className="hover:text-emerald-400 transition-colors">
                            Conditions Générales d&apos;Utilisation
                        </Link>
                        <Link href="/auth/login" className="hover:text-emerald-400 transition-colors">
                            Connexion
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
