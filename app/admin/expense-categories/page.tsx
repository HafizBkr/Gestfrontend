"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import useExpenseCategories, {
  ExpenseCategory,
} from "../../hooks/useExpenseCategories";
import {
  PlusIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

const ExpenseCategoriesPage = () => {
  const {
    categories,
    loading,
    error,
    fetchCategories,
    addCategory,
    updateCategory,
  } = useExpenseCategories();

  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<ExpenseCategory | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  // Charger les catégories au montage du composant
  useEffect(() => {
    fetchCategories();
  }, []);

  // Filtrage des catégories
  const filteredCategories = categories.filter((category) => {
    const matchesSearch =
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.description &&
        category.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  // Gestion du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Vérification unicité catégorie (nom)
    const isDuplicateCategory = categories.some(
      (c) =>
        c.name.trim().toLowerCase() === formData.name.trim().toLowerCase() &&
        (!editingCategory ||
          c.expense_category_id !== editingCategory.expense_category_id),
    );
    if (isDuplicateCategory) {
      alert("Une catégorie avec ce nom existe déjà.");
      return;
    }

    try {
      if (editingCategory) {
        // Modification
        await updateCategory(
          editingCategory.expense_category_id,
          formData.name,
          formData.description,
        );
      } else {
        // Ajout
        await addCategory(formData.name, formData.description);
      }

      // Reset du formulaire
      setFormData({
        name: "",
        description: "",
      });
      setEditingCategory(null);
      setShowModal(false);
    } catch (err) {
      console.error("Erreur lors de la sauvegarde:", err);
    }
  };

  const handleEdit = (category: ExpenseCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
    });
    setShowModal(true);
  };

  // Désactivation/activation (soft delete)
  const handleToggleActive = async (category: ExpenseCategory) => {
    const action = category.is_active ? "désactiver" : "activer";
    if (
      window.confirm(
        `Voulez-vous vraiment ${action} cette catégorie de dépense ?`,
      )
    ) {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("admin_token")
            : null;
        const baseUrl =
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:7000";
        await fetch(
          `${baseUrl}/admin/expenses/categories/${category.expense_category_id}/activation`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({ is_active: !category.is_active }),
          },
        );
        await fetchCategories();
      } catch (e) {
        alert("Erreur lors du changement de statut.");
      }
    }
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
    });
    setShowModal(true);
  };

  const totalCategories = categories.length;

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Catégories de Dépenses
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez les catégories de dépenses de votre établissement
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Catégories
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalCategories}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-500">
                <EyeIcon className="w-6 h-6 text-white" />
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
                  placeholder="Rechercher une catégorie..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Add Button */}
            <button
              onClick={openAddModal}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Ajouter une catégorie
            </button>
          </div>
        </div>

        {/* Categories Table */}
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
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Créée le
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Chargement des catégories...
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((category) => (
                    <tr
                      key={category.expense_category_id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {category.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {category.description || (
                            <span className="italic text-gray-400">Aucune</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(category.created_at).toLocaleDateString(
                          "fr-FR",
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(category)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(category)}
                            className={`p-1 rounded ${
                              category.is_active
                                ? "text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50"
                                : "text-green-600 hover:text-green-900 hover:bg-green-50"
                            }`}
                          >
                            {category.is_active ? "Désactiver" : "Activer"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredCategories.length === 0 && !loading && (
            <div className="text-center py-12">
              <EyeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Aucune catégorie trouvée
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Aucune catégorie ne correspond à vos critères de recherche.
              </p>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white backdrop-blur-none">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingCategory
                    ? "Modifier la catégorie"
                    : "Ajouter une catégorie"}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom de la catégorie *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      placeholder="Ex: Fournitures de bureau"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      placeholder="Ex: Achats de papier, stylos, etc."
                      rows={2}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      {editingCategory ? "Enregistrer" : "Ajouter"}
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

export default ExpenseCategoriesPage;
