"use client";

import React, { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

interface Purchase {
  id: number;
  purchaseNumber: string;
  supplier: string;
  date: string;
  status: "pending" | "completed" | "cancelled";
  items: PurchaseItem[];
  totalAmount: number;
  notes?: string;
  createdAt: string;
}

interface PurchaseItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Product {
  id: number;
  name: string;
  category: string;
  currentStock: number;
}

const PurchasesPage = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([
    {
      id: 1,
      purchaseNumber: "ACH-2024-001",
      supplier: "Fournisseur Boissons SA",
      date: "2024-01-20",
      status: "completed",
      items: [
        {
          productId: 1,
          productName: "Coca-Cola 33cl",
          quantity: 50,
          unitPrice: 1.2,
          totalPrice: 60.0,
        },
        {
          productId: 3,
          productName: "Eau minérale 50cl",
          quantity: 30,
          unitPrice: 0.8,
          totalPrice: 24.0,
        },
      ],
      totalAmount: 84.0,
      notes: "Livraison rapide",
      createdAt: "2024-01-20T10:30:00",
    },
    {
      id: 2,
      purchaseNumber: "ACH-2024-002",
      supplier: "Boulangerie Moderne",
      date: "2024-01-19",
      status: "pending",
      items: [
        {
          productId: 2,
          productName: "Sandwich Jambon",
          quantity: 20,
          unitPrice: 2.5,
          totalPrice: 50.0,
        },
      ],
      totalAmount: 50.0,
      createdAt: "2024-01-19T14:15:00",
    },
  ]);

  const [availableProducts] = useState<Product[]>([
    { id: 1, name: "Coca-Cola 33cl", category: "Boissons", currentStock: 45 },
    {
      id: 2,
      name: "Sandwich Jambon",
      category: "Nourriture",
      currentStock: 12,
    },
    { id: 3, name: "Eau minérale 50cl", category: "Boissons", currentStock: 8 },
  ]);

  const [suppliers] = useState([
    "Fournisseur Boissons SA",
    "Boulangerie Moderne",
    "Distributeur Alimentaire",
    "Grossiste Central",
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [formData, setFormData] = useState({
    supplier: "",
    date: new Date().toISOString().split("T")[0],
    status: "pending" as "pending" | "completed" | "cancelled",
    notes: "",
    items: [] as { productId: number; quantity: number; unitPrice: number }[],
  });

  // Filtrage des achats
  const filteredPurchases = purchases.filter((purchase) => {
    const matchesSearch =
      purchase.purchaseNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      purchase.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || purchase.status === statusFilter;

    let matchesDate = true;
    if (dateFilter !== "all") {
      const purchaseDate = new Date(purchase.date);
      const today = new Date();
      const diffTime = today.getTime() - purchaseDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      switch (dateFilter) {
        case "today":
          matchesDate = diffDays <= 1;
          break;
        case "week":
          matchesDate = diffDays <= 7;
          break;
        case "month":
          matchesDate = diffDays <= 30;
          break;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const generatePurchaseNumber = () => {
    const year = new Date().getFullYear();
    const count = purchases.length + 1;
    return `ACH-${year}-${count.toString().padStart(3, "0")}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const items = formData.items.map((item) => {
      const product = availableProducts.find((p) => p.id === item.productId);
      return {
        ...item,
        productName: product?.name || "",
        totalPrice: item.quantity * item.unitPrice,
      };
    });

    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

    const purchaseData = {
      supplier: formData.supplier,
      date: formData.date,
      status: formData.status,
      notes: formData.notes,
      items,
      totalAmount,
    };

    if (editingPurchase) {
      // Modifier achat existant
      setPurchases(
        purchases.map((p) =>
          p.id === editingPurchase.id
            ? { ...editingPurchase, ...purchaseData }
            : p,
        ),
      );
    } else {
      // Ajouter nouvel achat
      const newPurchase: Purchase = {
        id: Math.max(...purchases.map((p) => p.id)) + 1,
        purchaseNumber: generatePurchaseNumber(),
        ...purchaseData,
        createdAt: new Date().toISOString(),
      };
      setPurchases([...purchases, newPurchase]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      supplier: "",
      date: new Date().toISOString().split("T")[0],
      status: "pending",
      notes: "",
      items: [],
    });
    setEditingPurchase(null);
    setShowModal(false);
  };

  const handleEdit = (purchase: Purchase) => {
    setFormData({
      supplier: purchase.supplier,
      date: purchase.date,
      status: purchase.status,
      notes: purchase.notes || "",
      items: purchase.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    });
    setEditingPurchase(purchase);
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet achat ?")) {
      setPurchases(purchases.filter((p) => p.id !== id));
    }
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    const newItems = [...formData.items];
    newItems[index].quantity = quantity;
    setFormData({ ...formData, items: newItems });
  };

  const updateItemPrice = (index: number, unitPrice: number) => {
    const newItems = [...formData.items];
    newItems[index].unitPrice = unitPrice;
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: 0, quantity: 1, unitPrice: 0 }],
    });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="w-4 h-4" />;
      case "pending":
        return <ClockIcon className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Gestion des Achats
              </h1>
              <p className="text-gray-600">
                Enregistrez vos achats et gérez vos fournisseurs
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Nouvel Achat</span>
            </button>
          </div>

          {/* Filtres et recherche */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher un achat..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="completed">Terminé</option>
                <option value="cancelled">Annulé</option>
              </select>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              >
                <option value="all">Toutes les dates</option>
                <option value="today">Aujourd&apos;hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
              </select>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <TruckIcon className="w-4 h-4" />
                <span>{filteredPurchases.length} achat(s) trouvé(s)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des achats */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    N° Achat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fournisseur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Articles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {purchase.purchaseNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(purchase.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <TruckIcon className="w-5 h-5 text-gray-400 mr-2" />
                        <div className="text-sm font-medium text-gray-900">
                          {purchase.supplier}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {new Date(purchase.date).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {purchase.items.length} article(s)
                      </div>
                      <div className="text-xs text-gray-500">
                        {purchase.items.slice(0, 2).map((item, index) => (
                          <div key={index}>
                            {item.productName} (x{item.quantity})
                          </div>
                        ))}
                        {purchase.items.length > 2 && (
                          <div className="text-gray-400">
                            +{purchase.items.length - 2} autres...
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {purchase.totalAmount.toFixed(2)} €
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(purchase.status)}`}
                      >
                        {getStatusIcon(purchase.status)}
                        <span className="ml-1">
                          {purchase.status === "pending" && "En attente"}
                          {purchase.status === "completed" && "Terminé"}
                          {purchase.status === "cancelled" && "Annulé"}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(purchase)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(purchase.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Ajouter/Modifier */}
        {showModal && (
          <div className="fixed inset-0 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingPurchase ? "Modifier l'achat" : "Nouvel achat"}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fournisseur *
                      </label>
                      <select
                        required
                        value={formData.supplier}
                        onChange={(e) =>
                          setFormData({ ...formData, supplier: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      >
                        <option value="">Sélectionner un fournisseur</option>
                        {suppliers.map((supplier) => (
                          <option key={supplier} value={supplier}>
                            {supplier}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) =>
                          setFormData({ ...formData, date: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Statut *
                      </label>
                      <select
                        required
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            status: e.target.value as
                              | "pending"
                              | "completed"
                              | "cancelled",
                          })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      >
                        <option value="pending">En attente</option>
                        <option value="completed">Terminé</option>
                        <option value="cancelled">Annulé</option>
                      </select>
                    </div>
                  </div>

                  {/* Articles */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Articles de l&apos;achat
                      </label>
                      <button
                        type="button"
                        onClick={addItem}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        + Ajouter article
                      </button>
                    </div>
                    <div className="space-y-2">
                      {formData.items.map((item, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-5 gap-2 items-center p-2 border rounded"
                        >
                          <select
                            value={item.productId}
                            onChange={(e) => {
                              const newItems = [...formData.items];
                              newItems[index].productId = parseInt(
                                e.target.value,
                              );
                              setFormData({ ...formData, items: newItems });
                            }}
                            className="border border-gray-300 rounded px-2 py-1 text-sm text-black"
                          >
                            <option value={0}>Sélectionner produit</option>
                            {availableProducts.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            placeholder="Quantité"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItemQuantity(
                                index,
                                parseInt(e.target.value) || 0,
                              )
                            }
                            className="border border-gray-300 rounded px-2 py-1 text-sm text-black"
                          />
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Prix unitaire"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateItemPrice(
                                index,
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="border border-gray-300 rounded px-2 py-1 text-sm text-black"
                          />
                          <span className="text-sm font-medium">
                            {(item.quantity * item.unitPrice).toFixed(2)} €
                          </span>
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    {formData.items.length > 0 && (
                      <div className="text-right mt-2">
                        <span className="font-medium">
                          Total:{" "}
                          {formData.items
                            .reduce(
                              (sum, item) =>
                                sum + item.quantity * item.unitPrice,
                              0,
                            )
                            .toFixed(2)}{" "}
                          €
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      {editingPurchase ? "Modifier" : "Enregistrer"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default PurchasesPage;
