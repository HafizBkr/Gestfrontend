import { useState, useCallback } from "react";

// Types pour les ventes
export interface SaleItem {
  sale_item_id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  product_name?: string;
  category_name?: string;
}

export interface Sale {
  sale_id: string;
  receipt_number: string;
  cashier_id: string;
  username: string;
  date: string;
  total_amount: string;
  items: SaleItem[];
}

export interface SalesResponse {
  sales: Sale[];
}

const useSales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:7000";

  // Fonction utilitaire pour les requêtes API
  const makeRequest = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("admin_token")
          : null;

      const response = await fetch(`${baseUrl}${url}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Erreur réseau" }));
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      return response.json();
    },
    [baseUrl],
  );

  // Récupérer toutes les ventes
  const getAllSales = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data: SalesResponse = await makeRequest("/admin/sales/all");
      setSales(data.sales || []);
      return data.sales;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des ventes";
      setError(errorMessage);
      console.error("Erreur lors du chargement des ventes:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  // Récupérer les ventes par caissier
  const getSalesByCashier = useCallback(
    async (cashierId: string) => {
      setLoading(true);
      setError(null);

      try {
        const data: SalesResponse = await makeRequest(
          `/admin/sales/cashier/${cashierId}`,
        );
        setSales(data.sales || []);
        return data.sales;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement des ventes";
        setError(errorMessage);
        console.error(
          "Erreur lors du chargement des ventes par caissier:",
          err,
        );
        return [];
      } finally {
        setLoading(false);
      }
    },
    [makeRequest],
  );

  // Récupérer les ventes par période
  const getSalesByDateRange = useCallback(
    async (startDate: string, endDate: string) => {
      setLoading(true);
      setError(null);

      try {
        const data: SalesResponse = await makeRequest(
          `/admin/sales/date-range?start=${startDate}&end=${endDate}`,
        );
        setSales(data.sales || []);
        return data.sales;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement des ventes";
        setError(errorMessage);
        console.error("Erreur lors du chargement des ventes par période:", err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [makeRequest],
  );

  // Récupérer une vente spécifique
  const getSaleById = useCallback(
    async (saleId: string) => {
      setLoading(true);
      setError(null);

      try {
        const data = await makeRequest(`/admin/sales/${saleId}`);
        return data;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement de la vente";
        setError(errorMessage);
        console.error("Erreur lors du chargement de la vente:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [makeRequest],
  );

  // Calculer les statistiques des ventes
  const calculateSalesStats = useCallback(
    (salesData: Sale[] = sales) => {
      const totalSales = salesData.length;
      const totalAmount = salesData.reduce(
        (sum, sale) => sum + Number(sale.total_amount),
        0,
      );
      const totalItems = salesData.reduce(
        (sum, sale) =>
          sum +
          sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
        0,
      );

      const salesByDate = salesData.reduce(
        (acc, sale) => {
          const date = new Date(sale.date).toDateString();
          acc[date] = (acc[date] || 0) + Number(sale.total_amount);
          return acc;
        },
        {} as Record<string, number>,
      );

      const salesByCashier = salesData.reduce(
        (acc, sale) => {
          acc[sale.username] =
            (acc[sale.username] || 0) + Number(sale.total_amount);
          return acc;
        },
        {} as Record<string, number>,
      );

      return {
        totalSales,
        totalAmount,
        totalItems,
        averageSaleAmount: totalSales > 0 ? totalAmount / totalSales : 0,
        salesByDate,
        salesByCashier,
      };
    },
    [sales],
  );

  // Filtrer les ventes
  const filterSales = useCallback(
    (filters: {
      cashier?: string;
      dateStart?: string;
      dateEnd?: string;
      minAmount?: number;
      maxAmount?: number;
    }) => {
      return sales.filter((sale) => {
        const saleDate = new Date(sale.date);
        const saleAmount = Number(sale.total_amount);

        if (filters.cashier && sale.username !== filters.cashier) return false;
        if (filters.dateStart && saleDate < new Date(filters.dateStart))
          return false;
        if (filters.dateEnd && saleDate > new Date(filters.dateEnd))
          return false;
        if (filters.minAmount && saleAmount < filters.minAmount) return false;
        if (filters.maxAmount && saleAmount > filters.maxAmount) return false;

        return true;
      });
    },
    [sales],
  );

  return {
    sales,
    loading,
    error,
    getAllSales,
    getSalesByCashier,
    getSalesByDateRange,
    getSaleById,
    calculateSalesStats,
    filterSales,
  };
};

export default useSales;
