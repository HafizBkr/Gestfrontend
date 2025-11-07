"use client";

import React, { useState } from "react";
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
  const { addToCart } = useCart();

  // Récupérer le token du caissier
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("cashier_token")
      : null;
  const { products, loading, error } = useCashierProducts(token);

  const handleAddToCart = (product: Product) => {
    if (product.quantity > 0 && product.is_active) {
      addToCart({
        product_id: product.product_id,
        name: product.name,
        sale_price: product.sale_price,
        quantity: product.quantity,
      });
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
              <h3 className="font-semibold text-gray-800">{product.name}</h3>
              <p className="text-gray-500 text-sm">Stock: {product.quantity}</p>
              <div className="flex justify-between items-center mt-4">
                <span className="text-lg font-bold text-gray-900">
                  {parseFloat(product.sale_price).toFixed(0)} FCFA
                </span>
                <button
                  onClick={() => handleAddToCart(product)}
                  className={`p-2 rounded-full transition-colors ${
                    product.quantity === 0 || !product.is_active
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                  aria-label="Add to cart"
                  disabled={product.quantity === 0 || !product.is_active}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
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
