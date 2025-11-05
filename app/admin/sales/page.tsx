"use client";

import React, { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  PrinterIcon,
  EyeIcon,
  DocumentTextIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

interface Sale {
  id: number;
  saleNumber: string;
  cashier: string;
  customer?: string;
  date: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: "cash" | "card" | "check";
  status: "completed" | "cancelled" | "refunded";
  notes?: string;
  createdAt: string;
}

interface SaleItem {
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
  sellPrice: number;
  stock: number;
}

const SalesPage = () => {
  const [sales, setSales] = useState<Sale[]>([
    {
      id: 1,
      saleNumber: "VTE-2024-001",
      cashier: "Marie Dupont",
      customer: "Client anonyme",
      date: "2024-01-20",
      items: [
        {
          productId: 1,
          productName: "Coca-Cola 33cl",
          quantity: 2,
          unitPrice: 2.0,
          totalPrice: 4.0,
        },
        {
          productId: 2,
          productName: "Sandwich Jambon",
          quantity: 1,
          unitPrice: 4.0,
          totalPrice: 4.0,
        },
      ],
      subtotal: 8.0,
      tax: 0.8,
      total: 8.8,
      paymentMethod: "cash",
      status: "completed",
      notes: "Client régulier",
      createdAt: "2024-01-20T14:30:00",
    },
    {
      id: 2,
      saleNumber: "VTE-2024-002",
      cashier: "Jean Martin",
      date: "2024-01-20",
      items: [
        {
          productId: 3,
          productName: "Café",
          quantity: 3,
          unitPrice: 1.5,
          totalPrice: 4.5,
        },
      ],
      subtotal: 4.5,
      tax: 0.45,
      total: 4.95,
      paymentMethod: "card",
      status: "completed",
      createdAt: "2024-01-20T15:15:00",
    },
    {
      id: 3,
      saleNumber: "VTE-2024-003",
      cashier: "Marie Dupont",
      date: "2024-01-19",
      items: [
        {
          productId: 1,
          productName: "Coca-Cola 33cl",
          quantity: 1,
          unitPrice: 2.0,
          totalPrice: 2.0,
        },
      ],
      subtotal: 2.0,
      tax: 0.2,
      total: 2.2,
      paymentMethod: "cash",
      status: "refunded",
      notes: "Remboursement demandé",
      createdAt: "2024-01-19T11:45:00",
    },
  ]);

  const [availableProducts] = useState<Product[]>([
    {
      id: 1,
      name: "Coca-Cola 33cl",
      category: "Boissons",
      sellPrice: 2.0,
      stock: 45,
    },
    {
      id: 2,
      name: "Sandwich Jambon",
      category: "Nourriture",
      sellPrice: 4.0,
      stock: 12,
    },
    { id: 3, name: "Café", category: "Boissons", sellPrice: 1.5, stock: 30 },
    {
      id: 4,
      name: "Eau minérale",
      category: "Boissons",
      sellPrice: 1.5,
      stock: 8,
    },
  ]);

  const [cashiers] = useState(["Marie Dupont", "Jean Martin", "Paul Dubois"]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [cashierFilter, setCashierFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [formData, setFormData] = useState({
    cashier: "",
    customer: "",
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "cash" as "cash" | "card" | "check",
    status: "completed" as "completed" | "cancelled" | "refunded",
    notes: "",
    items: [] as { productId: number; quantity: number }[],
  });

  // Filtrage des ventes
  const filteredSales = sales.filter((sale) => {
    const matchesSearch =
      sale.saleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.cashier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || sale.status === statusFilter;
    const matchesCashier =
      cashierFilter === "all" || sale.cashier === cashierFilter;

    let matchesDate = true;
    if (dateFilter !== "all") {
      const saleDate = new Date(sale.date);
      const today = new Date();
      const diffTime = today.getTime() - saleDate.getTime();
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

    return matchesSearch && matchesStatus && matchesCashier && matchesDate;
  });

  const generateSaleNumber = () => {
    const year = new Date().getFullYear();
    const count = sales.length + 1;
    return `VTE-${year}-${count.toString().padStart(3, "0")}`;
  };

  const calculateSaleTotal = (
    items: { productId: number; quantity: number }[],
  ) => {
    const subtotal = items.reduce((sum, item) => {
      const product = availableProducts.find((p) => p.id === item.productId);
      return sum + (product ? product.sellPrice * item.quantity : 0);
    }, 0);
    const tax = subtotal * 0.1; // 10% de TVA
    return { subtotal, tax, total: subtotal + tax };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const items = formData.items.map((item) => {
      const product = availableProducts.find((p) => p.id === item.productId);
      return {
        ...item,
        productName: product?.name || "",
        unitPrice: product?.sellPrice || 0,
        totalPrice: (product?.sellPrice || 0) * item.quantity,
      };
    });

    const { subtotal, tax, total } = calculateSaleTotal(formData.items);

    const saleData = {
      cashier: formData.cashier,
      customer: formData.customer || "Client anonyme",
      date: formData.date,
      paymentMethod: formData.paymentMethod,
      status: formData.status,
      notes: formData.notes,
      items,
      subtotal,
      tax,
      total,
    };

    if (editingSale) {
      // Modifier vente existante
      setSales(
        sales.map((s) =>
          s.id === editingSale.id ? { ...editingSale, ...saleData } : s,
        ),
      );
    } else {
      // Ajouter nouvelle vente
      const newSale: Sale = {
        id: Math.max(...sales.map((s) => s.id)) + 1,
        saleNumber: generateSaleNumber(),
        ...saleData,
        createdAt: new Date().toISOString(),
      };
      setSales([...sales, newSale]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      cashier: "",
      customer: "",
      date: new Date().toISOString().split("T")[0],
      paymentMethod: "cash",
      status: "completed",
      notes: "",
      items: [],
    });
    setEditingSale(null);
    setShowModal(false);
  };

  const handleEdit = (sale: Sale) => {
    setFormData({
      cashier: sale.cashier,
      customer: sale.customer || "",
      date: sale.date,
      paymentMethod: sale.paymentMethod,
      status: sale.status,
      notes: sale.notes || "",
      items: sale.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    });
    setEditingSale(sale);
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette vente ?")) {
      setSales(sales.filter((s) => s.id !== id));
    }
  };

  const handleViewReceipt = (sale: Sale) => {
    setSelectedSale(sale);
    setShowReceiptModal(true);
  };

  const handlePrintReceipt = (sale: Sale) => {
    // Simulation d'impression de reçu
    const receiptContent = generateReceiptContent(sale);
    console.log("Impression du reçu:", receiptContent);
    alert("Reçu envoyé à l'imprimante ! (Simulation)");
  };

  const generateReceiptContent = (sale: Sale) => {
    return {
      saleNumber: sale.saleNumber,
      date: sale.date,
      cashier: sale.cashier,
      items: sale.items,
      subtotal: sale.subtotal,
      tax: sale.tax,
      total: sale.total,
      paymentMethod: sale.paymentMethod,
    };
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: 0, quantity: 1 }],
    });
  };

  const updateItem = (
    index: number,
    field: "productId" | "quantity",
    value: number,
  ) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      case "refunded":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "cash":
        return "💰";
      case "card":
        return "💳";
      case "check":
        return "📝";
      default:
        return "💰";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Gestion des Ventes
              </h1>
              <p className="text-gray-600">
                Enregistrez et suivez toutes les transactions
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Nouvelle Vente</span>
            </button>
          </div>

          {/* Filtres et recherche */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher une vente..."
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
                <option value="completed">Terminée</option>
                <option value="cancelled">Annulée</option>
                <option value="refunded">Remboursée</option>
              </select>
              <select
                value={cashierFilter}
                onChange={(e) => setCashierFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              >
                <option value="all">Tous les caissiers</option>
                {cashiers.map((cashier) => (
                  <option key={cashier} value={cashier}>
                    {cashier}
                  </option>
                ))}
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
                <CurrencyDollarIcon className="w-4 h-4" />
                <span>{filteredSales.length} vente(s) trouvée(s)</span>
              </div>
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
                    N° Vente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Caissier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Articles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paiement
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
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {sale.saleNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(sale.createdAt).toLocaleDateString()} à{" "}
                        {new Date(sale.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserIcon className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {sale.cashier}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {sale.customer || "Client anonyme"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {sale.items.length} article(s)
                      </div>
                      <div className="text-xs text-gray-500">
                        {sale.items.slice(0, 2).map((item, index) => (
                          <div key={index}>
                            {item.productName} (x{item.quantity})
                          </div>
                        ))}
                        {sale.items.length > 2 && (
                          <div className="text-gray-400">
                            +{sale.items.length - 2} autres...
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(sale.total)}
                      </div>
                      <div className="text-xs text-gray-500">
                        HT: {formatCurrency(sale.subtotal)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="mr-2">
                          {getPaymentMethodIcon(sale.paymentMethod)}
                        </span>
                        <span className="text-sm text-gray-900 capitalize">
                          {sale.paymentMethod}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(sale.status)}`}
                      >
                        {sale.status === "completed" && "Terminée"}
                        {sale.status === "cancelled" && "Annulée"}
                        {sale.status === "refunded" && "Remboursée"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewReceipt(sale)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Voir le reçu"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrintReceipt(sale)}
                          className="text-green-600 hover:text-green-900"
                          title="Imprimer le reçu"
                        >
                          <PrinterIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(sale)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Modifier"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(sale.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Supprimer"
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

        {/* Modal Ajouter/Modifier Vente */}
        {showModal && (
          <div className="fixed inset-0 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingSale ? "Modifier la vente" : "Nouvelle vente"}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Caissier *
                      </label>
                      <select
                        required
                        value={formData.cashier}
                        onChange={(e) =>
                          setFormData({ ...formData, cashier: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      >
                        <option value="">Sélectionner un caissier</option>
                        {cashiers.map((cashier) => (
                          <option key={cashier} value={cashier}>
                            {cashier}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Client
                      </label>
                      <input
                        type="text"
                        value={formData.customer}
                        onChange={(e) =>
                          setFormData({ ...formData, customer: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mode de paiement *
                      </label>
                      <select
                        required
                        value={formData.paymentMethod}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            paymentMethod: e.target.value as
                              | "cash"
                              | "card"
                              | "check",
                          })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      >
                        <option value="cash">Espèces</option>
                        <option value="card">Carte</option>
                        <option value="check">Chèque</option>
                      </select>
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
                              | "completed"
                              | "cancelled"
                              | "refunded",
                          })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      >
                        <option value="completed">Terminée</option>
                        <option value="cancelled">Annulée</option>
                        <option value="refunded">Remboursée</option>
                      </select>
                    </div>
                  </div>

                  {/* Articles */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Articles vendus
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
                      {formData.items.map((item, index) => {
                        const product = availableProducts.find(
                          (p) => p.id === item.productId,
                        );
                        return (
                          <div
                            key={index}
                            className="grid grid-cols-4 gap-2 items-center p-2 border rounded"
                          >
                            <select
                              value={item.productId}
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "productId",
                                  parseInt(e.target.value),
                                )
                              }
                              className="border border-gray-300 rounded px-2 py-1 text-sm text-black"
                            >
                              <option value={0}>Sélectionner produit</option>
                              {availableProducts.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.name} -{" "}
                                  {formatCurrency(product.sellPrice)}
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              min="1"
                              placeholder="Quantité"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "quantity",
                                  parseInt(e.target.value) || 1,
                                )
                              }
                              className="border border-gray-300 rounded px-2 py-1 text-sm text-black"
                            />
                            <span className="text-sm font-medium">
                              {product
                                ? formatCurrency(
                                    product.sellPrice * item.quantity,
                                  )
                                : "0.00 €"}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    {formData.items.length > 0 && (
                      <div className="text-right mt-2 p-2 bg-gray-50 rounded">
                        <div className="text-sm">
                          Sous-total:{" "}
                          {formatCurrency(
                            calculateSaleTotal(formData.items).subtotal,
                          )}
                        </div>
                        <div className="text-sm">
                          TVA (10%):{" "}
                          {formatCurrency(
                            calculateSaleTotal(formData.items).tax,
                          )}
                        </div>
                        <div className="text-lg font-bold">
                          Total:{" "}
                          {formatCurrency(
                            calculateSaleTotal(formData.items).total,
                          )}
                        </div>
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
                      rows={2}
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
                      {editingSale ? "Modifier" : "Enregistrer"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal Reçu */}
        {showReceiptModal && selectedSale && (
          <div className="fixed inset-0 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 text-center">
                  Reçu de Vente
                </h3>
                <div className="text-center text-sm text-gray-600">
                  Gest Store
                </div>
              </div>

              <div className="border-t border-b py-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>N° Vente:</span>
                  <span className="font-medium">{selectedSale.saleNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Date:</span>
                  <span>
                    {new Date(selectedSale.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Caissier:</span>
                  <span>{selectedSale.cashier}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Client:</span>
                  <span>{selectedSale.customer}</span>
                </div>
              </div>

              <div className="py-4">
                <h4 className="font-medium text-sm mb-2">Articles:</h4>
                {selectedSale.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between text-sm py-1"
                  >
                    <span>
                      {item.productName} x{item.quantity}
                    </span>
                    <span>{formatCurrency(item.totalPrice)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Sous-total:</span>
                  <span>{formatCurrency(selectedSale.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>TVA:</span>
                  <span>{formatCurrency(selectedSale.tax)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(selectedSale.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Paiement:</span>
                  <span className="capitalize">
                    {selectedSale.paymentMethod}
                  </span>
                </div>
              </div>

              <div className="text-center text-xs text-gray-500 mt-4">
                Merci de votre visite !
              </div>

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => handlePrintReceipt(selectedSale)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
                >
                  <PrinterIcon className="w-4 h-4" />
                  <span>Imprimer</span>
                </button>
                <button
                  onClick={() => setShowReceiptModal(false)}
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

export default SalesPage;
