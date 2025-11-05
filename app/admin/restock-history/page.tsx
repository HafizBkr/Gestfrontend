"use client";

import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import useRestock from "../../hooks/useRestock";
import useProducts from "../../hooks/useProducts";
import {
  MagnifyingGlassIcon,
  EyeIcon,
  TruckIcon,
  CalendarIcon,
  CubeIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";

const RestockHistoryPage = () => {
  const { restocks, loading, error, getRestocks } = useRestock();
  const { products, getProducts } = useProducts();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [selectedRestock, setSelectedRestock] = useState<any>(null);

  // Charger les données au montage du composant
  useEffect(() => {
    getRestocks();
    getProducts();
  }, []);

  // Filtrage des restockages
  const filteredRestocks = restocks.filter((restock) => {
    const matchesSearch = restock.items.some((item) => {
      const product = products.find((p) => p.product_id === item.product_id);
      return product?.name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const restockDate = new Date(restock.date);
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const matchesDate =
      dateFilter === "all" ||
      (dateFilter === "today" &&
        restockDate.toDateString() === today.toDateString()) ||
      (dateFilter === "week" && restockDate >= lastWeek) ||
      (dateFilter === "month" && restockDate >= lastMonth);

    return matchesSearch && matchesDate;
  });

  const getProductName = (productId: string) => {
    const product = products.find((p) => p.product_id === productId);
    return product ? product.name : "Produit non trouvé";
  };

  const getTotalQuantity = (items: any[]) => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotalCost = (items: any[]) => {
    return items.reduce(
      (sum, item) => sum + (item.purchase_price || 0) * item.quantity,
      0,
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

  const totalRestocks = restocks.length;
  const totalQuantityRestocked = restocks.reduce(
    (sum, restock) => sum + getTotalQuantity(restock.items),
    0,
  );
  const totalCostRestocked = restocks.reduce(
    (sum, restock) => sum + getTotalCost(restock.items),
    0,
  );

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Historique des Restockages
          </h1>
          <p className="text-gray-600 mt-2">
            Consultez l'historique complet de tous les restockages effectués
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Restockages
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalRestocks}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-500">
                <TruckIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Quantité Totale
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalQuantityRestocked}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-500">
                <CubeIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Coût Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalCostRestocked.toFixed(0)} FCFA
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-500">
                <BanknotesIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 md:max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher par produit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black"
              >
                <option value="all">Toutes les dates</option>
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
              </select>
            </div>
          </div>
        </div>

        {/* Restocks Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 m-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantité totale
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coût total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Chargement de l'historique...
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRestocks.map((restock) => (
                    <tr
                      key={restock.restock_id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {formatDate(restock.date)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {restock.items.length} produit
                          {restock.items.length > 1 ? "s" : ""}
                        </div>
                        <div className="text-sm text-gray-500">
                          {restock.items
                            .slice(0, 2)
                            .map((item) => getProductName(item.product_id))
                            .join(", ")}
                          {restock.items.length > 2 && "..."}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getTotalQuantity(restock.items)} unités
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getTotalCost(restock.items).toFixed(0)} FCFA
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedRestock(restock)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <EyeIcon className="w-4 h-4 mr-1" />
                          Détails
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredRestocks.length === 0 && !loading && (
            <div className="text-center py-12">
              <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Aucun restockage trouvé
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Aucun restockage ne correspond à vos critères de recherche.
              </p>
            </div>
          )}
        </div>

        {/* Modal Détails Restock */}
        {selectedRestock && (
          <div className="fixed inset-0 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white backdrop-blur-none">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Détails du Restockage
                </h3>
                <button
                  onClick={() => setSelectedRestock(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-600">Date</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(selectedRestock.date)}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-600">
                      Quantité totale
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {getTotalQuantity(selectedRestock.items)} unités
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-600">
                      Coût total
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {getTotalCost(selectedRestock.items).toFixed(0)} FCFA
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Produit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantité
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prix d'achat
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedRestock.items.map((item: any, index: number) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {getProductName(item.product_id)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.purchase_price
                            ? `${Number(item.purchase_price).toFixed(0)} FCFA`
                            : "Non renseigné"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.purchase_price
                            ? `${(Number(item.purchase_price) * item.quantity).toFixed(0)} FCFA`
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setSelectedRestock(null)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default RestockHistoryPage;
