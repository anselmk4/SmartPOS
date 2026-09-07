"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Store,
  Search,
  Phone,
  MapPin,
  MessageCircle,
  Package,
  Layers,
  Sparkles,
  Share2,
  ExternalLink,
  Check,
  AlertCircle,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";

interface PublicProduct {
  id: string;
  name: string;
  unitPrice: number;
  category: string;
  imageUrl?: string | null;
  barcode?: string | null;
}

interface PublicStore {
  id: string;
  name: string;
  businessType: string;
  currency: string;
  phone?: string | null;
  address?: string | null;
  ownerName?: string | null;
  countryCode: string;
  logoUrl?: string | null;
}

export default function PublicStoreCatalogPage() {
  const params = useParams();
  const storeId = params?.storeId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [store, setStore] = useState<PublicStore | null>(null);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!storeId) return;

    let isMounted = true;
    async function fetchCatalog() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/v1/public/catalog/${encodeURIComponent(storeId)}`);
        const data = await res.json();

        if (!isMounted) return;

        if (!res.ok || !data.success) {
          setError(data.error || "Impossible de charger le catalogue de cette boutique.");
          return;
        }

        setStore(data.store);
        setProducts(data.products || []);
        setCategories(data.categories || []);
      } catch (err: any) {
        if (isMounted) {
          setError("Erreur de connexion lors du chargement des tarifs.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchCatalog();
    return () => {
      isMounted = false;
    };
  }, [storeId]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        searchTerm.trim() === "" ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCategory =
        selectedCategory === "ALL" || p.category?.trim().toLowerCase() === selectedCategory.toLowerCase();

      return matchSearch && matchCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const formatPrice = (price: number) => {
    const cur = store?.currency || "CDF";
    return `${price.toLocaleString()} ${cur}`;
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const openWhatsAppOrder = (product?: PublicProduct) => {
    if (!store?.phone) return;
    const cleanPhone = store.phone.replace(/[^0-9]/g, "");
    
    let message = `Bonjour *${store.name}* !\nJ'ai consulté votre catalogue en ligne.`;
    if (product) {
      message += `\n\nJe souhaite me renseigner / commander l'article suivant :\n👉 *${product.name}*\n💰 Prix affiché : *${formatPrice(product.unitPrice)}*`;
    } else {
      message += `\n\nJe souhaite passer une commande / poser une question sur vos tarifs.`;
    }

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-3xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20 animate-bounce mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <p className="text-sm font-bold text-slate-700">Chargement des tarifs en direct...</p>
        <p className="text-xs text-slate-400 mt-1">Synchronisation avec la caisse</p>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4 shadow-sm">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-black text-slate-900 mb-2">Boutique introuvable</h1>
        <p className="text-sm text-slate-500 max-w-sm mb-6">
          {error || "Ce catalogue n'est pas disponible ou l'adresse est incorrecte."}
        </p>
        <a
          href="/"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl shadow-lg shadow-blue-500/20 transition-all"
        >
          Retour à l'accueil
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 pb-16 antialiased">
      {/* Top Banner Notice */}
      <div className="bg-slate-900 text-white text-[11px] font-medium py-1.5 px-4 text-center flex items-center justify-center gap-1.5 shadow-sm">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>Tarifs officiels vérifiés & mis à jour par l'établissement</span>
      </div>

      {/* Main Header / Store Hero Card */}
      <div className="max-w-3xl mx-auto px-4 pt-4 sm:pt-6">
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-md">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            {/* Store Avatar / Logo */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0 font-black text-2xl overflow-hidden border-2 border-white">
              {store.logoUrl ? (
                <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                <span>{store.name.substring(0, 2).toUpperCase()}</span>
              )}
            </div>

            {/* Store Details */}
            <div className="flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {store.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {store.businessType}
                </span>
              </div>

              {store.address && (
                <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{store.address}</span>
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                {store.phone && (
                  <button
                    onClick={() => openWhatsAppOrder()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
                    <span>Contacter sur WhatsApp</span>
                  </button>
                )}

                {store.phone && (
                  <a
                    href={`tel:${store.phone}`}
                    className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Appeler</span>
                  </a>
                )}

                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                  title="Partager le lien du catalogue"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Lien copié !</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Partager</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Search & Category Bar */}
      <div className="max-w-3xl mx-auto px-4 mt-4 sticky top-2 z-20">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 border border-slate-200/80 shadow-lg flex flex-col gap-2.5">
          {/* Live Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher un article, boisson, plat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2.5 bg-slate-100/90 focus:bg-white rounded-xl text-xs sm:text-sm font-medium border border-transparent focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-200/70 rounded-full w-5 h-5 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>

          {/* Categories Horizontal Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs font-semibold">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                selectedCategory === "ALL"
                  ? "bg-slate-900 text-white font-bold shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              Tous ({products.length})
            </button>
            {categories.map((cat) => {
              const count = products.filter((p) => p.category?.toLowerCase() === cat.toLowerCase()).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? "bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/20"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Catalog Items Grid */}
      <div className="max-w-3xl mx-auto px-4 mt-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {filteredProducts.length} article{filteredProducts.length > 1 ? "s" : ""} disponible{filteredProducts.length > 1 ? "s" : ""}
          </p>
          <span className="text-[11px] text-slate-400 font-medium">Devise : {store.currency}</span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-sm mt-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">Aucun article trouvé</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4">
              Aucun produit ne correspond à votre recherche "{searchTerm}".
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("ALL");
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl p-3.5 border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all flex items-center gap-3.5 group"
              >
                {/* Product Thumbnail */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 overflow-hidden relative">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <Package className="w-7 h-7 text-slate-300 stroke-1" />
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                      {product.category || "Général"}
                    </span>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 line-clamp-2 leading-tight mt-0.5">
                      {product.name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-slate-100">
                    <div className="text-sm sm:text-base font-black text-blue-700 tracking-tight">
                      {formatPrice(product.unitPrice)}
                    </div>

                    {store.phone && (
                      <button
                        onClick={() => openWhatsAppOrder(product)}
                        className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold transition-colors inline-flex items-center gap-1"
                        title="Commander via WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                        <span className="hidden xs:inline">Commander</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Public Footer */}
      <footer className="max-w-3xl mx-auto px-4 mt-10 text-center">
        <div className="pt-6 border-t border-slate-200 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{store.name}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>Catalogue en ligne synchronisé & propulsé par</span>
            <a href="/" className="inline-flex items-center gap-1 font-black text-blue-600 hover:text-blue-700 hover:underline">
              <img src="/images/logo.png" alt="Kuettu Global POS" className="h-4 w-auto object-contain inline-block" />
              <span>Kuettu Global POS</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
