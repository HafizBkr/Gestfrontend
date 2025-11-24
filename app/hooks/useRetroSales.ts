import { useState, useCallback } from "react";

// Types spécifiques aux ventes rétroactives
export interface RetroSaleItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  product_name?: string;
  sale_item_id?: string;
  total_price?: number;
}

export interface CreateRetroSaleRequest {
  date: string;
  cashier_id?: string;
  items: RetroSaleItem[];
}

export interface UpdateRetroSaleRequest {
  date?: string;
  cashier_id?: string;
  items?: RetroSaleItem[];
}

export interface RetroSale {
  sale_id: string;
  cashier_id?: string;
  username?: string;
  date: string;
  total_amount: number;
  created_by_type: 'admin';
  created_by_id: string;
  created_at: string;
  items: RetroSaleItemResponse[];
}

export interface RetroSaleItemResponse {
  sale_item_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface RetroSalesResponse {
  sales: RetroSale[];
}

export interface CreateRetroSaleResponse {
  sale: RetroSale;
}

export interface RetroSaleErrorResponse {
  message: string;
  error?: string;
}

export interface UseRetroSalesResult {
  retroSales: RetroSale[];
  currentRetroSale: RetroSale | null;
  loading: boolean;
  error: string | null;

  // CRUD operations
  createRetroSale: (data: CreateRetroSaleRequest) => Promise<RetroSale | null>;
  getRetroSales: () => Promise<void>;
  getRetroSaleById: (saleId: string) => Promise<RetroSale | null>;
  updateRetroSale: (saleId: string, data: UpdateRetroSaleRequest) => Promise<RetroSale | null>;
  deleteRetroSale: (saleId: string) => Promise<boolean>;

  // Utility functions
  clearError: () => void;
  clearCurrentSale: () => void;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:7000";

/**
 * Obtient les headers d'authentification pour les requêtes admin
 */
function getAuthHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

/**
 * Hook pour gérer les ventes rétroactives via l'API admin.
 * Permet de créer, lister, modifier et supprimer des ventes à une date antérieure.
 */
const useRetroSales = (): UseRetroSalesResult => {
  const [retroSales, setRetroSales] = useState<RetroSale[]>([]);
  const [currentRetroSale, setCurrentRetroSale] = useState<RetroSale | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Efface les erreurs
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Efface la vente courante
   */
  const clearCurrentSale = useCallback(() => {
    setCurrentRetroSale(null);
  }, []);

  /**
   * Créer une nouvelle vente rétroactive
   */
  const createRetroSale = useCallback(async (data: CreateRetroSaleRequest): Promise<RetroSale | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/admin/retro-sales`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorMessage = "Erreur lors de la création de la vente rétroactive";
        try {
          const errorData: RetroSaleErrorResponse = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Si on ne peut pas parser l'erreur, on garde le message par défaut
        }
        throw new Error(errorMessage);
      }

      const result: CreateRetroSaleResponse = await response.json();
      const newSale = result.sale;

      // Ajouter la nouvelle vente à la liste
      setRetroSales(prev => [newSale, ...prev]);
      setCurrentRetroSale(newSale);

      return newSale;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur réseau lors de la création";
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Récupérer toutes les ventes rétroactives
   */
  const getRetroSales = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/admin/retro-sales`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        let errorMessage = "Erreur lors de la récupération des ventes rétroactives";
        try {
          const errorData: RetroSaleErrorResponse = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Si on ne peut pas parser l'erreur, on garde le message par défaut
        }
        throw new Error(errorMessage);
      }

      const result: RetroSalesResponse = await response.json();
      setRetroSales(result.sales);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur réseau lors de la récupération";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Récupérer une vente rétroactive par ID
   */
  const getRetroSaleById = useCallback(async (saleId: string): Promise<RetroSale | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/admin/retro-sales/${saleId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Vente rétroactive non trouvée");
        }
        let errorMessage = "Erreur lors de la récupération de la vente rétroactive";
        try {
          const errorData: RetroSaleErrorResponse = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Si on ne peut pas parser l'erreur, on garde le message par défaut
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      const sale = result.sale;
      setCurrentRetroSale(sale);
      return sale;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur réseau lors de la récupération";
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Modifier une vente rétroactive
   */
  const updateRetroSale = useCallback(async (
    saleId: string,
    data: UpdateRetroSaleRequest
  ): Promise<RetroSale | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/admin/retro-sales/${saleId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Vente rétroactive non trouvée");
        }
        let errorMessage = "Erreur lors de la modification de la vente rétroactive";
        try {
          const errorData: RetroSaleErrorResponse = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Si on ne peut pas parser l'erreur, on garde le message par défaut
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      const updatedSale = result.sale;

      // Mettre à jour la liste des ventes
      setRetroSales(prev =>
        prev.map(sale =>
          sale.sale_id === saleId ? updatedSale : sale
        )
      );

      // Mettre à jour la vente courante si c'est la même
      if (currentRetroSale?.sale_id === saleId) {
        setCurrentRetroSale(updatedSale);
      }

      return updatedSale;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur réseau lors de la modification";
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentRetroSale?.sale_id]);

  /**
   * Supprimer une vente rétroactive
   */
  const deleteRetroSale = useCallback(async (saleId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/admin/retro-sales/${saleId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Vente rétroactive non trouvée");
        }
        let errorMessage = "Erreur lors de la suppression de la vente rétroactive";
        try {
          const errorData: RetroSaleErrorResponse = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Si on ne peut pas parser l'erreur, on garde le message par défaut
        }
        throw new Error(errorMessage);
      }

      // Supprimer de la liste des ventes
      setRetroSales(prev => prev.filter(sale => sale.sale_id !== saleId));

      // Effacer la vente courante si c'est celle qui a été supprimée
      if (currentRetroSale?.sale_id === saleId) {
        setCurrentRetroSale(null);
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur réseau lors de la suppression";
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentRetroSale?.sale_id]);

  return {
    retroSales,
    currentRetroSale,
    loading,
    error,
    createRetroSale,
    getRetroSales,
    getRetroSaleById,
    updateRetroSale,
    deleteRetroSale,
    clearError,
    clearCurrentSale,
  };
};

export default useRetroSales;
