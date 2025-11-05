import { useState } from "react";

export interface RestockItem {
  restock_item_id?: string;
  product_id: string;
  quantity: number;
  purchase_price?: number;
}

export interface Restock {
  restock_id: string;
  date: string;
  items: RestockItem[];
}

interface RestocksResponse {
  restocks: Restock[];
}

interface RestockResponse {
  restock: Restock;
}

interface UseRestockResult {
  restocks: Restock[];
  restock: Restock | null;
  loading: boolean;
  error: string | null;
  createRestock: (items: Omit<RestockItem, 'restock_item_id'>[]) => Promise<void>;
  getRestocks: () => Promise<void>;
  getRestockById: (restockId: string) => Promise<void>;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:7000";

function getAuthHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

const useRestock = (): UseRestockResult => {
  const [restocks, setRestocks] = useState<Restock[]>([]);
  const [restock, setRestock] = useState<Restock | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Créer un restock
  const createRestock = async (items: Omit<RestockItem, 'restock_item_id'>[]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/admin/restock/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      const data: RestockResponse = await res.json();
      // Ajouter le nouveau restock à la liste
      setRestocks(prev => [data.restock, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création du restockage");
    } finally {
      setLoading(false);
    }
  };

  // 2. Lister tous les restocks
  const getRestocks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/admin/restock/`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      const data: RestocksResponse = await res.json();
      setRestocks(data.restocks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la récupération des restockages");
    } finally {
      setLoading(false);
    }
  };

  // 3. Obtenir un restock par son ID
  const getRestockById = async (restockId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/admin/restock/${restockId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      const data: RestockResponse = await res.json();
      setRestock(data.restock);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la récupération du restockage");
    } finally {
      setLoading(false);
    }
  };

  return {
    restocks,
    restock,
    loading,
    error,
    createRestock,
    getRestocks,
    getRestockById,
  };
};

export default useRestock;
