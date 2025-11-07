"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

interface ReceiptItem {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface ReceiptData {
  receipt_number: string;
  date: string;
  cashier_name: string;
  items: ReceiptItem[];
  subtotal: number;
  tax_amount: number;
  total_amount: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: {
    product_id: string;
    name: string;
    sale_price: string;
    quantity: number;
  }) => void;
  updateQuantity: (product_id: string, change: number) => void;
  removeFromCart: (product_id: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  downloadReceipt: (receiptData: ReceiptData) => void;
  setRefreshProducts: (refreshFn: () => void) => void;
  refreshProducts: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [refreshProductsFn, setRefreshProductsFn] = useState<
    (() => void) | null
  >(null);

  const addToCart = (product: {
    product_id: string;
    name: string;
    sale_price: string;
    quantity: number;
  }) => {
    const price = parseFloat(product.sale_price);

    setCartItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.product_id === product.product_id,
      );

      if (existingItem) {
        // Si l'article existe, augmenter la quantité
        return prevItems.map((item) =>
          item.product_id === product.product_id
            ? {
                ...item,
                quantity: Math.min(item.quantity + 1, product.quantity), // Ne pas dépasser le stock
              }
            : item,
        );
      } else {
        // Nouvel article, l'ajouter au panier
        return [
          ...prevItems,
          {
            product_id: product.product_id,
            name: product.name,
            price: price,
            quantity: 1,
            stock: product.quantity,
          },
        ];
      }
    });
  };

  const updateQuantity = (product_id: string, change: number) => {
    setCartItems((prevItems) =>
      prevItems
        .map((item) => {
          if (item.product_id === product_id) {
            const newQuantity = Math.max(0, item.quantity + change);
            const maxQuantity = Math.min(newQuantity, item.stock);
            return { ...item, quantity: maxQuantity };
          }
          return item;
        })
        .filter((item) => item.quantity > 0),
    );
  };

  const removeFromCart = (product_id: string) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.product_id !== product_id),
    );
  };

  const clearCart = () => {
    setCartItems([]);
    // Rafraîchir les produits après avoir vidé le panier (après une vente)
    if (refreshProductsFn) {
      refreshProductsFn();
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const downloadReceipt = (receiptData: ReceiptData) => {
    const receiptContent = `
========================================
        RESTAURANT FASTFOOD
        Système de Gestion
========================================

N° Reçu: ${receiptData.receipt_number}
Date: ${new Date(receiptData.date).toLocaleString("fr-FR")}
Caissier: ${receiptData.cashier_name}

----------------------------------------
ARTICLES:
----------------------------------------
${receiptData.items
  .map(
    (item: ReceiptItem) =>
      `${item.name}\n${item.quantity} x ${item.unit_price.toFixed(0)} FCFA = ${item.total_price.toFixed(0)} FCFA\n`,
  )
  .join("")}
----------------------------------------
Sous-total: ${receiptData.subtotal.toFixed(0)} FCFA
TVA (18%): ${receiptData.tax_amount.toFixed(0)} FCFA
TOTAL: ${receiptData.total_amount.toFixed(0)} FCFA
----------------------------------------

        Merci pour votre visite!
        Conservez votre reçu
========================================
    `;

    const blob = new Blob([receiptContent], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `recu_${receiptData.receipt_number}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const setRefreshProducts = (refreshFn: () => void) => {
    setRefreshProductsFn(() => refreshFn);
  };

  const refreshProducts = () => {
    if (refreshProductsFn) {
      refreshProductsFn();
    }
  };

  const contextValue: CartContextType = {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalPrice,
    getTotalItems,
    downloadReceipt,
    setRefreshProducts,
    refreshProducts,
  };

  return (
    <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>
  );
};
