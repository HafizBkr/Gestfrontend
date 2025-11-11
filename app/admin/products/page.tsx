"use client";

import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import useProducts, { Product } from "../../hooks/useProducts";
import useCategories from "../../hooks/useCategories";
import RestockForm from "@/components/admin/RestockForm";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import {
  generateProductReport,
  ProductReportItem,
} from "@/utils/productReportGenerator";

const ProductsPage = () => {
  const {
    products,
    loading,
    error,
    getProducts,
    createProduct,
    updateProduct,
    enableProduct,
    disableProduct,
    deleteProduct,
  } = useProducts();

  const { categories, fetchCategories } = useCategories();

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [showRestockForm, setShowRestockForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    category_id: string;
    quantity: string;
    purchase_price: string;
    sale_price: string;
    description: string;
    supplier: string;
  }>({
    name: "",
    category_id: "",
    quantity: "",
    purchase_price: "",
    sale_price: "",
    description: "",
    supplier: "",
  });

  // Charger les produits et catégories au montage du composant
  useEffect(() => {
    getProducts();
    fetchCategories();
  }, []);

  // Filtrage des produits
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      (typeof product.name === "string" &&
        product.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (typeof product.description === "string" &&
        product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory =
      categoryFilter === "all" || product.category_id === categoryFilter;
    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "low" && product.quantity <= 10) ||
      (stockFilter === "high" && product.quantity > 10);

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Tri des produits filtrés par date de création décroissante (created_at)
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return dateB - dateA;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Vérification unicité produit (nom + catégorie)
      const isDuplicateProduct = products.some(
        (p) =>
          p.name.trim().toLowerCase() === formData.name.trim().toLowerCase() &&
          p.category_id === formData.category_id &&
          (!editingProduct || p.product_id !== editingProduct.product_id),
      );
      if (isDuplicateProduct) {
        alert("Un produit avec ce nom existe déjà dans cette catégorie.");
        return;
      }

      const productData = {
        name: formData.name,
        category_id: formData.category_id,
        quantity: parseInt(formData.quantity),
        purchase_price: parseFloat(formData.purchase_price),
        sale_price: parseFloat(formData.sale_price),
      };

      if (editingProduct) {
        // Modification
        await updateProduct(editingProduct.product_id, productData);
      } else {
        // Ajout
        await createProduct(productData);
      }

      // Reset du formulaire
      resetForm();
    } catch (err) {
      console.error("Erreur lors de la sauvegarde:", err);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category_id: product.category_id,
      quantity: product.quantity.toString(),
      purchase_price: product.purchase_price.toString(),
      sale_price: product.sale_price.toString(),
      description: String(product.description ?? ""),
      supplier: String(product.supplier ?? ""),
    });
    setShowModal(true);
  };

  const handleDelete = async (productId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      await deleteProduct(productId);
    }
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      if (product.is_active) {
        await disableProduct(product.product_id);
      } else {
        await enableProduct(product.product_id);
      }
    } catch (err) {
      console.error("Erreur lors du changement de statut:", err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category_id: "",
      quantity: "",
      purchase_price: "",
      sale_price: "",
      description: "",
      supplier: "",
    });
    setEditingProduct(null);
    setShowModal(false);
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.category_id === categoryId);
    return category ? category.name : "Non définie";
  };

  const totalProducts = products.length;
  const lowStockProducts = products.filter((p) => p.quantity <= 10).length;
  const activeProducts = products.filter((p) => p.is_active).length;

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      category_id: "",
      quantity: "",
      purchase_price: "",
      sale_price: "",
      description: "",
      supplier: "",
    });
    setShowModal(true);
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0)
      return { label: "Rupture", color: "bg-red-100 text-red-800" };
    if (quantity <= 10)
      return { label: "Faible", color: "bg-yellow-100 text-yellow-800" };
    return { label: "Suffisant", color: "bg-green-100 text-green-800" };
  };
  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Gestion des Produits
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez votre inventaire et vos prix
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Produits
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalProducts}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-500">
                <EyeIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Produits Actifs
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {activeProducts}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-500">
                <PlusIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Stock Faible
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {lowStockProducts}
                </p>
              </div>
              <div className="p-3 rounded-full bg-red-500">
                <FunnelIcon className="w-6 h-6 text-white" />
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
                  placeholder="Rechercher un produit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black"
              >
                <option value="all">Toutes les catégories</option>
                {categories.map((category) => (
                  <option
                    key={category.category_id}
                    value={category.category_id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>

              {/* Stock Filter */}
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black"
              >
                <option value="all">Tous les stocks</option>
                <option value="low">Stock faible</option>
                <option value="high">Stock suffisant</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowRestockForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Restockage
              </button>
              <button
                onClick={openAddModal}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Ajouter un produit
              </button>
            </div>
          </div>
        </div>

        {/* Bouton Export PDF Produits */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => {
              // Mapping des produits actifs pour le rapport
              const productsForReport = sortedProducts
                .filter((p) => p.is_active)
                .map((p) => ({
                  product_id: p.product_id,
                  name: p.name,
                  category_name:
                    categories.find((c) => c.category_id === p.category_id)
                      ?.name || "Non définie",
                  quantity: p.quantity,
                  purchase_price:
                    typeof p.purchase_price === "number"
                      ? p.purchase_price
                      : Number(p.purchase_price),
                  sale_price:
                    typeof p.sale_price === "number"
                      ? p.sale_price
                      : Number(p.sale_price),
                  is_active: p.is_active,
                }));
              generateProductReport(productsForReport, {}, "download");
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <EyeIcon className="w-4 h-4 mr-2" />
            Exporter rapport produits
          </button>
        </div>
        {/* Table des produits */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {error && typeof error === "string" && error.length > 0 ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 m-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix d&apos;achat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix de vente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantité
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
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Chargement des produits...
                      </p>
                    </td>
                  </tr>
                ) : sortedProducts.length > 0 ? (
                  sortedProducts.map((product) => {
                    const stockStatus = getStockStatus(product.quantity);

                    return (
                      <tr
                        key={product.product_id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {getCategoryName(product.category_id)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.purchase_price
                            ? Number(product.purchase_price).toFixed(0)
                            : "0"}{" "}
                          FCFA
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.sale_price
                            ? Number(product.sale_price).toFixed(0)
                            : "0"}{" "}
                          FCFA
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">
                              {product.quantity}
                            </span>
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}
                            >
                              {stockStatus.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleStatus(product)}
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer hover:opacity-80 ${
                              product.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {product.is_active ? "Actif" : "Inactif"}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEdit(product)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <EyeIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        Aucun produit trouvé
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Aucun produit ne correspond à vos critères de recherche.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {sortedProducts.length === 0 && !loading && (
            <div className="text-center py-12">
              <EyeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Aucun produit trouvé
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Aucun produit ne correspond à vos critères de recherche.
              </p>
            </div>
          )}
        </div>

        {/* Modal Ajouter/Modifier */}
        {showModal && (
          <div className="fixed inset-0 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white backdrop-blur-none">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingProduct
                    ? "Modifier le produit"
                    : "Ajouter un produit"}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom du produit *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Catégorie *
                    </label>
                    <select
                      required
                      value={formData.category_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          category_id: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    >
                      <option value="" className="text-black">
                        Sélectionner une catégorie
                      </option>
                      {categories.map((category) => (
                        <option
                          key={category.category_id}
                          value={category.category_id}
                          className="text-black"
                        >
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prix d&apos;achat (FCFA) *
                      </label>
                      <input
                        type="number"
                        step="1"
                        required
                        value={formData.purchase_price}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            purchase_price: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prix de vente (FCFA) *
                      </label>
                      <input
                        type="number"
                        step="1"
                        required
                        value={formData.sale_price}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            sale_price: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantit&eacute; initiale *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
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
                      disabled={loading}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading
                        ? "..."
                        : editingProduct
                          ? "Modifier"
                          : "Ajouter"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Restock Form */}
        {showRestockForm && (
          <RestockForm
            products={products}
            onClose={() => setShowRestockForm(false)}
            onSuccess={() => {
              getProducts(); // Recharger les produits après restockage
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default ProductsPage;
