"use client";

import React, { useState, useEffect } from "react";
import useCashierProducts from "../../app/hooks/useCashierProducts";
import { useCart } from "../../app/context/CartContext";

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

const categories = [
  { id: "all", label: "All Menu", icon: "🍽️" },
  { id: "main", label: "Main Course", icon: "🍖" },
  { id: "dessert", label: "Dessert", icon: "🍰" },
  { id: "drinks", label: "Drinks", icon: "🥤" },
  { id: "asian", label: "Asian", icon: "🍜" },
  { id: "western", label: "Western", icon: "🍔" },
];

// Les produits seront récupérés via l'API

const ProductGrid = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [productQuantities, setProductQuantities] = useState<{
    [key: string]: number;
  }>({});
  const { addToCart, setRefreshProducts, cartItems } = useCart();

  // Récupérer le token du caissier
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("cashier_token")
      : null;
  const { products, loading, error, refetch } = useCashierProducts(token);

  // Enregistrer la fonction refetch dans le CartContext au montage
  useEffect(() => {
    setRefreshProducts(refetch);
  }, [refetch, setRefreshProducts]);

  const handleQuantityChange = (productId: string, quantity: number) => {
    setProductQuantities((prev) => ({
      ...prev,
      [productId]: quantity,
    }));
  };

  const getSelectedQuantity = (productId: string) => {
    return productQuantities[productId] || 1;
  };

  const getCartQuantity = (productId: string) => {
    const cartItem = cartItems.find((item) => item.product_id === productId);
    return cartItem ? cartItem.quantity : 0;
  };

  const getAvailableStock = (productId: string, totalStock: number) => {
    return totalStock - getCartQuantity(productId);
  };

  const handleAddToCart = (product: Product) => {
    const selectedQuantity = getSelectedQuantity(product.product_id);
    const availableStock = getAvailableStock(
      product.product_id,
      product.quantity,
    );
    if (
      product.quantity > 0 &&
      product.is_active &&
      selectedQuantity <= availableStock
    ) {
      // Ajouter la quantité sélectionnée en une seule fois
      addToCart(
        {
          product_id: product.product_id,
          name: product.name,
          sale_price: product.sale_price,
          quantity: product.quantity,
        },
        selectedQuantity,
      );
      // Réinitialiser la quantité sélectionnée après ajout
      setProductQuantities((prev) => ({
        ...prev,
        [product.product_id]: 1,
      }));
    }
  };

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((product) => product.category_id === selectedCategory);

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-gray-50 p-6">
      {/* Header avec barre de recherche */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Menu</h2>
        {loading && <div className="text-blue-600">Chargement...</div>}
        {error && <div className="text-red-600">{error}</div>}
        <div className="relative">
          <input
            type="text"
            placeholder="Search anything..."
            className="w-64 pl-10 pr-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          />
          <svg
            className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Catégories */}
      <div className="flex space-x-4 mb-8 overflow-x-auto pb-4">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center px-4 py-2 rounded-full transition-colors whitespace-nowrap
              ${
                selectedCategory === category.id
                  ? "bg-blue-600 text-white"
                  : "bg-white hover:bg-gray-100 text-gray-700"
              }`}
          >
            <span className="mr-2">{category.icon}</span>
            <span>{category.label}</span>
          </button>
        ))}
      </div>

      {/* Grille de produits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <div
            key={product.product_id}
            className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="h-48 bg-gray-200">
              {/* Bannière d'image comme demandé */}
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                {product.name}
              </div>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-800">{product.name}</h3>
                {getCartQuantity(product.product_id) > 0 && (
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
                    {getCartQuantity(product.product_id)} dans le panier
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm">
                Stock: {product.quantity}
                {getCartQuantity(product.product_id) > 0 && (
                  <span className="text-orange-600">
                    {" "}
                    (Disponible:{" "}
                    {getAvailableStock(product.product_id, product.quantity)})
                  </span>
                )}
              </p>
              <div className="flex justify-between items-center mt-4">
                <span className="text-lg font-bold text-gray-900">
                  {parseFloat(product.sale_price).toFixed(0)} FCFA
                </span>
              </div>

              {/* Sélecteur de quantité et bouton d'ajout */}
              <div className="flex items-center justify-between mt-3 gap-2">
                <div
                  className={`flex items-center border rounded-lg ${
                    getAvailableStock(product.product_id, product.quantity) <= 0
                      ? "opacity-50"
                      : ""
                  }`}
                >
                  <button
                    onClick={() =>
                      handleQuantityChange(
                        product.product_id,
                        Math.max(
                          1,
                          getSelectedQuantity(product.product_id) - 1,
                        ),
                      )
                    }
                    className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-l-lg disabled:opacity-50"
                    disabled={
                      getSelectedQuantity(product.product_id) <= 1 ||
                      getAvailableStock(product.product_id, product.quantity) <=
                        0
                    }
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={Math.max(
                      1,
                      getAvailableStock(product.product_id, product.quantity),
                    )}
                    value={getSelectedQuantity(product.product_id)}
                    onChange={(e) =>
                      handleQuantityChange(
                        product.product_id,
                        Math.min(
                          Math.max(
                            1,
                            getAvailableStock(
                              product.product_id,
                              product.quantity,
                            ),
                          ),
                          Math.max(1, parseInt(e.target.value) || 1),
                        ),
                      )
                    }
                    className="w-12 text-center py-1 border-0 text-sm text-black"
                    disabled={
                      getAvailableStock(product.product_id, product.quantity) <=
                      0
                    }
                  />
                  <button
                    onClick={() =>
                      handleQuantityChange(
                        product.product_id,
                        Math.min(
                          getAvailableStock(
                            product.product_id,
                            product.quantity,
                          ),
                          getSelectedQuantity(product.product_id) + 1,
                        ),
                      )
                    }
                    className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-r-lg disabled:opacity-50"
                    disabled={
                      getSelectedQuantity(product.product_id) >=
                        getAvailableStock(
                          product.product_id,
                          product.quantity,
                        ) ||
                      getAvailableStock(product.product_id, product.quantity) <=
                        0
                    }
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => handleAddToCart(product)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    product.quantity === 0 ||
                    !product.is_active ||
                    getSelectedQuantity(product.product_id) >
                      getAvailableStock(product.product_id, product.quantity) ||
                    getAvailableStock(product.product_id, product.quantity) <= 0
                      ? "bg-gray-400 cursor-not-allowed text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                  disabled={
                    product.quantity === 0 ||
                    !product.is_active ||
                    getSelectedQuantity(product.product_id) >
                      getAvailableStock(product.product_id, product.quantity) ||
                    getAvailableStock(product.product_id, product.quantity) <= 0
                  }
                >
                  {getAvailableStock(product.product_id, product.quantity) <= 0
                    ? "Épuisé"
                    : product.quantity === 0 || !product.is_active
                      ? "Indisponible"
                      : "Ajouter"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductGrid;
