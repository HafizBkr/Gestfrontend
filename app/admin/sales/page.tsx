"use client";

import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import useSales, { Sale, SaleItem } from "@/hook/useSales";
import useCategories from "../../hooks/useCategories";

// Étend SaleItem pour inclure category_name (optionnel)
type SaleItemWithCategoryName = SaleItem & { category_name?: string };
import { generateSaleReceipt } from "@/utils/receiptGenerator";
import { generateSalesReport } from "@/utils/reportGenerator";
import {
  MagnifyingGlassIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  PrinterIcon,
  EyeIcon,
  DocumentTextIcon,
  UserIcon,
  ChartBarIcon,
  ClockIcon,
  DocumentChartBarIcon,
} from "@heroicons/react/24/outline";

const SalesPage = () => {
  const { sales, loading, error, getAllSales, calculateSalesStats } =
    useSales();

  // State pour la liste des produits (id -> nom)
  const [products, setProducts] = useState<
    { product_id: string; name: string }[]
  >([]);

  // Hook pour les catégories dynamiques
  const { categories, fetchCategories } = useCategories();
  useEffect(() => {
    fetchCategories();
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [cashierFilter, setCashierFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedSales, setSelectedSales] = useState<string[]>([]);
  const [showBulkPrintModal, setShowBulkPrintModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [salesStats, setSalesStats] = useState({
    totalSales: 0,
    totalAmount: 0,
    totalItems: 0,
    averageSaleAmount: 0,
    salesByDate: {} as Record<string, number>,
    salesByCashier: {} as Record<string, number>,
  });

  // Charger les ventes au montage du composant
  useEffect(() => {
    getAllSales();
  }, [getAllSales]);

  // Charger la liste des produits au montage
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("admin_token")
            : null;
        const baseUrl =
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:7000";
        const response = await fetch(`${baseUrl}/admin/products`, {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchProducts();
  }, []);

  // Charger la liste des produits au montage
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("admin_token")
            : null;
        const baseUrl =
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:7000";
        const response = await fetch(`${baseUrl}/admin/products`, {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchProducts();
  }, []);

  // Mettre à jour les ventes filtrées et les statistiques
  useEffect(() => {
    let filtered = sales;

    // Filtrer par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(
        (sale) =>
          sale.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.sale_id.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Filtrer par caissier
    if (cashierFilter !== "all") {
      filtered = filtered.filter((sale) => sale.username === cashierFilter);
    }

    // Filtrer par date
    if (dateFilter !== "all") {
      const today = new Date();
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      switch (dateFilter) {
        case "today":
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date();
          endDate.setHours(23, 59, 59, 999);
          break;
        case "week":
          startDate = new Date();
          startDate.setDate(today.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date();
          endDate.setHours(23, 59, 59, 999);
          break;
        case "month":
          startDate = new Date();
          startDate.setDate(today.getDate() - 30);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date();
          endDate.setHours(23, 59, 59, 999);
          break;
        case "this_month":
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "custom":
          if (customStartDate && customEndDate) {
            startDate = new Date(customStartDate);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(customEndDate);
            endDate.setHours(23, 59, 59, 999);
          }
          break;
      }

      if (startDate && endDate) {
        filtered = filtered.filter((sale) => {
          const saleDate = new Date(sale.date);
          return saleDate >= startDate! && saleDate <= endDate!;
        });
      }
    }

    // Filtrer par catégorie réelle (Boissons, Nourritures, toutes)
    if (selectedCategory !== "all") {
      filtered = filtered.filter((sale) =>
        sale.items.some(
          (item: SaleItemWithCategoryName) =>
            item.category_name === selectedCategory,
        ),
      );
    }

    setFilteredSales(filtered);
    setSalesStats(calculateSalesStats(filtered));
  }, [
    sales,
    searchTerm,
    dateFilter,
    cashierFilter,
    customStartDate,
    customEndDate,
    selectedCategory,
    calculateSalesStats,
  ]);

  // Obtenir la liste unique des caissiers
  const uniqueCashiers = Array.from(
    new Set(sales.map((sale) => sale.username)),
  );

  const handleViewDetails = (sale: Sale) => {
    setSelectedSale(sale);
    setShowDetailModal(true);
  };

  const handleOpenPrintModal = (sale: Sale) => {
    setSelectedSale(sale);
    setShowPrintModal(true);
  };

  const handlePrintReceipt = async (
    sale: Sale,
    action: "download" | "print" | "preview" = "print",
  ) => {
    try {
      await generateSaleReceipt(sale, action);
      setShowPrintModal(false);
    } catch (error) {
      console.error("Erreur lors de la génération du reçu:", error);
      alert("Erreur lors de la génération du reçu. Veuillez réessayer.");
    }
  };

  const handleBulkPrint = async (
    action: "download" | "print" | "preview" = "download",
  ) => {
    const salesToPrint = filteredSales.filter((sale) =>
      selectedSales.includes(sale.sale_id),
    );
    if (salesToPrint.length === 0) {
      alert("Veuillez sélectionner au moins une vente.");
      return;
    }

    try {
      if (salesToPrint.length === 1) {
        await generateSaleReceipt(salesToPrint[0], action);
      } else {
        // Import the multiple receipts function
        const { generateMultipleReceipts } = await import(
          "@/utils/receiptGenerator"
        );
        await generateMultipleReceipts(
          salesToPrint,
          action === "print" ? "download" : action,
        );
      }
      setShowBulkPrintModal(false);
      setSelectedSales([]);
    } catch (error) {
      console.error("Erreur lors de la génération des reçus:", error);
      alert("Erreur lors de la génération des reçus. Veuillez réessayer.");
    }
  };

  const handleGenerateReport = (
    action: "download" | "print" | "preview" = "download",
  ) => {
    let dateRange = "";
    let filterType = "";

    switch (dateFilter) {
      case "today":
        dateRange = new Date().toLocaleDateString("fr-FR");
        filterType = "Ventes d'aujourd'hui";
        break;
      case "week":
        dateRange = "7 derniers jours";
        filterType = "Ventes de la semaine";
        break;
      case "month":
        dateRange = "30 derniers jours";
        filterType = "Ventes du mois";
        break;
      case "this_month":
        dateRange = `Mois de ${new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`;
        filterType = "Ventes du mois en cours";
        break;
      case "custom":
        if (customStartDate && customEndDate) {
          dateRange = `Du ${new Date(customStartDate).toLocaleDateString("fr-FR")} au ${new Date(customEndDate).toLocaleDateString("fr-FR")}`;
          filterType = "Période personnalisée";
        }
        break;
      default:
        dateRange = "Toutes les ventes";
        filterType = "Toutes les ventes";
    }

    if (selectedCategory !== "all") {
      filterType += ` - Catégorie: ${selectedCategory}`;
    }
    if (cashierFilter !== "all") {
      filterType += ` - Caissier: ${cashierFilter}`;
    }

    generateSalesReport(
      filteredSales,
      {
        dateRange,
        filterType,
      },
      action,
    );

    setShowReportModal(false);
  };

  const getDateRangeText = () => {
    switch (dateFilter) {
      case "today":
        return "Aujourd'hui";
      case "week":
        return "7 derniers jours";
      case "month":
        return "30 derniers jours";
      case "this_month":
        return "Ce mois";
      case "custom":
        return customStartDate && customEndDate
          ? `${customStartDate} - ${customEndDate}`
          : "Période personnalisée";
      default:
        return "Toutes les périodes";
    }
  };

  const handleSelectAll = () => {
    if (selectedSales.length === filteredSales.length) {
      setSelectedSales([]);
    } else {
      setSelectedSales(filteredSales.map((sale) => sale.sale_id));
    }
  };

  const handleSelectSale = (saleId: string) => {
    setSelectedSales((prev) =>
      prev.includes(saleId)
        ? prev.filter((id) => id !== saleId)
        : [...prev, saleId],
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === "string" ? Number(price) : price;
    return numPrice.toLocaleString("fr-FR") + " FCFA";
  };

  if (loading && sales.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-lg text-gray-700">Chargement des ventes...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Historique des Ventes
              </h1>
              <p className="text-gray-600">
                Consultez et analysez toutes les ventes
              </p>
            </div>
          </div>
        </div>

        {/* Filtres de date personnalisés */}
        {dateFilter === "custom" && (
          <div className="flex items-center space-x-4 mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Du:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Au:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
            </div>
          </div>
        )}

        {/* Actions et statistiques */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            {/* Bouton génération d'état */}
            <button
              onClick={() => setShowReportModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
              disabled={filteredSales.length === 0}
            >
              <DocumentChartBarIcon className="w-5 h-5" />
              <span>Générer État</span>
            </button>

            {/* Impression rapide */}
            <button
              onClick={() => handleGenerateReport("print")}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
              disabled={filteredSales.length === 0}
            >
              <PrinterIcon className="w-5 h-5" />
              <span>Imprimer</span>
            </button>
          </div>

          <div className="text-sm text-gray-600">
            Période: {getDateRangeText()} | {filteredSales.length} vente(s)
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Ventes
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {salesStats.totalSales}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <DocumentTextIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Chiffre d&apos;Affaires
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(salesStats.totalAmount)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Articles Vendus
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {salesStats.totalItems}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <ChartBarIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Vente Moyenne
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(salesStats.averageSaleAmount)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <CalendarIcon className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="text-red-800">
              <strong>Erreur:</strong> {error}
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par caissier ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              />
            </div>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            >
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd&apos;hui</option>
              <option value="week">7 derniers jours</option>
              <option value="month">30 derniers jours</option>
              <option value="this_month">Ce mois</option>
              <option value="custom">Période personnalisée</option>
            </select>

            <select
              value={cashierFilter}
              onChange={(e) => setCashierFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            >
              <option value="all">Tous les caissiers</option>
              {uniqueCashiers.map((cashier) => (
                <option key={cashier} value={cashier}>
                  {cashier}
                </option>
              ))}
            </select>

            {/* Filtre catégorie */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            >
              <option value="all">Toutes les catégories</option>
              {categories.map((cat) => (
                <option key={cat.category_id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>

            {selectedSales.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedSales.length} sélectionnée(s)
                </span>
                <button
                  onClick={() => setShowBulkPrintModal(true)}
                  className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-1 text-sm"
                >
                  <PrinterIcon className="w-4 h-4" />
                  <span>Imprimer sélection</span>
                </button>
                <button
                  onClick={() => setSelectedSales([])}
                  className="bg-gray-500 text-white px-3 py-2 rounded-md hover:bg-gray-600 text-sm"
                >
                  Annuler
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Table des ventes */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={
                        selectedSales.length === filteredSales.length &&
                        filteredSales.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID Vente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Caissier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Articles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.map((sale) => (
                  <tr
                    key={sale.sale_id}
                    className={`hover:bg-gray-50 ${selectedSales.includes(sale.sale_id) ? "bg-blue-50" : ""}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedSales.includes(sale.sale_id)}
                        onChange={() => handleSelectSale(sale.sale_id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        #{sale.sale_id.slice(0, 8)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserIcon className="w-4 h-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">
                          {sale.username}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(sale.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {sale.items.length} article
                        {sale.items.length > 1 ? "s" : ""}
                      </div>
                      <div className="text-xs text-gray-500">
                        {sale.items.reduce(
                          (sum, item) => sum + item.quantity,
                          0,
                        )}{" "}
                        unités
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice(sale.total_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDetails(sale)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Voir les détails"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenPrintModal(sale)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Imprimer le reçu"
                        >
                          <PrinterIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSales.length === 0 && !loading && (
            <div className="text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Aucune vente
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Aucune vente ne correspond à vos critères de recherche.
              </p>
            </div>
          )}
        </div>

        {/* Modal de détails */}
        {showDetailModal && selectedSale && (
          <div className="fixed inset-0 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Détails de la vente #{selectedSale.sale_id.slice(0, 8)}
                </h3>
                <p className="text-sm text-gray-600">
                  {formatDate(selectedSale.date)} - Caissier:{" "}
                  {selectedSale.username}
                </p>
              </div>

              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-3">
                  Articles vendus
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID Produit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantité
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Prix unitaire
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedSale.items.map((item) => (
                        <tr key={item.sale_item_id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {
                              // Affiche le nom du produit si trouvé, sinon l'ID
                              (() => {
                                const prod = products.find(
                                  (p) => p.product_id === item.product_id,
                                );
                                return prod
                                  ? prod.name
                                  : item.product_id.slice(0, 8) + "...";
                              })()
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatPrice(item.unit_price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatPrice(item.total_price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold text-gray-900">
                    Total de la vente:
                  </span>
                  <span className="text-xl font-bold text-green-600">
                    {formatPrice(selectedSale.total_amount)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Fermer
                </button>
                <button
                  onClick={() => handleOpenPrintModal(selectedSale)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
                >
                  <PrinterIcon className="w-4 h-4" />
                  <span>Imprimer Reçu</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Options d'impression */}
        {showPrintModal && selectedSale && (
          <div className="fixed inset-0 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Options d&apos;impression
                </h3>
                <p className="text-sm text-gray-600">
                  Reçu #{selectedSale.sale_id.slice(0, 8)} -{" "}
                  {formatPrice(selectedSale.total_amount)}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handlePrintReceipt(selectedSale, "print")}
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 flex items-center justify-center space-x-2"
                >
                  <PrinterIcon className="w-5 h-5" />
                  <span>Imprimer directement</span>
                </button>

                <button
                  onClick={() => handlePrintReceipt(selectedSale, "preview")}
                  className="w-full bg-orange-600 text-white px-4 py-3 rounded-md hover:bg-orange-700 flex items-center justify-center space-x-2"
                >
                  <EyeIcon className="w-5 h-5" />
                  <span>Aperçu avant impression</span>
                </button>

                <button
                  onClick={() => handlePrintReceipt(selectedSale, "download")}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 flex items-center justify-center space-x-2"
                >
                  <DocumentTextIcon className="w-5 h-5" />
                  <span>Télécharger PDF</span>
                </button>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Impression en lot */}
        {showBulkPrintModal && (
          <div className="fixed inset-0 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Impression en lot
                </h3>
                <p className="text-sm text-gray-600">
                  {selectedSales.length} reçu(s) sélectionné(s)
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleBulkPrint("print")}
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 flex items-center justify-center space-x-2"
                >
                  <PrinterIcon className="w-5 h-5" />
                  <span>Imprimer tous les reçus</span>
                </button>

                <button
                  onClick={() => handleBulkPrint("preview")}
                  className="w-full bg-orange-600 text-white px-4 py-3 rounded-md hover:bg-orange-700 flex items-center justify-center space-x-2"
                >
                  <EyeIcon className="w-5 h-5" />
                  <span>Aperçu du document</span>
                </button>

                <button
                  onClick={() => handleBulkPrint("download")}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 flex items-center justify-center space-x-2"
                >
                  <DocumentTextIcon className="w-5 h-5" />
                  <span>Télécharger PDF combiné</span>
                </button>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowBulkPrintModal(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <span>Chargement...</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal de génération d'état */}
        {showReportModal && (
          <div className="fixed inset-0 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    Générer un État de Ventes
                  </h3>
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Période sélectionnée: <strong>{getDateRangeText()}</strong>
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    Nombre de ventes: <strong>{filteredSales.length}</strong>
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Montant total:{" "}
                    <strong>
                      {filteredSales
                        .reduce(
                          (sum, sale) => sum + Number(sale.total_amount),
                          0,
                        )
                        .toFixed(0)}{" "}
                      FCFA
                    </strong>
                  </p>
                </div>

                <div className="flex flex-col space-y-3">
                  <button
                    onClick={() => handleGenerateReport("preview")}
                    className="w-full bg-orange-600 text-white px-4 py-3 rounded-md hover:bg-orange-700 flex items-center justify-center space-x-2"
                  >
                    <EyeIcon className="w-5 h-5" />
                    <span>Aperçu</span>
                  </button>

                  <button
                    onClick={() => handleGenerateReport("print")}
                    className="w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 flex items-center justify-center space-x-2"
                  >
                    <PrinterIcon className="w-5 h-5" />
                    <span>Imprimer</span>
                  </button>

                  <button
                    onClick={() => handleGenerateReport("download")}
                    className="w-full bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 flex items-center justify-center space-x-2"
                  >
                    <DocumentTextIcon className="w-5 h-5" />
                    <span>Télécharger PDF</span>
                  </button>
                </div>

                <div className="mt-4">
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default SalesPage;
