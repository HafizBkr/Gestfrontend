"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import useExpenses, { Expense } from "../../hooks/useExpenses";
import useExpenseCategories from "../../hooks/useExpenseCategories";
import {
  PlusIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import {
  generateExpenseReport,
  ExpenseReportItem,
} from "@/utils/expenseReportGenerator";

const ExpensesPage = () => {
  const {
    expenses,
    loading,
    error,
    getExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
  } = useExpenses();

  const { categories, fetchCategories } = useExpenseCategories();

  // Filtres et états du formulaire
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  // Nouveau filtre date : all, single, range
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [singleDate, setSingleDate] = useState("");
  const [rangeStartDate, setRangeStartDate] = useState("");
  const [rangeEndDate, setRangeEndDate] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    expense_category_id: "",
    amount: "",
    description: "",
    date: "",
  });

  // Charger les dépenses et catégories au montage
  useEffect(() => {
    getExpenses();
    fetchCategories();
  }, []);

  // Filtrage des dépenses
  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      (expense.description &&
        expense.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      categories
        .find((c) => c.expense_category_id === expense.expense_category_id)
        ?.name.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      String(expense.amount).includes(searchTerm);

    const matchesCategory =
      categoryFilter === "all" ||
      expense.expense_category_id === categoryFilter;

    let matchesDate = true;
    const expenseDate = expense.date.slice(0, 10);
    if (dateFilter === "single" && singleDate) {
      matchesDate = expenseDate === singleDate;
    } else if (dateFilter === "range" && rangeStartDate && rangeEndDate) {
      matchesDate =
        expenseDate >= rangeStartDate && expenseDate <= rangeEndDate;
    }

    return matchesSearch && matchesCategory && matchesDate;
  });

  // Tri par date décroissante
  const sortedExpenses = [...filteredExpenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  // Génération du rapport PDF des dépenses
  const handleExportReport = () => {
    const expensesForReport: ExpenseReportItem[] = sortedExpenses.map(
      (exp) => ({
        expense_id: exp.expense_id,
        expense_category_id: exp.expense_category_id,
        category_name:
          categories.find(
            (c) => c.expense_category_id === exp.expense_category_id,
          )?.name || "Non définie",
        amount: Number(exp.amount),
        description: exp.description,
        date: exp.date,
      }),
    );

    // Déterminer la période affichée
    let dateRange = "Toutes les dates";
    if (dateFilter === "single" && singleDate) {
      dateRange = `Le ${new Date(singleDate).toLocaleDateString("fr-FR")}`;
    } else if (dateFilter === "range" && rangeStartDate && rangeEndDate) {
      dateRange = `Du ${new Date(rangeStartDate).toLocaleDateString("fr-FR")} au ${new Date(rangeEndDate).toLocaleDateString("fr-FR")}`;
    }

    generateExpenseReport(
      expensesForReport,
      {
        dateRange,
        filterType:
          categoryFilter === "all"
            ? "Toutes les catégories"
            : `Catégorie: ${categories.find((c) => c.expense_category_id === categoryFilter)?.name || ""}`,
      },
      "download",
    );
  };

  // Total dépenses filtrées
  const totalAmount = sortedExpenses.reduce(
    (sum, exp) => sum + Number(exp.amount),
    0,
  );

  // Handlers formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const expenseData = {
        expense_category_id: formData.expense_category_id,
        amount: Number(formData.amount),
        description: formData.description,
        date: formData.date,
      };

      if (editingExpense) {
        await updateExpense(editingExpense.expense_id, expenseData);
      } else {
        await createExpense(expenseData);
      }

      resetForm();
    } catch (err) {
      // Erreur déjà gérée dans le hook
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      expense_category_id: expense.expense_category_id,
      amount: String(expense.amount),
      description: expense.description || "",
      date: expense.date ? expense.date.slice(0, 10) : "",
    });
    setShowModal(true);
  };

  const handleDelete = async (expenseId: string) => {
    if (window.confirm("Supprimer cette dépense ?")) {
      await deleteExpense(expenseId);
    }
  };

  const resetForm = () => {
    setFormData({
      expense_category_id: "",
      amount: "",
      description: "",
      date: "",
    });
    setEditingExpense(null);
    setShowModal(false);
  };

  const getCategoryName = (categoryId: string) => {
    const cat = categories.find((c) => c.expense_category_id === categoryId);
    return cat ? cat.name : "Non définie";
  };

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Gestion des Dépenses
          </h1>
          <p className="text-gray-600 mt-2">
            Suivi et gestion des dépenses de l&apos;entreprise
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Dépenses (filtrées)
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalAmount.toLocaleString("fr-FR")} FCFA
                </p>
              </div>
              <div className="p-3 rounded-full bg-red-500">
                <FunnelIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Nombre de Dépenses
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {sortedExpenses.length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-500">
                <EyeIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Bouton Export PDF Dépenses */}
        <div className="flex justify-end mb-4">
          <button
            onClick={handleExportReport}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <EyeIcon className="w-4 h-4 mr-2" />
            Exporter rapport dépenses
          </button>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              {/* Recherche */}
              <div className="relative flex-1 md:max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher une dépense, catégorie ou montant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
                />
              </div>

              {/* Catégorie */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black"
              >
                <option value="all">Toutes les catégories</option>
                {categories.map((cat) => (
                  <option
                    key={cat.expense_category_id}
                    value={cat.expense_category_id}
                  >
                    {cat.name}
                  </option>
                ))}
              </select>

              {/* Date */}
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black"
              >
                <option value="all">Toutes les dates</option>
                <option value="single">Date précise</option>
                <option value="range">Période</option>
              </select>
              {dateFilter === "single" && (
                <input
                  type="date"
                  value={singleDate}
                  onChange={(e) => setSingleDate(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black"
                />
              )}
              {dateFilter === "range" && (
                <>
                  <input
                    type="date"
                    value={rangeStartDate}
                    onChange={(e) => setRangeStartDate(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black"
                  />
                  <input
                    type="date"
                    value={rangeEndDate}
                    onChange={(e) => setRangeEndDate(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black"
                  />
                </>
              )}
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Ajouter une dépense
            </button>
          </div>
        </div>

        {/* Table des dépenses */}
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
                    Catégorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
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
                        Chargement des dépenses...
                      </p>
                    </td>
                  </tr>
                ) : sortedExpenses.length > 0 ? (
                  sortedExpenses.map((expense) => (
                    <tr
                      key={expense.expense_id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {getCategoryName(expense.expense_category_id)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expense.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {Number(expense.amount).toLocaleString("fr-FR")} FCFA
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(expense.date).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(expense)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(expense.expense_id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <EyeIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        Aucune dépense trouvée
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Aucune dépense ne correspond à vos critères de
                        recherche.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Ajouter/Modifier */}
        {showModal && (
          <div className="fixed inset-0 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white backdrop-blur-none">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingExpense
                    ? "Modifier la dépense"
                    : "Ajouter une dépense"}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Catégorie *
                    </label>
                    <select
                      required
                      value={formData.expense_category_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          expense_category_id: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    >
                      <option value="" className="text-black">
                        Sélectionner une catégorie
                      </option>
                      {categories
                        .filter((category) => category.is_active)
                        .map((category) => (
                          <option
                            key={category.expense_category_id}
                            value={category.expense_category_id}
                            className="text-black"
                          >
                            {category.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Montant (FCFA) *
                    </label>
                    <input
                      type="number"
                      step="1"
                      required
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          amount: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    />
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
                        setFormData({
                          ...formData,
                          date: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      {editingExpense ? "Enregistrer" : "Ajouter"}
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

export default ExpensesPage;
