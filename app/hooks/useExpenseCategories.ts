import { useState } from "react";

export interface ExpenseCategory {
  expense_category_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

interface ExpenseCategoryResponse {
  expense_category: ExpenseCategory;
}

interface ExpenseCategoriesResponse {
  expense_categories: ExpenseCategory[];
}

interface UseExpenseCategoriesResult {
  categories: ExpenseCategory[];
  loading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  getCategoryById: (id: string) => Promise<ExpenseCategory | null>;
  addCategory: (name: string, description?: string) => Promise<void>;
  updateCategory: (
    id: string,
    name: string,
    description?: string,
  ) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:7000";

function getAuthHeaders() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

const useExpenseCategories = (): UseExpenseCategoriesResult => {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Lister toutes les catégories
  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/admin/expenses/categories`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la récupération des catégories de dépenses",
      );
    } finally {
      setLoading(false);
    }
  };

  // Obtenir une catégorie par ID
  const getCategoryById = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${BACKEND_URL}/admin/expenses/categories/${id}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        },
      );
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      const data: ExpenseCategoryResponse = await res.json();
      return data.expense_category;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la récupération de la catégorie",
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Ajouter une catégorie
  const addCategory = async (name: string, description?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/admin/expenses/categories`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      await fetchCategories();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la création de la catégorie",
      );
    } finally {
      setLoading(false);
    }
  };

  // Modifier une catégorie
  const updateCategory = async (
    id: string,
    name: string,
    description?: string,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${BACKEND_URL}/admin/expenses/categories/${id}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ name, description }),
        },
      );
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      await fetchCategories();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la modification de la catégorie",
      );
    } finally {
      setLoading(false);
    }
  };

  // Supprimer une catégorie
  const deleteCategory = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${BACKEND_URL}/admin/expenses/categories/${id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        },
      );
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      await fetchCategories();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la suppression de la catégorie",
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    categories,
    loading,
    error,
    fetchCategories,
    getCategoryById,
    addCategory,
    updateCategory,
    deleteCategory,
  };
};

export default useExpenseCategories;
