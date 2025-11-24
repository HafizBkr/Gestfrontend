import { useState } from "react";

// Types pour les catégories de dépenses
export interface ExpenseCategory {
  expense_category_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Types pour les dépenses
export interface Expense {
  expense_id: string;
  expense_category_id: string;
  category_name?: string; // Pour affichage direct
  amount: number;
  description?: string;
  date: string;
  created_at: string;
  updated_at: string;
}

interface ExpensesResponse {
  expenses: Expense[];
}

interface ExpenseResponse {
  expense: Expense;
}

interface ExpenseCategoriesResponse {
  categories: ExpenseCategory[];
}

interface UseExpensesResult {
  expenses: Expense[];
  expense: Expense | null;
  loading: boolean;
  error: string | null;
  getExpenses: (params?: {
    startDate?: string;
    endDate?: string;
    expense_category_id?: string;
  }) => Promise<void>;
  getExpenseById: (expenseId: string) => Promise<void>;
  createExpense: (data: Partial<Expense>) => Promise<void>;
  updateExpense: (expenseId: string, data: Partial<Expense>) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
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

const useExpenses = (): UseExpensesResult => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Lister les dépenses (avec filtres optionnels)
  const getExpenses = async (params?: {
    startDate?: string;
    endDate?: string;
    expense_category_id?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      let url = `${BACKEND_URL}/admin/expenses`;
      const query: string[] = [];
      if (params?.startDate) query.push(`startDate=${params.startDate}`);
      if (params?.endDate) query.push(`endDate=${params.endDate}`);
      if (params?.expense_category_id)
        query.push(`expense_category_id=${params.expense_category_id}`);
      if (query.length > 0) url += "?" + query.join("&");

      const res = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      const data: ExpensesResponse = await res.json();
      setExpenses(data.expenses);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la récupération des dépenses",
      );
    } finally {
      setLoading(false);
    }
  };

  // Obtenir une dépense par ID
  const getExpenseById = async (expenseId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${BACKEND_URL}/admin/expenses/${expenseId}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      const data: ExpenseResponse = await res.json();
      setExpense(data.expense);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la récupération de la dépense",
      );
    } finally {
      setLoading(false);
    }
  };

  // Créer une dépense
  const createExpense = async (data: Partial<Expense>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/admin/expenses`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      await getExpenses(); // Refresh list
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la création de la dépense",
      );
    } finally {
      setLoading(false);
    }
  };

  // Modifier une dépense
  const updateExpense = async (
    expenseId: string,
    data: Partial<Expense>
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${BACKEND_URL}/admin/expenses/${expenseId}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        }
      );
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      await getExpenses(); // Refresh list
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la modification de la dépense",
      );
    } finally {
      setLoading(false);
    }
  };

  // Supprimer une dépense
  const deleteExpense = async (expenseId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${BACKEND_URL}/admin/expenses/${expenseId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      await getExpenses(); // Refresh list
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la suppression de la dépense",
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    expenses,
    expense,
    loading,
    error,
    getExpenses,
    getExpenseById,
    createExpense,
    updateExpense,
    deleteExpense,
  };
};

export default useExpenses;
