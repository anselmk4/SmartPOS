"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db, DEFAULT_STORE_ID, enqueueSync, generateUUID, updateStoreBranding, repairAndRestoreStandardProductPrices } from "@/lib/db/dexie-db";
import { SAMPLE_PRODUCTS, SAMPLE_CUSTOMERS } from "@/lib/db/mock-data";
import { useSync, COUNTRIES } from "@/lib/sync/sync-context";
import { useAuth } from "@/lib/auth/auth-context";
import { PinLockScreen } from "@/components/auth/pin-lock-screen";
import type { Product, Customer } from "@/lib/shared/types";
import { uploadMediaFile } from "@/lib/storage/media-storage";
import {
  Settings as SettingsIcon,
  Store,
  RefreshCw,
  Wifi,
  WifiOff,
  Database,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Layers,
  Smartphone,
  Globe,
  ShieldCheck,
  Server,
  Sparkles,
  PackagePlus,
  LogOut,
  Lock,
  User,
  Shield,
  Upload,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";

import { BUSINESS_ACTIVITIES } from "@/lib/constants/business-activities";

import { convertCurrency, EXCHANGE_RATES } from "@/lib/constants/plans";

export default function SettingsPage() {
  const router = useRouter();
  const { user, tenant, store: authStore, isAuthenticated, isLoading, isOwner, isManager, isCashier, isWaiter, lockTerminal, logout } = useAuth();
  const { isOnline, isSyncing, pendingCount, lastSyncedAt, syncNow, refreshStore } = useSync();

  const currentStoreId = authStore?.id || DEFAULT_STORE_ID;
  const currentTenantId = tenant?.id;

  const syncQueueItems = useLiveQuery(() => db.syncQueue.toArray()) || [];
  const productsCount = useLiveQuery(async () => {
    if (!currentTenantId) return 0;
    return await db.products.filter((p) => p.tenantId === currentTenantId || !p.tenantId).count();
  }, [currentTenantId]) || 0;

  const customersCount = useLiveQuery(async () => {
    if (!currentTenantId) return 0;
    return await db.customers.filter((c) => c.tenantId === currentTenantId || !c.tenantId).count();
  }, [currentTenantId]) || 0;

  const salesCount = useLiveQuery(async () => {
    if (!currentTenantId) return 0;
    return await db.sales.filter((s) => s.tenantId === currentTenantId || !s.tenantId).count();
  }, [currentTenantId]) || 0;

  // Store form state
  const [storeName, setStoreName] = useState("");
  const [businessType, setBusinessType] = useState("Alimentation Générale & Supérette");
  const [logoUrl, setLogoUrl] = useState("");
  const [countryCode, setCountryCode] = useState("CD");
  const [currency, setCurrency] = useState("CDF");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // Security & Password change state
  const [currentPinInput, setCurrentPinInput] = useState("");
  const [newPinInput, setNewPinInput] = useState("");
  const [confirmPinInput, setConfirmPinInput] = useState("");

  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");

  const [securitySuccessMsg, setSecuritySuccessMsg] = useState<string | null>(null);
  const [securityErrorMsg, setSecurityErrorMsg] = useState<string | null>(null);
  const [isUpdatingSecurity, setIsUpdatingSecurity] = useState(false);

  useEffect(() => {
    if (authStore || tenant) {
      setStoreName(authStore?.name || tenant?.name || "");
      setBusinessType(authStore?.businessType || tenant?.businessType || "Alimentation Générale & Supérette");
      setLogoUrl(authStore?.logoUrl || tenant?.logoUrl || "");
      setCountryCode(authStore?.countryCode || tenant?.countryCode || "CD");
      setCurrency(authStore?.currency || tenant?.currency || "CDF");
      setPhone(authStore?.phone || tenant?.phone || "");
      setEmail(authStore?.email || tenant?.email || user?.email || "");
      setAddress(authStore?.address || tenant?.address || "");
      setOwnerName(authStore?.ownerName || user?.name || "");
    }
  }, [authStore, tenant, user]);

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityErrorMsg(null);
    setSecuritySuccessMsg(null);

    if (newPinInput.length !== 4 || !/^\d{4}$/.test(newPinInput)) {
      setSecurityErrorMsg("Le nouveau code PIN doit comporter exactement 4 chiffres.");
      return;
    }

    if (newPinInput !== confirmPinInput) {
      setSecurityErrorMsg("La confirmation du nouveau code PIN ne correspond pas.");
      return;
    }

    setIsUpdatingSecurity(true);
    try {
      if (user?.id) {
        await db.users.update(user.id, {
          pinCode: newPinInput,
          updatedAt: new Date().toISOString(),
        });

        await enqueueSync({
          tenantId: currentTenantId,
          storeId: currentStoreId,
          entity: "user",
          action: "UPDATE",
          payload: JSON.stringify({ id: user.id, pinCode: newPinInput }),
        });

        setSecuritySuccessMsg("Code PIN de sécurité mis à jour avec succès !");
        setCurrentPinInput("");
        setNewPinInput("");
        setConfirmPinInput("");
      }
    } catch (err: any) {
      setSecurityErrorMsg("Erreur lors de la mise à jour du code PIN.");
    } finally {
      setIsUpdatingSecurity(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityErrorMsg(null);
    setSecuritySuccessMsg(null);

    if (newPasswordInput.length < 6) {
      setSecurityErrorMsg("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setSecurityErrorMsg("Les nouveaux mots de passe saisis ne sont pas identiques.");
      return;
    }

    setIsUpdatingSecurity(true);
    try {
      if (user?.id) {
        await db.users.update(user.id, {
          passwordHash: newPasswordInput,
          updatedAt: new Date().toISOString(),
        });

        await enqueueSync({
          tenantId: currentTenantId,
          storeId: currentStoreId,
          entity: "user",
          action: "UPDATE",
          payload: JSON.stringify({ id: user.id, password: newPasswordInput }),
        });

        setSecuritySuccessMsg("Mot de passe principal mis à jour avec succès !");
        setCurrentPasswordInput("");
        setNewPasswordInput("");
        setConfirmPasswordInput("");
      }
    } catch (err: any) {
      setSecurityErrorMsg("Erreur lors du changement de mot de passe.");
    } finally {
      setIsUpdatingSecurity(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-100">
        <div className="text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Chargement des réglages...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PinLockScreen title="Paramètres Verrouillés" />;
  }

  if (!isOwner && !isManager) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-100">
        <div className="max-w-md w-full p-6 bg-white rounded-3xl border border-slate-200 shadow-sm text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Accès Réservé au Gérant</h3>
          <p className="text-xs text-slate-500">
            Les réglages du commerce et la configuration sont réservés au Gérant ou Manager.
          </p>
          <Link
            href="/pos"
            className="inline-block py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all"
          >
            Retourner à la Caisse
          </Link>
        </div>
      </div>
    );
  }

  const handleCountryChange = (newCountryCode: string) => {
    setCountryCode(newCountryCode);
    const country = COUNTRIES.find((c) => c.code === newCountryCode);
    if (country) {
      setCurrency(country.currency);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      alert("L'image est trop volumineuse (max 1.5 Mo).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authStore && !tenant) return;

    let finalLogoUrl = logoUrl || undefined;
    if (finalLogoUrl && finalLogoUrl.startsWith("data:image")) {
      const uploadRes = await uploadMediaFile(finalLogoUrl, {
        folder: "branding",
        fileName: `store-logo-${currentStoreId}.jpg`,
      });
      if (uploadRes.url) {
        finalLogoUrl = uploadRes.url;
      }
    }

    await updateStoreBranding(currentStoreId, {
      name: storeName.trim(),
      businessType: businessType.trim(),
      logoUrl: finalLogoUrl,
      countryCode,
      currency,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      ownerName: ownerName.trim() || undefined,
    });

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("pos_store_business_type", businessType.trim());
        window.dispatchEvent(new Event("storage"));
      } catch (_) {}
    }

    await refreshStore();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleRestorePrices = async () => {
    if (confirm("Voulez-vous réinitialiser et corriger les prix de tous les articles à leurs valeurs normales (ex: Riz 65.000 FC, Huile 28.000 FC, Swissta 9.000 FC, etc.) ?")) {
      const count = await repairAndRestoreStandardProductPrices();
      alert(`Correction terminée : ${count} article(s) ont été réajustés à leur valeur normale !`);
    }
  };

  const handleManualSync = async () => {
    const res = await syncNow();
    setSyncStatusMsg(res.message);
    setTimeout(() => setSyncStatusMsg(null), 4000);
  };

  const handleLock = () => {
    lockTerminal();
    router.push("/auth/login");
  };

  const handleLogout = () => {
    if (confirm("Êtes-vous sûr de vouloir vous déconnecter complètement de votre session ?")) {
      logout();
      router.push("/auth/login");
    }
  };

  // Option to seed demo sample products specifically for this boutique
  const handleLoadDemoCatalog = async () => {
    if (confirm("Voulez-vous charger un catalogue type de démonstration (Riz, Huile, Lait, Savon, etc.) dans votre boutique ?")) {
      const now = new Date().toISOString();
      const prods: Product[] = SAMPLE_PRODUCTS.map((p) => ({
        ...p,
        id: generateUUID(),
        tenantId: currentTenantId,
        storeId: currentStoreId,
        isSynced: false,
        createdAt: now,
        updatedAt: now,
      }));

      await db.products.bulkAdd(prods);

      for (const prod of prods) {
        await enqueueSync({
          tenantId: currentTenantId,
          storeId: currentStoreId,
          entity: "product",
          action: "CREATE",
          payload: JSON.stringify(prod),
        });
      }

      const custs: Customer[] = SAMPLE_CUSTOMERS.map((c) => ({
        ...c,
        id: generateUUID(),
        tenantId: currentTenantId,
        storeId: currentStoreId,
        isSynced: false,
        createdAt: now,
        updatedAt: now,
      }));

      await db.customers.bulkAdd(custs);

      for (const cust of custs) {
        await enqueueSync({
          tenantId: currentTenantId,
          storeId: currentStoreId,
          entity: "customer",
          action: "CREATE",
          payload: JSON.stringify(cust),
        });
      }

      alert("Articles et clients de démonstration ajoutés à votre boutique avec succès !");
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-100">
        <div className="text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PinLockScreen title="Paramètres Verrouillés" />;
  }

  if (!isOwner && !isManager) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full p-6 bg-white rounded-3xl border border-slate-200 shadow-sm text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Accès Réservé au Gérant</h3>
          <p className="text-xs text-slate-500">
            Les réglages et configurations de la boutique sont réservés au Gérant ou Manager.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-5 flex flex-col space-y-5">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-blue-600" />
            <span>Paramètres de la Boutique</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Boutique : <b>{storeName || tenant?.name}</b> • Gérant : <b>{user?.name}</b> ({user?.role})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT: Store Profile & Session */}
        <div className="lg:col-span-2 space-y-5">
          {/* Store Profile */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
            <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
              <Store className="w-5 h-5 text-blue-600" />
              <span>Identité, Logo & Devise</span>
            </h3>

            <form onSubmit={handleSaveStore} className="space-y-4">
              {/* Store Logo Upload */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo Boutique"
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                      <Store className="w-8 h-8" />
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Logo Officiel de votre Boutique
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Apparaît sur l'en-tête de votre caisse et les tickets de vente
                  </p>
                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <label className="py-1.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-blue-700 border border-slate-200 text-xs font-bold cursor-pointer shadow-xs transition-colors inline-flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{logoUrl ? "Changer le logo" : "Importer un logo"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>

                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl("")}
                        className="py-1.5 px-2.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Store Name & Country */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Nom du Commerce / Boutique *
                  </label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Pays de la Boutique
                  </label>
                  <select
                    value={countryCode}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold text-slate-800"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name} ({c.currencySymbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Business Type Selector (25+ Activities) */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Type d'Activité Commerciale (25+ secteurs)
                </label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-800"
                >
                  {BUSINESS_ACTIVITIES.map((act) => (
                    <option key={act.id} value={act.name}>
                      {act.icon} {act.name} ({act.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Currency & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Devise Monétaire Principale
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold text-slate-800"
                  >
                    <option value="CDF">CDF - Franc Congolais (FC)</option>
                    <option value="USD">USD - Dollar Américain ($)</option>
                    <option value="XOF">XOF - Franc CFA UEMOA (FCFA)</option>
                    <option value="XAF">XAF - Franc CFA CEMAC (FCFA)</option>
                    <option value="GNF">GNF - Franc Guinéen (FG)</option>
                    <option value="RWF">RWF - Franc Rwandais (FRw)</option>
                    <option value="EUR">EUR - Euro (€)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Téléphone Boutique / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+243 81 000 11 22"
                    className="w-full p-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Adresse Email Officielle (Reçus & Contact)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@maboutique.cd"
                    className="w-full p-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Adresse Physique / Commune
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Avenue du Commerce, Gombe, Kinshasa"
                    className="w-full p-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                {isSaved && (
                  <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Paramètres enregistrés avec succès !</span>
                  </span>
                )}
                <button
                  type="submit"
                  className="ml-auto py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 touch-press"
                >
                  Enregistrer les Modifications
                </button>
              </div>
            </form>
          </div>

          {/* Dedicated Session & Security Section */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-5">
            <div>
              <h3 className="font-bold text-slate-900 text-base mb-1 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span>Sécurité, Code PIN & Mots de Passe</span>
              </h3>
              <p className="text-xs text-slate-500">
                Modifiez votre code PIN superviseur à 4 chiffres ou votre mot de passe d'accès Cloud.
              </p>
            </div>

            {securitySuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{securitySuccessMsg}</span>
              </div>
            )}

            {securityErrorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{securityErrorMsg}</span>
              </div>
            )}

            {/* Change PIN & Change Password Forms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Formulaire Code PIN à 4 chiffres */}
              <form onSubmit={handleChangePin} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600" />
                  <h4 className="font-bold text-xs text-slate-900">Changer mon Code PIN (4 chiffres)</h4>
                </div>
                <p className="text-[11px] text-slate-500">
                  Utilisé pour déverrouiller la caisse et autoriser les remises ou changements de tarifs.
                </p>

                <div className="space-y-2 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                      Nouveau Code PIN (4 chiffres)
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="Ex: 8492"
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ""))}
                      className="w-full p-2 bg-white rounded-xl text-xs font-mono font-bold border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-center tracking-widest"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                      Confirmer le Nouveau Code PIN
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="Répétez les 4 chiffres"
                      value={confirmPinInput}
                      onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ""))}
                      className="w-full p-2 bg-white rounded-xl text-xs font-mono font-bold border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-center tracking-widest"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingSecurity || newPinInput.length !== 4}
                    className="w-full mt-2 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
                  >
                    Mettre à Jour mon Code PIN
                  </button>
                </div>
              </form>

              {/* 2. Formulaire Mot de Passe Principal */}
              <form onSubmit={handleChangePassword} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-bold text-xs text-slate-900">Changer mon Mot de Passe</h4>
                </div>
                <p className="text-[11px] text-slate-500">
                  Mot de passe de connexion à votre compte propriétaire sur le Web et Mobile.
                </p>

                <div className="space-y-2 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                      Nouveau Mot de Passe (min. 6 car.)
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      className="w-full p-2 bg-white rounded-xl text-xs font-bold border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                      Confirmer le Mot de Passe
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      className="w-full p-2 bg-white rounded-xl text-xs font-bold border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingSecurity || newPasswordInput.length < 6}
                    className="w-full mt-2 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
                  >
                    Mettre à Jour le Mot de Passe
                  </button>
                </div>
              </form>
            </div>

            {/* Quick Session Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              {/* Lock Terminal Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Lock className="w-4 h-4 text-blue-600" />
                    <h4 className="font-bold text-xs text-slate-900">Verrouiller la Caisse</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Demande le code PIN à 4 chiffres pour réaccéder. Idéal pour une pause ou changer de caissier sans fermer la session boutique.
                  </p>
                </div>
                <button
                  onClick={handleLock}
                  className="mt-3 w-full py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 touch-press"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Verrouiller (Code PIN)</span>
                </button>
              </div>

              {/* Disconnect / Logout Card */}
              <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <LogOut className="w-4 h-4 text-rose-600" />
                    <h4 className="font-bold text-xs text-rose-900">Se Déconnecter</h4>
                  </div>
                  <p className="text-[11px] text-rose-700 leading-relaxed">
                    Ferme complètement la session en cours sur ce terminal. Vous devrez renseigner vos identifiants ou choisir une boutique pour vous reconnecter.
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="mt-3 w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm shadow-rose-600/20 transition-colors flex items-center justify-center gap-1.5 touch-press"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Se Déconnecter</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sync Queue Inspector */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <span>File d'Attente de Synchronisation (`SyncQueue`)</span>
              </h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {syncQueueItems.length} mutation{syncQueueItems.length > 1 ? "s" : ""}
              </span>
            </div>

            {syncQueueItems.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl p-6 text-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-blue-500 mx-auto mb-1" />
                <p className="text-xs font-semibold text-slate-700">File vide : Tout est synchronisé</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Toutes les actions locales ont été transmises au serveur
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {syncQueueItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded font-bold text-slate-700">
                        {item.action}
                      </span>
                      <span className="font-semibold text-slate-800 uppercase text-[11px]">
                        {item.entity}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(item.createdAt).toLocaleTimeString("fr-FR")}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-5">
          {/* Sync Monitor */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base mb-3 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-blue-600" />
                <span>Moteur de Synchronisation</span>
              </h3>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-600 font-medium">État Réseau :</span>
                  <span
                    className={`text-xs font-bold flex items-center gap-1.5 ${
                      isOnline ? "text-blue-600" : "text-amber-600"
                    }`}
                  >
                    {isOnline ? (
                      <>
                        <Wifi className="w-3.5 h-3.5" />
                        <span>En Ligne (Actif)</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-3.5 h-3.5" />
                        <span>Hors-Ligne (Local)</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-600 font-medium">Mutations en attente :</span>
                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                    {pendingCount}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-600 font-medium">Dernière synchro :</span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString("fr-FR") : "Jamais"}
                  </span>
                </div>
              </div>

              {syncStatusMsg && (
                <div className="p-2.5 mb-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{syncStatusMsg}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 touch-press disabled:bg-slate-300"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Synchronisation..." : "Synchroniser Maintenant"}</span>
            </button>
          </div>

          {/* Local DB Metrics */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              <span>Données de cette Boutique</span>
            </h3>

            <div className="grid grid-cols-3 gap-2 text-center mb-4">
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <div className="text-xs font-black text-slate-900">{productsCount}</div>
                <div className="text-[10px] text-slate-400">Produits</div>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <div className="text-xs font-black text-slate-900">{customersCount}</div>
                <div className="text-[10px] text-slate-400">Clients</div>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <div className="text-xs font-black text-slate-900">{salesCount}</div>
                <div className="text-[10px] text-slate-400">Ventes</div>
              </div>
            </div>

            {/* Load demo catalog button */}
            <button
              onClick={handleLoadDemoCatalog}
              className="w-full py-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center gap-1.5 touch-press"
            >
              <PackagePlus className="w-3.5 h-3.5 text-blue-600" />
              <span>Charger Catalogue Démo</span>
            </button>

            {/* Restore normal prices button */}
            <button
              onClick={handleRestorePrices}
              className="w-full mt-2 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center gap-1.5 touch-press"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
              <span>Rétablir Prix Normaux (Correction)</span>
            </button>
          </div>

          {/* PWA Offline-First App Info */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                PWA
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">Application 100% Hors-Ligne</h4>
                <p className="text-[10px] text-blue-400 font-semibold">Service Worker & IndexedDB Actifs</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
              L'application reste accessible et opérationnelle même lorsque vous coupez totalement votre connexion Internet.
            </p>
            <div className="bg-white/10 rounded-2xl p-2.5 text-[10px] text-slate-300 space-y-1">
              <div className="flex items-center justify-between">
                <span>Mise en cache du shell :</span>
                <span className="text-emerald-400 font-bold">Actif (sw.js)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Base locale :</span>
                <span className="text-blue-300 font-bold">Dexie v5 (IndexedDB)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
