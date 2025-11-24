"use client";

import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import useRetroSales, {
  RetroSale,
  CreateRetroSaleRequest,
  UpdateRetroSaleRequest,
  RetroSaleItem,
} from "@/app/hooks/useRetroSales";
import useProducts from "@/app/hooks/useProducts";
import useCashiers from "@/app/hooks/useCashiers";
import {
  MagnifyingGlassIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface RetroSaleFormData {
  date: string;
  cashier_id: string;
  items: RetroSaleItem[];
}

const RetroSalesPage = () => {
  const {
    retroSales,
    loading,
    error,
    createRetroSale,
    getRetroSales,
    updateRetroSale,
    deleteRetroSale,
    clearError,
  } = useRetroSales();

  const { products, getProducts } = useProducts();
  const { cashiers, getCashiers } = useCashiers();

  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [cashierFilter, setCashierFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // États pour les modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<RetroSale | null>(null);

  // États pour le formulaire
  const [formData, setFormData] = useState<RetroSaleFormData>(() => ({
    date: new Date().toISOString().slice(0, 16),
    cashier_id: "",
    items: [],
  }));

  const [newItem, setNewItem] = useState<RetroSaleItem>({
    product_id: "",
    quantity: 1,
    unit_price: 0,
  });

  // Charger les données au montage
  useEffect(() => {
    getRetroSales();
    getProducts();
    getCashiers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtrer les ventes
  const filteredSales = retroSales.filter((sale) => {
    // Filtre par terme de recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        sale.sale_id.toLowerCase().includes(searchLower) ||
        (sale.username && sale.username.toLowerCase().includes(searchLower)) ||
        sale.total_amount.toString().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Filtre par caissier
    if (cashierFilter !== "all" && sale.cashier_id !== cashierFilter) {
      return false;
    }

    // Filtre par date
    if (dateFilter !== "all") {
      const saleDate = new Date(sale.date);
      const today = new Date();
      let startDate: Date;

      switch (dateFilter) {
        case "today":
          startDate = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
          );
          if (saleDate < startDate || saleDate > today) return false;
          break;
        case "yesterday":
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          startDate = new Date(
            yesterday.getFullYear(),
            yesterday.getMonth(),
            yesterday.getDate(),
          );
          const endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 1);
          if (saleDate < startDate || saleDate >= endDate) return false;
          break;
        case "last7days":
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 7);
          if (saleDate < startDate || saleDate > today) return false;
          break;
        case "last30days":
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 30);
          if (saleDate < startDate || saleDate > today) return false;
          break;
        case "custom":
          if (customStartDate) {
            const customStart = new Date(customStartDate);
            if (saleDate < customStart) return false;
          }
          if (customEndDate) {
            const customEnd = new Date(customEndDate);
            customEnd.setHours(23, 59, 59, 999);
            if (saleDate > customEnd) return false;
          }
          break;
      }
    }

    return true;
  });

  // Calculer les statistiques
  const stats = {
    totalSales: filteredSales.length,
    totalAmount: filteredSales.reduce(
      (sum, sale) => sum + Number(sale.total_amount || 0),
      0,
    ),
    totalItems: filteredSales.reduce(
      (sum, sale) =>
        sum +
        sale.items.reduce(
          (itemSum, item) => itemSum + Number(item.quantity || 0),
          0,
        ),
      0,
    ),
    averageSaleAmount:
      filteredSales.length > 0
        ? filteredSales.reduce(
            (sum, sale) => sum + Number(sale.total_amount || 0),
            0,
          ) / filteredSales.length
        : 0,
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().slice(0, 16),
      cashier_id: "",
      items: [],
    });
    setNewItem({
      product_id: "",
      quantity: 1,
      unit_price: 0,
    });
  };

  const handleAddItem = () => {
    if (
      !newItem.product_id ||
      newItem.quantity <= 0 ||
      newItem.unit_price <= 0
    ) {
      return;
    }

    const product = products.find((p) => p.product_id === newItem.product_id);
    const itemToAdd: RetroSaleItem = {
      ...newItem,
      product_name: product?.name || "",
      total_price: newItem.quantity * newItem.unit_price,
    };

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, itemToAdd],
    }));

    setNewItem({
      product_id: "",
      quantity: 1,
      unit_price: 0,
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleProductSelect = (productId: string) => {
    const product = products.find((p) => p.product_id === productId);
    if (product) {
      setNewItem((prev) => ({
        ...prev,
        product_id: productId,
        unit_price: product.sale_price,
      }));
    }
  };

  const handleCreateSale = async () => {
    if (!formData.date || formData.items.length === 0) {
      return;
    }

    const saleData: CreateRetroSaleRequest = {
      date: formData.date,
      cashier_id: formData.cashier_id || undefined,
      items: formData.items.map((item) => ({
        ...item,
        unit_price: Number(item.unit_price),
      })),
    };

    const result = await createRetroSale(saleData);
    if (result) {
      setShowCreateModal(false);
      resetForm();
      await getRetroSales(); // Rafraîchit la liste après création
    }
  };

  const handleEditSale = async () => {
    if (!selectedSale || !formData.date || formData.items.length === 0) {
      return;
    }

    const updateData: UpdateRetroSaleRequest = {
      date: formData.date,
      cashier_id: formData.cashier_id || undefined,
      items: formData.items.map((item) => ({
        ...item,
        unit_price: Number(item.unit_price),
      })),
    };

    const result = await updateRetroSale(selectedSale.sale_id, updateData);
    if (result) {
      setShowEditModal(false);
      setSelectedSale(null);
      resetForm();
    }
  };

  const handleDeleteSale = async () => {
    if (!selectedSale) return;

    const success = await deleteRetroSale(selectedSale.sale_id);
    if (success) {
      setShowDeleteModal(false);
      setSelectedSale(null);
    }
  };

  const openEditModal = (sale: RetroSale) => {
    setSelectedSale(sale);
    setFormData({
      date: new Date(sale.date).toISOString().slice(0, 16),
      cashier_id: sale.cashier_id || "",
      items: sale.items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        product_name: item.product_name,
        total_price: item.total_price,
      })),
    });
    setShowEditModal(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString("fr-FR") +
      " " +
      date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-6 pt-6 pb-2 w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Ventes Rétroactives
            </h1>
            <p className="text-gray-600 mt-1">
              Gestion des ventes enregistrées à une date antérieure
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Nouvelle Vente
          </button>
        </div>

        {/* Messages d'erreur */}
        {/* L'erreur globale n'est plus affichée ici, elle sera affichée dans la modale */}

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Ventes
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalSales}
                </p>
              </div>
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Montant Total
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {Number(stats.totalAmount).toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  FCFA
                </p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Articles Vendus
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalItems}
                </p>
              </div>
              <DocumentTextIcon className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Panier Moyen
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {Number(stats.averageSaleAmount).toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  FCFA
                </p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Recherche */}
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par ID, caissier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              />
            </div>

            {/* Filtre par période */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            >
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd&apos;hui</option>
              <option value="yesterday">Hier</option>
              <option value="last7days">7 derniers jours</option>
              <option value="last30days">30 derniers jours</option>
              <option value="custom">Période personnalisée</option>
            </select>

            {/* Filtre par caissier */}
            <select
              value={cashierFilter}
              onChange={(e) => setCashierFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            >
              <option value="all">Tous les caissiers</option>
              {cashiers.map((cashier) => (
                <option key={cashier.cashier_id} value={cashier.cashier_id}>
                  {cashier.username}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              {dateFilter === "custom" && (
                <>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Liste des ventes */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID Vente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Caissier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Articles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Créé le
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      Aucune vente rétroactive trouvée
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr key={sale.sale_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {sale.sale_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4" />
                          {formatDate(sale.date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <UserIcon className="h-4 w-4" />
                          {sale.username || "Non assigné"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {Number(sale.total_amount).toLocaleString("fr-FR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        FCFA
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sale.items.length} article(s)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <ClockIcon className="h-4 w-4" />
                          {formatDate(sale.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedSale(sale);
                              setShowDetailModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Voir les détails"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(sale)}
                            className="text-green-600 hover:text-green-800 p-1"
                            title="Modifier"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSale(sale);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Supprimer"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de création */}
        {showCreateModal && (
          <div className="fixed inset-0 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Nouvelle Vente Rétroactive
                </h2>

                {/* Message d'erreur dans la modale de création */}
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ExclamationTriangleIcon className="h-5 w-5" />
                      <span>{error}</span>
                    </div>
                    <button
                      onClick={clearError}
                      className="text-red-700 hover:text-red-800"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}
                <div className="space-y-6">
                  {/* Informations générales */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date et heure
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.date}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            date: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Caissier <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={formData.cashier_id}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            cashier_id: e.target.value,
                          }))
                        }
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                      >
                        <option value="">Sélectionner un caissier</option>
                        {cashiers
                          .filter((cashier) => cashier.is_active)
                          .map((cashier) => (
                            <option
                              key={cashier.cashier_id}
                              value={cashier.cashier_id}
                            >
                              {cashier.username}
                            </option>
                          ))}
                      </select>
                      {formData.cashier_id === "" && (
                        <div className="text-xs text-red-600 mt-1">
                          Veuillez sélectionner un caissier actif pour valider
                          la vente.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ajouter un article */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Ajouter un article
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <select
                        value={newItem.product_id}
                        onChange={(e) => handleProductSelect(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                      >
                        <option value="">Sélectionner un produit</option>
                        {products.map((product) => (
                          <option
                            key={product.product_id}
                            value={product.product_id}
                          >
                            {product.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={newItem.quantity}
                        onChange={(e) =>
                          setNewItem((prev) => ({
                            ...prev,
                            quantity: parseInt(e.target.value) || 1,
                          }))
                        }
                        placeholder="Quantité"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                        required
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newItem.unit_price}
                        onChange={(e) =>
                          setNewItem((prev) => ({
                            ...prev,
                            unit_price: parseFloat(e.target.value) || 0,
                          }))
                        }
                        placeholder="Prix unitaire"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                      />
                      <button
                        type="button"
                        onClick={handleAddItem}
                        disabled={
                          !newItem.product_id ||
                          newItem.quantity <= 0 ||
                          newItem.unit_price <= 0
                        }
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>

                  {/* Liste des articles */}
                  {formData.items.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">
                        Articles ({formData.items.length})
                      </h3>
                      <div className="space-y-2">
                        {formData.items.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                          >
                            <div className="flex-1">
                              <span className="font-medium">
                                {item.product_name || item.product_id}
                              </span>
                              <div className="text-sm text-gray-500">
                                Produit :{" "}
                                <span className="text-black">
                                  {item.product_name || item.product_id}
                                </span>
                                <br />
                                Quantité :{" "}
                                <span className="text-black">
                                  {item.quantity}
                                </span>
                                ×{" "}
                                <span className="text-black">
                                  {item.unit_price.toLocaleString("fr-FR", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}{" "}
                                  FCFA
                                </span>
                                ={" "}
                                <span className="text-black">
                                  {(item.total_price || 0).toLocaleString(
                                    "fr-FR",
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    },
                                  )}{" "}
                                  FCFA
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <div className="text-right font-semibold text-lg">
                          <span className="text-black">
                            Total :{" "}
                            {formData.items
                              .reduce(
                                (sum, item) => sum + (item.total_price || 0),
                                0,
                              )
                              .toLocaleString("fr-FR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{" "}
                            FCFA
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCreateSale}
                    disabled={
                      !formData.date ||
                      formData.items.length === 0 ||
                      loading ||
                      !formData.cashier_id
                    }
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium rounded-lg"
                  >
                    {loading ? "Création..." : "Créer la vente"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal d'édition */}
        {showEditModal && selectedSale && (
          <div className="fixed inset-0 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Modifier la Vente {selectedSale.sale_id}
                </h2>

                {/* Message d'erreur dans la modale d'édition */}
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ExclamationTriangleIcon className="h-5 w-5" />
                      <span>{error}</span>
                    </div>
                    <button
                      onClick={clearError}
                      className="text-red-700 hover:text-red-800"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}
                <div className="space-y-6">
                  {/* Informations générales */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date et heure
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.date}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            date: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Caissier <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={formData.cashier_id}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            cashier_id: e.target.value,
                          }))
                        }
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                      >
                        <option value="">Sélectionner un caissier</option>
                        {cashiers
                          .filter((cashier) => cashier.is_active)
                          .map((cashier) => (
                            <option
                              key={cashier.cashier_id}
                              value={cashier.cashier_id}
                            >
                              {cashier.username}
                            </option>
                          ))}
                      </select>
                      {formData.cashier_id === "" && (
                        <div className="text-xs text-red-600 mt-1">
                          Veuillez sélectionner un caissier actif pour valider
                          la vente.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ajouter un article */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Ajouter un article
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <select
                        value={newItem.product_id}
                        onChange={(e) => handleProductSelect(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                      >
                        <option value="">Sélectionner un produit</option>
                        {products.map((product) => (
                          <option
                            key={product.product_id}
                            value={product.product_id}
                          >
                            {product.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={newItem.quantity}
                        onChange={(e) =>
                          setNewItem((prev) => ({
                            ...prev,
                            quantity: parseInt(e.target.value) || 1,
                          }))
                        }
                        placeholder="Quantité"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newItem.unit_price}
                        onChange={(e) =>
                          setNewItem((prev) => ({
                            ...prev,
                            unit_price: parseFloat(e.target.value) || 0,
                          }))
                        }
                        placeholder="Prix unitaire"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                      />
                      <button
                        type="button"
                        onClick={handleAddItem}
                        disabled={
                          !newItem.product_id ||
                          newItem.quantity <= 0 ||
                          newItem.unit_price <= 0
                        }
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>

                  {/* Liste des articles */}
                  {formData.items.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">
                        Articles ({formData.items.length})
                      </h3>
                      <div className="space-y-2">
                        {formData.items.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                          >
                            <div className="flex-1">
                              <span className="font-medium">
                                {item.product_name || item.product_id}
                              </span>
                              <div className="text-sm text-gray-500">
                                Quantité: {item.quantity} ×{" "}
                                {formatPrice(item.unit_price)} ={" "}
                                {formatPrice(item.total_price || 0)}
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <div className="text-right font-semibold text-lg">
                          Total:{" "}
                          {formatPrice(
                            formData.items.reduce(
                              (sum, item) => sum + (item.total_price || 0),
                              0,
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedSale(null);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleEditSale}
                    disabled={
                      !formData.date ||
                      formData.items.length === 0 ||
                      loading ||
                      !formData.cashier_id
                    }
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium rounded-lg"
                  >
                    {loading ? "Modification..." : "Modifier la vente"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de détails */}
        {showDetailModal && selectedSale && (
          <div className="fixed inset-0 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Détails de la vente {selectedSale.sale_id}
                </h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-black">
                        Date de la vente:
                      </span>
                      <p className="font-medium text-black">
                        {formatDate(selectedSale.date)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-black">Caissier:</span>
                      <p className="font-medium text-black">
                        {selectedSale.username || "Non assigné"}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-black">Montant total:</span>
                      <p className="font-medium text-black">
                        {Number(selectedSale.total_amount).toLocaleString(
                          "fr-FR",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}{" "}
                        FCFA
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-black">Créé le:</span>
                      <p className="font-medium text-black">
                        {selectedSale.created_at
                          ? formatDate(selectedSale.created_at)
                          : "Non disponible"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-black mb-3">
                      Articles ({selectedSale.items.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedSale.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-black">
                              {item.product_name}
                            </p>
                            <p className="text-sm text-black">
                              {item.quantity} ×{" "}
                              {Number(item.unit_price).toLocaleString("fr-FR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{" "}
                              FCFA
                            </p>
                          </div>
                          <p className="font-medium text-black">
                            {Number(item.total_price).toLocaleString("fr-FR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            FCFA
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedSale(null);
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmation de suppression */}
        {showDeleteModal && selectedSale && (
          <div className="fixed inset-0 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Confirmer la suppression
                  </h2>
                </div>

                <p className="text-gray-600 mb-6">
                  Êtes-vous sûr de vouloir supprimer la vente{" "}
                  {selectedSale.sale_id} ? Cette action est irréversible.
                </p>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedSale(null);
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDeleteSale}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-medium rounded-lg"
                  >
                    {loading ? "Suppression..." : "Supprimer"}
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

export default RetroSalesPage;
