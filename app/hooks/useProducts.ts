import { useState } from "react";

export interface Product {
  product_id: string;
  name: string;
  category_id: string;
  quantity: number;
  purchase_price: number;
  sale_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Ajoute ici d'autres champs selon ton modèle backend
  [key: string]: unknown;
}

interface ProductsResponse {
  products: Product[];
}

interface ProductResponse {
  product: Product;
}

interface UseProductsResult {
  products: Product[];
  product: Product | null;
  loading: boolean;
  error: string | null;
  getProducts: () => Promise<void>;
  getProductById: (productId: string | number) => Promise<void>;
  getProductsByCategory: (categoryId: string | number) => Promise<void>;
  createProduct: (data: Partial<Product>) => Promise<void>;
  updateProduct: (
    productId: string | number,
    data: Partial<Product>,
  ) => Promise<void>;
  enableProduct: (productId: string | number) => Promise<void>;
  disableProduct: (productId: string | number) => Promise<void>;
  deleteProduct: (productId: string | number) => Promise<void>;
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

const useProducts = (): UseProductsResult => {
  const [products, setProducts] = useState<Product[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Lister tous les produits
  const getProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${BACKEND_URL}/admin/products/?onlyActive=false`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        },
      );
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      const data: ProductsResponse = await res.json();
      setProducts(data.products);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la récupération des produits",
      );
    } finally {
      setLoading(false);
    }
  };

  // 2. Obtenir un produit par son ID
  const getProductById = async (productId: string | number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/admin/products/${productId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      const data: ProductResponse = await res.json();
      setProduct(data.product);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la récupération du produit",
      );
    } finally {
      setLoading(false);
    }
  };

  // 3. Lister les produits d’une catégorie
  const getProductsByCategory = async (categoryId: string | number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${BACKEND_URL}/admin/products/category/${categoryId}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        },
      );
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      const data: ProductsResponse = await res.json();
      setProducts(data.products);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la récupération des produits de la catégorie",
      );
    } finally {
      setLoading(false);
    }
  };

  // 4. Créer un produit
  const createProduct = async (data: Partial<Product>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/admin/products/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      await getProducts(); // Refresh list
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la création du produit",
      );
    } finally {
      setLoading(false);
    }
  };

  // 5. Modifier un produit
  const updateProduct = async (
    productId: string | number,
    data: Partial<Product>,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/admin/products/${productId}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      await getProducts(); // Refresh list
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la modification du produit",
      );
    } finally {
      setLoading(false);
    }
  };

  // 6. Désactiver un produit
  const disableProduct = async (productId: string | number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${BACKEND_URL}/admin/products/${productId}/disable`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
        },
      );
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      await getProducts(); // Refresh list
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la désactivation du produit",
      );
    } finally {
      setLoading(false);
    }
  };

  // 7. Activer un produit
  const enableProduct = async (productId: string | number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${BACKEND_URL}/admin/products/${productId}/enable`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
        },
      );
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      await getProducts(); // Refresh list
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de l'activation du produit",
      );
    } finally {
      setLoading(false);
    }
  };

  // 8. Supprimer un produit
  const deleteProduct = async (productId: string | number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/admin/products/${productId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      await getProducts(); // Refresh list
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la suppression du produit",
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    product,
    loading,
    error,
    getProducts,
    getProductById,
    getProductsByCategory,
    createProduct,
    updateProduct,
    enableProduct,
    disableProduct,
    deleteProduct,
  };
};

export default useProducts;
