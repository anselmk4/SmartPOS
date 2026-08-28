"use client";

import React, { useState } from "react";
import {
  WifiOff,
  Sparkles,
  CheckCircle2,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Zap,
  Smartphone,
  Banknote,
  Check,
  RefreshCw,
} from "lucide-react";

interface ProductItem {
  id: string;
  name: string;
  category: string;
  priceCDF: number;
  priceUSD: number;
  stock: number;
  emoji: string;
  color: string;
}

const DEMO_PRODUCTS: ProductItem[] = [
  {
    id: "p1",
    name: "Primus 72cl",
    category: "Boissons",
    priceCDF: 4500,
    priceUSD: 1.6,
    stock: 48,
    emoji: "🍺",
    color: "from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-300",
  },
  {
    id: "p2",
    name: "Sucre 1kg",
    category: "Alimentation",
    priceCDF: 3200,
    priceUSD: 1.15,
    stock: 120,
    emoji: "🍚",
    color: "from-sky-500/20 to-blue-500/20 border-sky-500/30 text-sky-300",
  },
  {
    id: "p3",
    name: "Savon Le Coq",
    category: "Ménage",
    priceCDF: 1500,
    priceUSD: 0.55,
    stock: 85,
    emoji: "🧼",
    color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-300",
  },
  {
    id: "p4",
    name: "Huile Végétale 1L",
    category: "Alimentation",
    priceCDF: 6500,
    priceUSD: 2.3,
    stock: 32,
    emoji: "🌻",
    color: "from-yellow-500/20 to-amber-500/20 border-yellow-500/30 text-yellow-300",
  },
  {
    id: "p5",
    name: "Pain Baguette",
    category: "Boulangerie",
    priceCDF: 1000,
    priceUSD: 0.35,
    stock: 60,
    emoji: "🥖",
    color: "from-orange-500/20 to-amber-500/20 border-orange-500/30 text-orange-300",
  },
  {
    id: "p6",
    name: "Coca-Cola 33cl",
    category: "Boissons",
    priceCDF: 2500,
    priceUSD: 0.9,
    stock: 75,
    emoji: "🥤",
    color: "from-rose-500/20 to-red-500/20 border-rose-500/30 text-rose-300",
  },
];

export default function PosInteractiveMockup() {
  const [currency, setCurrency] = useState<"CDF" | "USD">("CDF");
  const [cart, setCart] = useState<{ product: ProductItem; quantity: number }[]>([
    { product: DEMO_PRODUCTS[0], quantity: 2 },
    { product: DEMO_PRODUCTS[2], quantity: 1 },
  ]);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  const addToCart = (product: ProductItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as { product: ProductItem; quantity: number }[]
    );
  };

  const clearCart = () => setCart([]);

  const totalAmountCDF = cart.reduce((sum, item) => sum + item.product.priceCDF * item.quantity, 0);
  const totalAmountUSD = cart.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0);

  const handleCheckout = (method: string) => {
    if (cart.length === 0) return;
    setPaymentSuccess(method);
    setTimeout(() => {
      setPaymentSuccess(null);
      setCart([
        { product: DEMO_PRODUCTS[1], quantity: 1 },
        { product: DEMO_PRODUCTS[3], quantity: 1 },
      ]);
    }, 2800);
  };

  return (
    <div className="relative rounded-3xl p-1 bg-gradient-to-b from-slate-700/60 via-slate-800/80 to-slate-950/90 shadow-2xl shadow-emerald-950/40 border border-slate-700/80 backdrop-blur-xl">
      {/* Glow highlight effects */}
      <div className="absolute -top-6 -right-6 w-36 h-36 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-6 -left-6 w-36 h-36 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

      {/* POS Device Frame */}
      <div className="relative rounded-[22px] bg-slate-950/95 overflow-hidden border border-slate-800 text-slate-100 font-sans shadow-inner">
        {/* Top Header Bar */}
        <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800/90 flex items-center justify-between gap-3 text-xs">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-emerald-400 text-[11px] sm:text-xs">
              100% Hors-Ligne Actif
            </span>
            <span className="hidden sm:inline text-slate-500">•</span>
            <span className="hidden sm:inline text-slate-400 text-[11px]">Latence : 0ms</span>
          </div>

          {/* Controls: Currency switcher */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-0.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setCurrency("CDF")}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                currency === "CDF"
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              CDF (FC)
            </button>
            <button
              onClick={() => setCurrency("USD")}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                currency === "USD"
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              USD ($)
            </button>
          </div>
        </div>

        {/* POS Body Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
          {/* Left Area: Product catalog grid */}
          <div className="md:col-span-7 p-3.5 sm:p-4 border-b md:border-b-0 md:border-r border-slate-800/80 bg-slate-950/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <span>Catalogue Caisse Rapide</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded-md border border-emerald-800/60">
                  Toucher pour ajouter
                </span>
              </div>
              <span className="text-[10px] text-slate-500">6 articles rapides</span>
            </div>

            {/* Grid of items */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DEMO_PRODUCTS.map((prod) => (
                <button
                  key={prod.id}
                  onClick={() => addToCart(prod)}
                  className={`p-2.5 rounded-2xl bg-gradient-to-b ${prod.color} border hover:scale-[1.03] active:scale-[0.98] transition-all text-left flex flex-col justify-between h-[88px] relative group shadow-sm`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xl">{prod.emoji}</span>
                    <span className="text-[9px] font-semibold text-slate-400 bg-slate-900/60 px-1 py-0.5 rounded">
                      Qté: {prod.stock}
                    </span>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-200 truncate leading-tight">
                      {prod.name}
                    </p>
                    <p className="text-[11px] font-black text-emerald-400 mt-0.5">
                      {currency === "CDF"
                        ? `${prod.priceCDF.toLocaleString()} FC`
                        : `$${prod.priceUSD.toFixed(2)}`}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Local Sync Wave indicator */}
            <div className="mt-3.5 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                <span>Base locale DexieDB / IndexedDB synchronisée</span>
              </div>
              <span className="text-emerald-400 font-semibold font-mono">0.0ms</span>
            </div>
          </div>

          {/* Right Area: Interactive Cart & Checkout */}
          <div className="md:col-span-5 p-3.5 sm:p-4 flex flex-col justify-between bg-slate-900/50">
            <div>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Panier en cours</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded-full">
                    {cart.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Vider</span>
                  </button>
                )}
              </div>

              {/* Cart List */}
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    Panier vide. Touchez un article à gauche !
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-1.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="truncate max-w-[90px] sm:max-w-[110px]">
                        <p className="font-semibold text-slate-200 text-[11px] truncate">
                          {item.product.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {currency === "CDF"
                            ? `${(item.product.priceCDF * item.quantity).toLocaleString()} FC`
                            : `$${(item.product.priceUSD * item.quantity).toFixed(2)}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 bg-slate-900 px-1.5 py-0.5 rounded-lg border border-slate-800">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="text-slate-400 hover:text-slate-200 p-0.5"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="text-xs font-bold text-emerald-400 font-mono min-w-[12px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="text-slate-400 hover:text-slate-200 p-0.5"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Total & Checkout Buttons */}
            <div className="mt-3 pt-2.5 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Total à Payer</span>
                <span className="text-base sm:text-lg font-black text-white font-mono">
                  {currency === "CDF"
                    ? `${totalAmountCDF.toLocaleString()} FC`
                    : `$${totalAmountUSD.toFixed(2)}`}
                </span>
              </div>

              {/* Payment Success Overlay */}
              {paymentSuccess ? (
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center animate-fadeIn flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Ticket Imprimé via {paymentSuccess} ! (0ms)</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handleCheckout("Cash")}
                    disabled={cart.length === 0}
                    className="py-2 px-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:opacity-40 text-slate-950 font-black text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-950"
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Cash Espèces</span>
                  </button>

                  <button
                    onClick={() => handleCheckout("M-Pesa / Mobile Money")}
                    disabled={cart.length === 0}
                    className="py-2 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 disabled:opacity-40 text-slate-950 font-black text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-950"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Mobile Money</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
