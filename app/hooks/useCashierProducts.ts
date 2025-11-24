import { useEffect, useState, useCallback } from "react";

interface Product {
  product_id: string;
  name: string;
  category_id: string;
  quantity: number;
  purchase_price: string;
  sale_price: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

interface ProductsResponse {
  products: Product[];
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:7000";

/**
 * Hook pour récupérer les produits du caissier via l'API sécurisée.
 * @param token Le token d'authentification du caissier
 */
export default function useCashierProducts(token: string | null) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!token) {
      setProducts([]);
      setError("Token d'authentification manquant");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${BACKEND_URL}/cashiers/products?onlyActive=false`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des produits");
      }

      const data: ProductsResponse = await response.json();
      setProducts(data.products || []);
    } catch (err) {
      setError("Impossible de charger les produits");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
  };
}
