"use client";

import React, { useState } from "react";
import LeftSidebar from "@/components/layout/LeftSidebar";
import { SidebarProvider } from "@/context/SidebarContext";
import useCashierSales from "@/app/hooks/useCashierSales";
import type { Sale, SaleItem } from "@/app/hooks/useCashierSales";
import { generateSaleReceipt } from "@/utils/receiptGenerator";
import useCashierProducts from "@/app/hooks/useCashierProducts";

const HistoryPage = () => {
  const { sales, loading, error } = useCashierSales();
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Récupérer le token du localStorage pour les produits
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("cashier_token")
      : null;
  const { products } = useCashierProducts(token);

  // Helper pour obtenir le nom du produit à partir de l'ID
  const getProductName = (product_id: string) => {
    const product = products.find((p) => p.product_id === product_id);
    return product ? product.name : product_id;
  };

  // Helper pour le statut (toujours "completed" pour les ventes du caissier)
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Terminé";
      default:
        return status;
    }
  };

  // Filtrage des ventes
  const filteredData = sales.filter((sale) => {
    // Statut (toujours completed)
    const statusMatch =
      selectedStatus === "all" ? true : selectedStatus === "completed";
    // Recherche sur l'id, le caissier ou les produits
    const searchMatch =
      searchTerm === ""
        ? true
        : sale.sale_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.items.some((item) =>
            item.product_id.toLowerCase().includes(searchTerm.toLowerCase()),
          );
    // Filtre par date
    const dateStr = new Date(sale.date).toISOString().slice(0, 10);
    const dateMatch = selectedDate === "" ? true : dateStr === selectedDate;
    return statusMatch && searchMatch && dateMatch;
  });

  const totalRevenue = filteredData.reduce(
    (sum, sale) => sum + parseFloat(sale.total_amount),
    0,
  );

  const handleViewDetails = (sale: Sale) => {
    setSelectedSale(sale);
  };

  const handlePrintReceipt = async (sale: Sale) => {
    try {
      await generateSaleReceipt(sale, "print");
    } catch (error) {
      console.error("Erreur lors de l'impression du reçu:", error);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gray-100">
        <LeftSidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-white border-b px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Historique des Ventes
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Consultez l&apos;historique complet de vos transactions
                </p>
              </div>

              {/* Statistiques rapides */}
              <div className="flex space-x-4">
                <div className="bg-blue-50 px-4 py-2 rounded-lg">
                  <p className="text-xs text-blue-600 font-medium">
                    Total des ventes
                  </p>
                  <p className="text-lg font-bold text-blue-900">
                    {totalRevenue.toFixed(2)} FCFA
                  </p>
                </div>
                <div className="bg-green-50 px-4 py-2 rounded-lg">
                  <p className="text-xs text-green-600 font-medium">
                    Transactions
                  </p>
                  <p className="text-lg font-bold text-green-900">
                    {filteredData.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="bg-white border-b px-6 py-4">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Recherche */}
              <div className="flex-1 min-w-64">
                <input
                  type="text"
                  placeholder="Rechercher par ID, client ou produit..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filtre par statut */}
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">Tous les statuts</option>
                <option value="completed">Terminé</option>
                <option value="pending">En attente</option>
                <option value="cancelled">Annulé</option>
              </select>

              {/* Filtre par date */}
              <input
                type="date"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />

              {/* Bouton de reset */}
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedStatus("all");
                  setSelectedDate("");
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>

          {/* Liste des transactions */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="text-center py-12 text-gray-500">
                Chargement...
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-600">{error}</div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucune transaction trouvée
                </h3>
                <p className="text-gray-600">
                  Aucune transaction ne correspond à vos critères de recherche.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredData.map((sale) => (
                  <div
                    key={sale.sale_id}
                    className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow"
                  >
                    {/* En-tête de la transaction */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            #{sale.sale_id.slice(0, 8)}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor("completed")}`}
                          >
                            {getStatusLabel("completed")}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Caissier: {sale.username} •{" "}
                          {new Date(sale.date).toLocaleDateString("fr-FR")} à{" "}
                          {new Date(sale.date).toLocaleTimeString("fr-FR")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {parseFloat(sale.total_amount).toFixed(0)} FCFA
                        </p>
                      </div>
                    </div>

                    {/* Détails des produits */}
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Produits vendus :
                      </h4>
                      <div className="space-y-2">
                        {sale.items.map((item, index) => (
                          <div
                            key={item.sale_item_id}
                            className="flex justify-between items-center text-sm"
                          >
                            <span className="text-gray-900">
                              {getProductName(item.product_id)}
                              <br />
                              {item.quantity} ×{" "}
                              {parseFloat(item.unit_price).toFixed(0)} FCFA
                            </span>
                            <span className="font-medium text-gray-900">
                              {parseFloat(item.total_price).toFixed(0)} FCFA
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
                      <button
                        onClick={() => handleViewDetails(sale)}
                        className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        Voir détails
                      </button>
                      <button
                        onClick={() => handlePrintReceipt(sale)}
                        className="px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded transition-colors"
                      >
                        Imprimer reçu
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal détails de la vente */}
        {selectedSale && (
          <div className="fixed inset-0 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Détails de la vente #{selectedSale.sale_id.slice(0, 8)}
                </h3>
                <button
                  onClick={() => setSelectedSale(null)}
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
                      {new Date(selectedSale.date).toLocaleDateString("fr-FR")}{" "}
                      à{" "}
                      {new Date(selectedSale.date).toLocaleTimeString("fr-FR")}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-600">
                      Caissier
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedSale.username}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-600">Total</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {parseFloat(selectedSale.total_amount).toFixed(0)} FCFA
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Produit ID
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {getProductName(item.product_id)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {parseFloat(item.unit_price).toFixed(0)} FCFA
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {parseFloat(item.total_price).toFixed(0)} FCFA
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => handlePrintReceipt(selectedSale)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Imprimer reçu
                </button>
                <button
                  onClick={() => setSelectedSale(null)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarProvider>
  );
};

export default HistoryPage;
