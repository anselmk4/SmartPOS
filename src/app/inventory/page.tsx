"use client";

import React, { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, generateUUID, DEFAULT_STORE_ID, enqueueSync, processStockTransfer } from "@/lib/db/dexie-db";
import { useSync } from "@/lib/sync/sync-context";
import { useAuth } from "@/lib/auth/auth-context";
import { PinLockScreen } from "@/components/auth/pin-lock-screen";
import { UpgradePromptModal } from "@/components/plans/upgrade-prompt-modal";
import ExportReportModal from "@/components/reports/export-report-modal";
import type { Product, StockDeltaPayload } from "@/lib/shared/types";
import { uploadMediaFile } from "@/lib/storage/media-storage";
import { compressImageFile } from "@/lib/utils/image-compressor";
import {
  Package,
  Search,
  Plus,
  ArrowUpDown,
  AlertTriangle,
  Barcode,
  Edit2,
  Trash2,
  TrendingUp,
  Boxes,
  PackagePlus,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Building,
  ArrowRightLeft,
  Image as ImageIcon,
  Upload,
  Camera,
  QrCode,
  Layers,
} from "lucide-react";
import { StoreQRModal } from "@/components/catalog/store-qr-modal";
import { PaginationControl } from "@/components/shared/pagination-control";
import { BulkProductModal } from "@/components/inventory/bulk-product-modal";

export default function InventoryPage() {
  const { tenant, store: authStore, stores, user, isAuthenticated, isLoading, isOwner, isManager, plan, canAccess } = useAuth();
  const { formatMoney, currency } = useSync();

  const currentStoreId = authStore?.id || DEFAULT_STORE_ID;
  const products = useLiveQuery(async () => {
    if (!currentStoreId) return [];
    return await db.products
      .filter((p) => p.storeId === currentStoreId)
      .toArray();
  }, [currentStoreId]) || [];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Modals
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);
  const [selectedProductForStockAdjust, setSelectedProductForStockAdjust] = useState<Product | null>(null);

  // Pagination State (25, 50, 100, 200)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Form State for Add / Edit Product
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Alimentation");
  const [formUnitPrice, setFormUnitPrice] = useState<number>(0);
  const [formCostPrice, setFormCostPrice] = useState<number>(0);
  const [formStockQty, setFormStockQty] = useState<number>(0);
  const [formMinAlert, setFormMinAlert] = useState<number>(5);
  const [formBarcode, setFormBarcode] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [inventoryToast, setInventoryToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showInventoryToast = (message: string, type: "success" | "error" = "success") => {
    setInventoryToast({ message, type });
    setTimeout(() => setInventoryToast(null), 4000);
  };

  // Stock Adjust State
  const [adjustQuantity, setAdjustQuantity] = useState<number>(0);
  const [adjustType, setAdjustType] = useState<"ADD" | "SET">("ADD");
  const [adjustReason, setAdjustReason] = useState<"RESTOCK" | "INVENTORY_CORRECTION" | "TRANSFER_IN" | "TRANSFER_OUT">("RESTOCK");

  // Stock Transfer State
  const [transferProductId, setTransferProductId] = useState("");
  const [transferTargetStoreId, setTransferTargetStoreId] = useState("");
  const [transferQuantity, setTransferQuantity] = useState<number>(1);
  const [transferNotes, setTransferNotes] = useState("");
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set<string>(["Tous"]);
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchQuery));
      const matchCat = selectedCategory === "Tous" || p.category === selectedCategory;
      const matchLowStock = !showLowStockOnly || p.stockQuantity <= p.minStockAlert;
      return matchSearch && matchCat && matchLowStock;
    });
  }, [products, searchQuery, selectedCategory, showLowStockOnly]);

  // Reset to page 1 on filter change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, showLowStockOnly]);

  // Paginated products slice
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const totalStockValue = useMemo(() => {
    return products.reduce((acc, p) => acc + p.stockQuantity * (p.costPrice || p.unitPrice * 0.8), 0);
  }, [products]);

  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.stockQuantity <= p.minStockAlert);
  }, [products]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-100">
        <div className="text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Chargement du stock...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PinLockScreen title="Gestion de Stock Verrouillée" />;
  }

  if (!isOwner && !isManager) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full p-6 bg-white rounded-3xl border border-slate-200 shadow-sm text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Accès Réservé au Gérant</h3>
          <p className="text-xs text-slate-500">
            La gestion des articles, des stocks et des coûts est réservée au Gérant ou Manager.
          </p>
        </div>
      </div>
    );
  }

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, {
          maxWidth: 800,
          maxHeight: 800,
          quality: 0.82,
        });
        if (compressed) {
          setFormImageUrl(compressed);
        }
      } catch (err) {
        console.error("Erreur compression image produit:", err);
      }
    }
  };

  const handleOpenAdd = () => {
    setSelectedProductForEdit(null);
    setFormName("");
    setFormCategory("Alimentation");
    setFormUnitPrice(0);
    setFormCostPrice(0);
    setFormStockQty(0);
    setFormMinAlert(5);
    setFormBarcode("");
    setFormImageUrl("");
    setIsAddProductModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setSelectedProductForEdit(p);
    setFormName(p.name);
    setFormCategory(p.category);
    setFormUnitPrice(p.unitPrice);
    setFormCostPrice(p.costPrice || 0);
    setFormStockQty(p.stockQuantity);
    setFormMinAlert(p.minStockAlert || 5);
    setFormBarcode(p.barcode || "");
    setFormImageUrl(p.imageUrl || "");
    setIsAddProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || isSubmittingProduct) return;

    setIsSubmittingProduct(true);
    try {
      const now = new Date().toISOString();

      // Upload image to Supabase Storage if it's a new Base64 string
      let finalImageUrl = formImageUrl.trim() || undefined;
      if (finalImageUrl && finalImageUrl.startsWith("data:image")) {
        const uploadRes = await uploadMediaFile(finalImageUrl, {
          folder: "products",
          fileName: `${formName.trim().toLowerCase().replace(/[^a-z0-9]/g, "_")}.jpg`,
        });
        if (uploadRes.url) {
          finalImageUrl = uploadRes.url;
        }
      }

      if (selectedProductForEdit) {
        const updated: Product = {
          ...selectedProductForEdit,
          name: formName.trim(),
          category: formCategory,
          unitPrice: formUnitPrice,
          costPrice: formCostPrice,
          stockQuantity: formStockQty,
          minStockAlert: formMinAlert,
          barcode: formBarcode.trim() || undefined,
          imageUrl: finalImageUrl,
          updatedAt: now,
          isSynced: false,
        };

        await db.products.put(updated);
        await enqueueSync({
          tenantId: tenant?.id,
          storeId: currentStoreId,
          entity: "product",
          action: "UPDATE",
          payload: JSON.stringify(updated),
        });
        showInventoryToast(`Article "${formName.trim()}" mis à jour avec succès !`);
      } else {
        const newId = generateUUID();
        const newProduct: Product = {
          id: newId,
          tenantId: tenant?.id,
          storeId: currentStoreId,
          name: formName.trim(),
          category: formCategory,
          unitPrice: formUnitPrice,
          costPrice: formCostPrice,
          stockQuantity: formStockQty,
          minStockAlert: formMinAlert,
          barcode: formBarcode.trim() || undefined,
          imageUrl: finalImageUrl,
          isSynced: false,
          createdAt: now,
          updatedAt: now,
        };

        await db.products.add(newProduct);
        await enqueueSync({
          tenantId: tenant?.id,
          storeId: currentStoreId,
          entity: "product",
          action: "CREATE",
          payload: JSON.stringify(newProduct),
        });
        showInventoryToast(`✅ Article "${formName.trim()}" ajouté au stock ! (Quantité : ${formStockQty})`);
      }

      setIsAddProductModalOpen(false);
    } catch (err: any) {
      console.error("[Save Product Error]:", err);
      showInventoryToast("Erreur lors de l'enregistrement : " + (err.message || "Erreur inconnue"), "error");
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!isOwner) {
      alert("Seul le propriétaire de la boutique est autorisé à supprimer un article du stock.");
      return;
    }

    if (
      !confirm(
        `⚠️ SUPPRESSION D'ARTICLE\n\nVoulez-vous vraiment supprimer définitivement "${product.name}" du stock ?\n\nCette action est irréversible.`
      )
    ) {
      return;
    }

    try {
      await db.products.delete(product.id);
      await enqueueSync({
        tenantId: tenant?.id || "",
        storeId: currentStoreId,
        entity: "product",
        action: "DELETE",
        payload: JSON.stringify({ id: product.id }),
      });
      if (selectedProductForEdit?.id === product.id) {
        setIsAddProductModalOpen(false);
        setSelectedProductForEdit(null);
      }
    } catch (err: any) {
      console.error("[Delete Product Error]:", err);
      alert("Erreur lors de la suppression de l'article : " + (err.message || "Erreur inconnue"));
    }
  };

  const handleSubmitStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForStockAdjust) return;

    const currentQty = selectedProductForStockAdjust.stockQuantity;
    const finalQty =
      adjustType === "ADD" ? currentQty + adjustQuantity : Math.max(0, adjustQuantity);
    const deltaQuantity = finalQty - currentQty;
    const now = new Date().toISOString();

    await db.products.update(selectedProductForStockAdjust.id, {
      stockQuantity: finalQty,
      updatedAt: now,
      isSynced: false,
    });

    const stockDelta: StockDeltaPayload = {
      productId: selectedProductForStockAdjust.id,
      storeId: currentStoreId,
      tenantId: tenant?.id,
      deltaQuantity,
      reason: adjustReason,
    };

    await enqueueSync({
      tenantId: tenant?.id,
      storeId: currentStoreId,
      entity: "product",
      action: "STOCK_DELTA",
      payload: JSON.stringify(stockDelta),
    });

    setSelectedProductForStockAdjust(null);
  };

  const handleOpenTransfer = () => {
    if (!canAccess("canTransferStock")) {
      setIsUpgradeModalOpen(true);
      return;
    }
    const otherStores = stores.filter((s) => s.id !== currentStoreId);
    if (otherStores.length === 0) {
      alert("Vous n'avez pas encore d'autre magasin. Créez un second point de vente dans l'espace Gérant.");
      return;
    }
    setTransferTargetStoreId(otherStores[0].id);
    if (products.length > 0) setTransferProductId(products[0].id);
    setTransferQuantity(1);
    setTransferNotes("");
    setIsTransferModalOpen(true);
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferProductId || !transferTargetStoreId || transferQuantity <= 0 || isSubmittingTransfer) return;

    const prod = products.find((p) => p.id === transferProductId);
    if (!prod) return;

    if (transferQuantity > prod.stockQuantity) {
      alert(`Quantité insuffisante ! Stock disponible : ${prod.stockQuantity}`);
      return;
    }

    setIsSubmittingTransfer(true);
    try {
      await processStockTransfer({
        tenantId: tenant?.id,
        fromStoreId: currentStoreId,
        toStoreId: transferTargetStoreId,
        productId: prod.id,
        quantity: transferQuantity,
        notes: transferNotes || undefined,
        userId: user?.id,
        userName: user?.name,
      });

      alert(`Transfert de ${transferQuantity}x "${prod.name}" effectué avec succès !`);
      setIsTransferModalOpen(false);
    } catch (err: any) {
      alert("Erreur transfert : " + err.message);
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  const calculatedMargin = formUnitPrice - formCostPrice;
  const calculatedMarginPercent = formUnitPrice > 0 ? Math.round((calculatedMargin / formUnitPrice) * 100) : 0;

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col relative overflow-x-hidden">
      {/* Inventory Notification Toast */}
      {inventoryToast && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-top-3 border ${
            inventoryToast.type === "success"
              ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30"
              : "bg-rose-600 text-white border-rose-500 shadow-rose-600/30"
          }`}
        >
          {inventoryToast.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span>{inventoryToast.message}</span>
        </div>
      )}
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Articles Référencés
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {products.length} <span className="text-sm font-normal text-slate-500">produits</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Valeur du Stock (Achat)
            </span>
            <div className="text-2xl font-black text-blue-600 mt-1">
              {formatMoney(totalStockValue)}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
          className={`rounded-3xl p-4 sm:p-5 border shadow-sm flex items-center justify-between cursor-pointer transition-all ${
            lowStockProducts.length > 0
              ? showLowStockOnly
                ? "bg-amber-500 text-white border-amber-600 shadow-amber-500/20"
                : "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100"
              : "bg-white text-slate-700 border-slate-200"
          }`}
        >
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider opacity-90">
              Alertes Stock Faible
            </span>
            <div className="text-2xl font-black mt-1">
              {lowStockProducts.length} <span className="text-sm font-normal">en alerte</span>
            </div>
          </div>
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              showLowStockOnly ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Controls & Action Buttons */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom de produit ou code-barre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 bg-slate-50 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Transfer stock button */}
          <button
            onClick={handleOpenTransfer}
            className="py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5 border border-indigo-200 whitespace-nowrap touch-press"
            title="Transférer du stock vers un autre magasin"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Transfert Inter-Magasin</span>
          </button>

          {/* QR Code & Public Menu Button */}
          <button
            onClick={() => setIsQRModalOpen(true)}
            className="py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center gap-1.5 border border-amber-200 whitespace-nowrap touch-press"
            title="Générer l'affiche QR Code et le lien public des tarifs"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-700" />
            <span>Menu & Tarifs QR</span>
          </button>

          {/* Export Excel button */}
          {canAccess("canExportReports") && (
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 border border-slate-200 whitespace-nowrap touch-press"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}

          {/* Bulk Product Creation button */}
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5 border border-indigo-200 whitespace-nowrap touch-press shadow-sm"
            title="Créer rapidement plusieurs articles sur une grille tabulaire"
          >
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>⚡ Saisie Multiple</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-blue-600/20 whitespace-nowrap touch-press"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Produit</span>
          </button>
        </div>
      </div>

      {/* Products List */}
      <div className="flex-1 overflow-y-auto">
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center text-slate-400">
            <Package className="w-12 h-12 stroke-1 text-slate-300 mx-auto mb-2" />
            <p className="text-base font-bold text-slate-700">Votre stock est actuellement vide</p>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Ajoutez vos propres articles un par un avec photos ou saisissez rapidement l'ensemble de votre catalogue en masse.
            </p>
            <div className="flex items-center justify-center gap-2.5 mt-4 flex-wrap">
              <button
                onClick={() => setIsBulkModalOpen(true)}
                className="py-2.5 px-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs inline-flex items-center gap-1.5 border border-indigo-200 shadow-sm touch-press"
              >
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>⚡ Saisie Rapide en Masse</span>
              </button>
              <button
                onClick={handleOpenAdd}
                className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md shadow-blue-600/20 touch-press"
              >
                <PackagePlus className="w-4 h-4" />
                <span>Ajouter un Article (Photo)</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-4">
              {paginatedProducts.map((p) => {
                const isOutOfStock = p.stockQuantity <= 0;
                const isLowStock = p.stockQuantity > 0 && p.stockQuantity <= p.minStockAlert;
                const margin = p.unitPrice - (p.costPrice || 0);

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Header + Stock badge */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {p.category}
                        </span>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            isOutOfStock
                              ? "bg-rose-100 text-rose-700 border border-rose-200"
                              : isLowStock
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {isOutOfStock ? "Rupture" : `Stock : ${p.stockQuantity}`}
                        </span>
                      </div>

                      {/* Product Photo Thumbnail & Title */}
                      <div className="flex items-center gap-3 mb-2">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0 shadow-sm"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 border border-slate-200/80">
                            <Package className="w-6 h-6 stroke-1" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2">
                            {p.name}
                          </h3>
                          {p.barcode && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                              <Barcode className="w-3 h-3" />
                              <span>{p.barcode}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-2.5 grid grid-cols-3 gap-1 text-center my-2 border border-slate-100">
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase">Achat</div>
                          <div className="font-bold text-xs text-slate-700">
                            {formatMoney(p.costPrice || 0)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase">Vente</div>
                          <div className="font-black text-xs text-blue-700">
                            {formatMoney(p.unitPrice)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase">Marge</div>
                          <div className="font-bold text-xs text-indigo-600">
                            +{formatMoney(margin)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 mt-2">
                      <button
                        onClick={() => {
                          setSelectedProductForStockAdjust(p);
                          setAdjustQuantity(10);
                          setAdjustType("ADD");
                          setAdjustReason("RESTOCK");
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors touch-press"
                      >
                        <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
                        <span>Réapprovisionner</span>
                      </button>

                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                        title="Modifier l'article"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {isOwner && (
                        <button
                          onClick={() => handleDeleteProduct(p)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 transition-colors border border-rose-100"
                          title="Supprimer l'article (Réservé au propriétaire)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {filteredProducts.length > 0 && (
              <div className="pb-8">
                <PaginationControl
                  currentPage={currentPage}
                  pageSize={pageSize}
                  totalItems={filteredProducts.length}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  pageSizeOptions={[25, 50, 100, 200]}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL: Stock Transfer Between Stores */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleExecuteTransfer}
            className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Transfert Inter-Magasins</h3>
                  <p className="text-xs text-slate-500">Déplacement de marchandise entre boutiques</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 mb-5">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Magasin d'Origine (Source)
                </label>
                <input
                  type="text"
                  disabled
                  value={authStore?.name || "Boutique Principale"}
                  className="w-full p-2.5 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold border border-slate-200 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Magasin Destinataire (Cible) *
                </label>
                <select
                  value={transferTargetStoreId}
                  onChange={(e) => setTransferTargetStoreId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 rounded-xl text-xs font-bold text-slate-900 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  {stores
                    .filter((s) => s.id !== currentStoreId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        🏬 {s.name} ({s.address || "Kinshasa"})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Article à Transférer *
                </label>
                <select
                  value={transferProductId}
                  onChange={(e) => setTransferProductId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 rounded-xl text-xs font-bold text-slate-900 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock actuel : {p.stockQuantity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Quantité à déplacer *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={transferQuantity}
                  onChange={(e) => setTransferQuantity(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 rounded-xl text-sm font-black text-indigo-700 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Motif / Numéro de Bon de Transfert (optionnel)
                </label>
                <input
                  type="text"
                  placeholder="ex: Réapprovisionnement dépôt 2"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 rounded-xl text-xs border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmittingTransfer}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20"
              >
                {isSubmittingTransfer ? "Transfert en cours..." : "Valider le Transfert"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Add / Edit Product with Image Upload */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveProduct}
            className="bg-white w-full max-w-lg rounded-3xl p-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {selectedProductForEdit ? "Modifier le Produit" : "Ajouter un Nouveau Produit"}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {selectedProductForEdit ? "Mettre à jour les informations et la photo" : "Formulaire unitaire détaillé avec photo"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!selectedProductForEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddProductModalOpen(false);
                      setIsBulkModalOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1 transition-colors touch-press border border-indigo-200"
                    title="Basculer vers la saisie rapide en masse"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Saisie en Masse ⚡</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3.5 mb-4">
              {/* Product Photo Upload Section */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                  Photo de l'article (pour affichage tactile caisse)
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative group">
                    {formImageUrl ? (
                      <div className="relative">
                        <img
                          src={formImageUrl}
                          alt="Aperçu"
                          className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-500 shadow-md"
                        />
                        <button
                          type="button"
                          onClick={() => setFormImageUrl("")}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] shadow"
                          title="Supprimer l'image"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                        <ImageIcon className="w-6 h-6 stroke-1 mb-0.5" />
                        <span className="text-[9px]">Sans photo</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold border border-blue-200 transition-colors">
                      <Camera className="w-3.5 h-3.5" />
                      <span>Choisir une photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="url"
                      placeholder="Ou coller une URL d'image web..."
                      value={formImageUrl.startsWith("data:") ? "" : formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      className="w-full p-2 bg-slate-50 rounded-xl text-[11px] border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Nom du produit *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Sac de Riz 25kg"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Catégorie
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Alimentation">Alimentation</option>
                    <option value="Boissons">Boissons</option>
                    <option value="Hygiène & Entretien">Hygiène & Entretien</option>
                    <option value="Services & Crédit">Services & Crédit</option>
                    <option value="Divers">Divers</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Code-barres (optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="ex: 6001001"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Prix de Vente ({currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder={currency === "$" ? "10" : "25000"}
                    value={formUnitPrice || ""}
                    onChange={(e) => setFormUnitPrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 rounded-xl text-sm font-bold text-blue-700 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Prix d'Achat / Revient ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="17200"
                    value={formCostPrice || ""}
                    onChange={(e) => setFormCostPrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200 flex items-center justify-between text-xs font-semibold text-blue-800">
                <span>Marge unitaire brute :</span>
                <span>
                  +{formatMoney(calculatedMargin)} ({calculatedMarginPercent}%)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Stock Initial
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formStockQty}
                    onChange={(e) => setFormStockQty(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 rounded-xl text-sm font-bold text-slate-900 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Seuil d'alerte
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formMinAlert}
                    onChange={(e) => setFormMinAlert(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 rounded-xl text-sm font-bold text-slate-900 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              {selectedProductForEdit && isOwner ? (
                <button
                  type="button"
                  onClick={() => handleDeleteProduct(selectedProductForEdit)}
                  className="py-2.5 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold flex items-center gap-1.5 border border-rose-200 transition-colors"
                  title="Supprimer définitivement cet article"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Supprimer</span>
                </button>
              ) : null}

              <div className="flex items-center gap-2 flex-1 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProduct}
                  className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all touch-press"
                >
                  {isSubmittingProduct ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <span>{selectedProductForEdit ? "Enregistrer" : "Créer l'article"}</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Stock Adjustment */}
      {selectedProductForStockAdjust && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitStockAdjustment}
            className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl border border-slate-100"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Réapprovisionner le Stock</h3>
                <p className="text-xs text-slate-500">{selectedProductForStockAdjust.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProductForStockAdjust(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Stock actuel en magasin :</span>
              <span className="text-base font-black text-slate-900">
                {selectedProductForStockAdjust.stockQuantity} unités
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() => setAdjustType("ADD")}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  adjustType === "ADD"
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200"
                }`}
              >
                + Ajouter des unités
              </button>
              <button
                type="button"
                onClick={() => setAdjustType("SET")}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  adjustType === "SET"
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200"
                }`}
              >
                Définir quantité exacte
              </button>
            </div>

            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                {adjustType === "ADD" ? "Quantité à ajouter (+)" : "Nouvelle quantité en stock"}
              </label>
              <input
                type="number"
                required
                min="1"
                value={adjustQuantity}
                onChange={(e) => setAdjustQuantity(Number(e.target.value))}
                className="w-full p-3 bg-slate-50 rounded-2xl text-lg font-black text-slate-900 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 touch-press"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Valider le réapprovisionnement</span>
            </button>
          </form>
        </div>
      )}

      {/* UPGRADE PROMPT MODAL */}
      <UpgradePromptModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title="Transferts de Stock Inter-Boutiques"
        description="Le transfert de stock entre plusieurs magasins et dépôts est une fonctionnalité exclusive au forfait Business."
        targetPlan="BUSINESS"
        features={[
          "Transferts de stock inter-magasins avec traçabilité",
          "Gestion multi-boutiques et multi-caisses",
          "Export comptable Excel et PDF",
          "Support prioritaire WhatsApp",
        ]}
      />

      {/* Mobile Floating Action Button (FAB) for adding new product */}
      <div className="md:hidden fixed bottom-5 right-5 z-40">
        <button
          type="button"
          onClick={handleOpenAdd}
          className="h-13 px-4.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-2xl shadow-blue-600/50 flex items-center gap-2 border-2 border-white touch-press animate-in zoom-in"
          title="Créer un nouveau produit"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>+ Nouvel Article</span>
        </button>
      </div>

      {/* EXPORT REPORT MODAL */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      {/* STORE QR CODE & PUBLIC MENU MODAL */}
      <StoreQRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        store={{
          id: currentStoreId,
          name: authStore?.name || "Ma Boutique",
          businessType: authStore?.businessType,
          logoUrl: authStore?.logoUrl,
          phone: authStore?.phone,
          currency: currency || authStore?.currency,
          address: authStore?.address,
        }}
      />

      {/* BULK PRODUCT CREATION MODAL */}
      <BulkProductModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={(count) => {
          showInventoryToast(`✅ ${count} articles créés avec succès dans votre stock !`);
        }}
        onSwitchToSingle={() => {
          setIsBulkModalOpen(false);
          handleOpenAdd();
        }}
        tenantId={tenant?.id}
        storeId={currentStoreId}
        currency={currency}
        existingCategories={categories}
      />
    </div>
  );
}
