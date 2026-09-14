"use client";

import React, { useState } from "react";
import {
  Search,
  CheckCircle2,
  Plus,
  Minus,
  Trash2,
  Users,
  LayoutGrid,
  Percent,
  Bookmark,
  Utensils,
  Coffee,
  Sparkles,
} from "lucide-react";

interface POSItem {
  id: string;
  name: string;
  category: "all" | "burger" | "chicken" | "drink" | "coffee";
  priceUSD: number;
  priceCDF: number;
  emoji: string;
}

const ITEMS: POSItem[] = [
  { id: "1", name: "Deluxe Crispy Burger", category: "burger", priceUSD: 6.99, priceCDF: 19500, emoji: "🍔" },
  { id: "2", name: "Classic Crispyburger", category: "burger", priceUSD: 4.75, priceCDF: 13300, emoji: "🍔" },
  { id: "3", name: "Special Crispy Chicken", category: "chicken", priceUSD: 5.75, priceCDF: 16100, emoji: "🍗" },
  { id: "4", name: "Special Burger", category: "burger", priceUSD: 6.49, priceCDF: 18100, emoji: "🍔" },
  { id: "5", name: "Spicy Chicken Wings", category: "chicken", priceUSD: 5.49, priceCDF: 15300, emoji: "🍗" },
  { id: "6", name: "Cheeseburger Double", category: "burger", priceUSD: 5.20, priceCDF: 14500, emoji: "🍔" },
  { id: "7", name: "Combo Drumsticks", category: "chicken", priceUSD: 8.99, priceCDF: 25100, emoji: "🍗" },
  { id: "8", name: "Double Cheeseburger", category: "burger", priceUSD: 7.25, priceCDF: 20300, emoji: "🍔" },
  { id: "9", name: "Coca-Cola 33cl", category: "drink", priceUSD: 3.00, priceCDF: 8400, emoji: "🥤" },
  { id: "10", name: "Classic Cheeseburger", category: "burger", priceUSD: 4.99, priceCDF: 13900, emoji: "🍔" },
  { id: "11", name: "Chocolate Milkshake", category: "drink", priceUSD: 3.50, priceCDF: 9800, emoji: "🥤" },
  { id: "12", name: "Espresso Italiano", category: "coffee", priceUSD: 2.50, priceCDF: 7000, emoji: "☕" },
];

export default function PosInteractiveMockup() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [diningOption, setDiningOption] = useState<"dine-in" | "take-away">("dine-in");
  const [searchQuery, setSearchQuery] = useState("");
  const [currency, setCurrency] = useState<"CDF" | "USD">("USD");

  const [cart, setCart] = useState<{ item: POSItem; quantity: number }[]>([
    { item: ITEMS[1], quantity: 1 },
    { item: ITEMS[7], quantity: 1 },
    { item: ITEMS[10], quantity: 2 },
  ]);

  const [processedAlert, setProcessedAlert] = useState<boolean>(false);

  const filteredItems = ITEMS.filter((item) => {
    const matchesCat = activeCategory === "all" || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const addToCart = (item: POSItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.item.id === id) {
            const newQty = c.quantity + delta;
            return newQty > 0 ? { ...c, quantity: newQty } : null;
          }
          return c;
        })
        .filter(Boolean) as { item: POSItem; quantity: number }[]
    );
  };

  const clearCart = () => setCart([]);

  const subtotalUSD = cart.reduce((acc, c) => acc + c.item.priceUSD * c.quantity, 0);
  const taxUSD = subtotalUSD > 0 ? 1.50 : 0;
  const totalUSD = subtotalUSD > 0 ? subtotalUSD + taxUSD : 0;

  const subtotalCDF = cart.reduce((acc, c) => acc + c.item.priceCDF * c.quantity, 0);
  const taxCDF = subtotalCDF > 0 ? 4200 : 0;
  const totalCDF = subtotalCDF > 0 ? subtotalCDF + taxCDF : 0;

  const handleProcessTransaction = () => {
    if (cart.length === 0) return;
    setProcessedAlert(true);
    setTimeout(() => {
      setProcessedAlert(false);
      setCart([
        { item: ITEMS[0], quantity: 1 },
        { item: ITEMS[8], quantity: 1 },
      ]);
    }, 2400);
  };

  return (
    <div className="w-full max-w-5xl mx-auto rounded-3xl border border-slate-200/90 bg-white text-slate-900 shadow-2xl text-left font-sans overflow-hidden transition-all">
      {/* Top Tablet Navigation Bar */}
      <div className="px-4 sm:px-6 py-3 border-b border-slate-100 flex items-center justify-between gap-4 bg-white">
        <div className="flex items-center gap-3">
          {/* Hamburger icon */}
          <button className="text-slate-400 hover:text-slate-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <img
              src="/images/logo.png"
              alt="Kuettu Global POS"
              className="h-6 w-auto object-contain"
            />
            <span className="font-bold text-sm text-slate-900 tracking-tight">Kuettu POS</span>
          </div>
        </div>

        {/* Center Search Input */}
        <div className="flex-1 max-w-xs sm:max-w-sm relative hidden sm:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Product..."
            className="w-full pl-9 pr-3 py-1.5 rounded-full text-xs outline-none bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-blue-500 transition-all"
          />
        </div>

        {/* Right Status & Currency */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>0.0ms Hors-Ligne</span>
          </div>

          <div className="flex items-center p-0.5 rounded-lg border border-slate-200 bg-slate-100 text-[11px] font-bold">
            <button
              onClick={() => setCurrency("USD")}
              className={`px-2 py-0.5 rounded transition-all ${
                currency === "USD" ? "bg-white text-blue-600 shadow-xs" : "text-slate-500"
              }`}
            >
              $ USD
            </button>
            <button
              onClick={() => setCurrency("CDF")}
              className={`px-2 py-0.5 rounded transition-all ${
                currency === "CDF" ? "bg-white text-blue-600 shadow-xs" : "text-slate-500"
              }`}
            >
              FC
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Categories Left + Products Center + Order Panel Right */}
      <div className="grid grid-cols-12 min-h-[460px]">
        {/* Left Side Category Bar */}
        <div className="col-span-2 sm:col-span-1 py-4 flex flex-col items-center gap-4 border-r border-slate-100 bg-slate-50/60">
          <button
            onClick={() => setActiveCategory("all")}
            className={`w-full flex flex-col items-center py-2 px-1 relative transition-all ${
              activeCategory === "all" ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {activeCategory === "all" && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r" />
            )}
            <Utensils className="w-5 h-5 mb-1" />
            <span className="text-[10px] text-center leading-tight">All Menu</span>
          </button>

          <button
            onClick={() => setActiveCategory("burger")}
            className={`w-full flex flex-col items-center py-2 px-1 relative transition-all ${
              activeCategory === "burger" ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {activeCategory === "burger" && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r" />
            )}
            <span className="text-xl mb-0.5">🍔</span>
            <span className="text-[10px] text-center leading-tight">Burger</span>
          </button>

          <button
            onClick={() => setActiveCategory("chicken")}
            className={`w-full flex flex-col items-center py-2 px-1 relative transition-all ${
              activeCategory === "chicken" ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {activeCategory === "chicken" && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r" />
            )}
            <span className="text-xl mb-0.5">🍗</span>
            <span className="text-[10px] text-center leading-tight">Fried Chicken</span>
          </button>

          <button
            onClick={() => setActiveCategory("drink")}
            className={`w-full flex flex-col items-center py-2 px-1 relative transition-all ${
              activeCategory === "drink" ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {activeCategory === "drink" && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r" />
            )}
            <span className="text-xl mb-0.5">🥤</span>
            <span className="text-[10px] text-center leading-tight">Drink</span>
          </button>

          <button
            onClick={() => setActiveCategory("coffee")}
            className={`w-full flex flex-col items-center py-2 px-1 relative transition-all ${
              activeCategory === "coffee" ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {activeCategory === "coffee" && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r" />
            )}
            <Coffee className="w-5 h-5 mb-1" />
            <span className="text-[10px] text-center leading-tight">Coffee</span>
          </button>
        </div>

        {/* Center: Products Grid */}
        <div className="col-span-10 sm:col-span-7 p-3 sm:p-4 border-r border-slate-100 overflow-y-auto max-h-[500px]">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
            {filteredItems.map((prod) => {
              const cartEntry = cart.find((c) => c.item.id === prod.id);
              return (
                <div
                  key={prod.id}
                  onClick={() => addToCart(prod)}
                  className="p-2.5 rounded-2xl border border-slate-100 bg-white hover:border-blue-400 hover:shadow-md hover:shadow-blue-500/10 text-left cursor-pointer transition-all duration-200 relative group flex flex-col justify-between"
                >
                  {/* Item Image area */}
                  <div className="w-full h-20 rounded-xl bg-slate-50 flex items-center justify-center text-4xl mb-2 relative overflow-hidden group-hover:scale-105 transition-transform">
                    <span>{prod.emoji}</span>
                    {cartEntry && (
                      <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                        {cartEntry.quantity}
                      </span>
                    )}
                  </div>

                  {/* Name & Price */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 truncate">{prod.name}</h4>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-extrabold text-slate-700">
                        {currency === "USD"
                          ? `$ ${prod.priceUSD.toFixed(2)}`
                          : `${prod.priceCDF.toLocaleString()} FC`}
                      </span>
                      {cartEntry && (
                        <span className="text-[10px] text-blue-600 font-bold">
                          x {cartEntry.quantity}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Order Details Panel */}
        <div className="col-span-12 sm:col-span-4 p-4 flex flex-col justify-between bg-white">
          <div>
            {/* Top 4 Actions Grid: Customer, Tables, Discount, Save Bill */}
            <div className="grid grid-cols-4 gap-1.5 mb-4">
              <button className="py-2 px-1 rounded-xl border border-slate-200/80 bg-slate-50 text-slate-700 hover:bg-slate-100 flex flex-col items-center justify-center gap-1 transition-all">
                <Users className="w-3.5 h-3.5" />
                <span className="text-[10px] font-medium">Customer</span>
              </button>

              <button className="py-2 px-1 rounded-xl border border-slate-200/80 bg-slate-50 text-slate-700 hover:bg-slate-100 flex flex-col items-center justify-center gap-1 transition-all">
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="text-[10px] font-medium">Tables</span>
              </button>

              <button className="py-2 px-1 rounded-xl border border-slate-200/80 bg-slate-50 text-slate-700 hover:bg-slate-100 flex flex-col items-center justify-center gap-1 transition-all">
                <Percent className="w-3.5 h-3.5" />
                <span className="text-[10px] font-medium">Discount</span>
              </button>

              <button className="py-2 px-1 rounded-xl border border-slate-200/80 bg-slate-50 text-slate-700 hover:bg-slate-100 flex flex-col items-center justify-center gap-1 transition-all">
                <Bookmark className="w-3.5 h-3.5" />
                <span className="text-[10px] font-medium">Save Bill</span>
              </button>
            </div>

            {/* Title & Dine In / Take Away Segmented Toggle */}
            <div className="mb-3">
              <h3 className="text-sm font-black text-slate-900 mb-2">Order Details</h3>
              <div className="p-1 rounded-xl border border-slate-200/70 bg-slate-100 grid grid-cols-2 text-center text-xs font-bold">
                <button
                  onClick={() => setDiningOption("dine-in")}
                  className={`py-1 rounded-lg transition-all ${
                    diningOption === "dine-in"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500"
                  }`}
                >
                  Dine In
                </button>
                <button
                  onClick={() => setDiningOption("take-away")}
                  className={`py-1 rounded-lg transition-all ${
                    diningOption === "take-away"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500"
                  }`}
                >
                  Take Away
                </button>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  Panier vide. Touchez un article pour l'ajouter !
                </div>
              ) : (
                cart.map(({ item, quantity }) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-xs py-1 border-b border-slate-100"
                  >
                    <div className="truncate max-w-[130px]">
                      <p className="font-semibold text-slate-800 truncate text-[11px]">{item.name}</p>
                      <p className="text-[10px] text-slate-400">
                        x{quantity} {currency === "USD" ? `$${item.priceUSD.toFixed(2)}` : `${item.priceCDF.toLocaleString()} FC`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">
                        {currency === "USD"
                          ? `$ ${(item.priceUSD * quantity).toFixed(2)}`
                          : `${(item.priceCDF * quantity).toLocaleString()} FC`}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="w-5 h-5 rounded flex items-center justify-center bg-slate-100 text-slate-600 hover:text-slate-900"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="w-5 h-5 rounded flex items-center justify-center bg-slate-100 text-slate-600 hover:text-slate-900"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="text-right pt-2">
                <button
                  onClick={clearCart}
                  className="text-[10px] text-slate-400 hover:text-rose-500 transition-colors"
                >
                  Clear All Order
                </button>
              </div>
            )}
          </div>

          {/* Subtotal / Tax / Total & Big Blue Button */}
          <div className="pt-3 border-t border-slate-100 space-y-1.5 mt-2">
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Subtotal</span>
              <span className="font-medium text-slate-700">
                {currency === "USD" ? `$ ${subtotalUSD.toFixed(2)}` : `${subtotalCDF.toLocaleString()} FC`}
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Tax</span>
              <span className="font-medium text-slate-700">
                {currency === "USD" ? `$ ${taxUSD.toFixed(2)}` : `${taxCDF.toLocaleString()} FC`}
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Voucher</span>
              <span className="font-medium text-slate-700">$ 0.00</span>
            </div>
            <div className="flex justify-between text-sm font-black pt-1">
              <span>Total</span>
              <span className="text-base font-extrabold text-slate-900">
                {currency === "USD" ? `$ ${totalUSD.toFixed(2)}` : `${totalCDF.toLocaleString()} FC`}
              </span>
            </div>

            {processedAlert ? (
              <div className="w-full py-2.5 px-3 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center justify-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4" />
                <span>Vente Encaissée (0.0ms Hors-Ligne)</span>
              </div>
            ) : (
              <button
                onClick={handleProcessTransaction}
                disabled={cart.length === 0}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs tracking-wide transition-all shadow-md shadow-blue-500/20 active:scale-98"
              >
                Process Transaction
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
