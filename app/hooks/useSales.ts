import { useState } from "react";

interface SaleItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  product_name?: string;
}

interface ReceiptItem {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface ReceiptData {
  receipt_number: string;
  date: string;
  cashier_name: string;
  items: ReceiptItem[];
  subtotal: number;
  tax_amount: number;
  total_amount: number;
}

interface SaleRequest {
  items: SaleItem[];
}

interface SaleResponse {
  sale_id: string;
  total_amount: number;
  tax_amount: number;
  items: SaleItem[];
  receipt_data: ReceiptData;
  message?: string;
}

interface SaleErrorResponse {
  message: string;
  error?: string;
}

interface UseSalesResult {
  createSale: (items: SaleItem[]) => Promise<SaleResponse | null>;
  loading: boolean;
  error: string | null;
  lastSale: SaleResponse | null;
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:7000";

/**
 * Hook pour gérer les ventes via l'API.
 * Permet de créer une vente et générer un reçu.
 */
export default function useSales(): UseSalesResult {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSale, setLastSale] = useState<SaleResponse | null>(null);

  const createSale = async (
    items: SaleItem[],
  ): Promise<SaleResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("cashier_token")
          : null;

      if (!token) {
        setError("Token d'authentification manquant");
        setLoading(false);
        return null;
      }

      const saleData: SaleRequest = { items };

      console.log("Envoi des données de vente:", saleData);

      const response = await fetch(`${BACKEND_URL}/sales`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(saleData),
      });

      let data: SaleResponse | SaleErrorResponse;
      try {
        data = await response.json();
      } catch {
        setError("Réponse serveur invalide");
        setLoading(false);
        return null;
      }

      // Debug : afficher la réponse complète
      console.log("Réponse API sales:", data);
      console.log("Status response:", response.ok);

      if (response.ok) {
        // Créer des données de reçu par défaut si pas fournies par l'API
        const receiptData: ReceiptData =
          "receipt_data" in data && data.receipt_data
            ? data.receipt_data
            : {
                receipt_number: `REC-${Date.now()}`,
                date: new Date().toISOString(),
                cashier_name: "Caissier",
                items: items.map((item: SaleItem) => ({
                  name: item.product_name || `Produit ${item.product_id}`,
                  quantity: item.quantity,
                  unit_price: item.unit_price,
                  total_price: item.quantity * item.unit_price,
                })),
                subtotal: items.reduce(
                  (sum: number, item: SaleItem) =>
                    sum + item.quantity * item.unit_price,
                  0,
                ),
                tax_amount: 0,
                total_amount: items.reduce(
                  (sum: number, item: SaleItem) =>
                    sum + item.quantity * item.unit_price,
                  0,
                ),
              };

        const saleResponse: SaleResponse = {
          sale_id:
            "sale_id" in data && typeof data.sale_id === "string"
              ? data.sale_id
              : `SALE-${Date.now()}`,
          total_amount:
            "total_amount" in data && typeof data.total_amount === "number"
              ? data.total_amount
              : receiptData.total_amount,
          tax_amount:
            "tax_amount" in data && typeof data.tax_amount === "number"
              ? data.tax_amount
              : receiptData.tax_amount,
          items: items,
          receipt_data: receiptData,
        };

        setLastSale(saleResponse);
        setLoading(false);
        return saleResponse;
      } else {
        setError(
          "message" in data && typeof data.message === "string"
            ? data.message
            : "Erreur lors de la création de la vente",
        );
        setLoading(false);
        return null;
      }
    } catch {
      setError("Erreur réseau ou serveur");
      setLoading(false);
      return null;
    }
  };

  return { createSale, loading, error, lastSale };
}
