"use client";

import React, { useState, useEffect } from "react";
import { useSidebar } from "@/context/SidebarContext";
import { useCart } from "../../app/context/CartContext";
import useSales, { ReceiptData } from "../../app/hooks/useSales";
import { generateSaleReceipt } from "@/utils/receiptGenerator";
import { getCashierName } from "@/utils/authUtils";
import {
  XMarkIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

const RightSidebar = () => {
  const { cartItems, updateQuantity, getTotalPrice, getTotalItems, clearCart } =
    useCart();
  const { isRightSidebarOpen, toggleRightSidebar } = useSidebar();
  const { createSale, loading: saleLoading, error: saleError } = useSales();
  const [lastSale, setLastSale] = useState<{
    sale_id: string;
    username: string;
    date: string;
    total_amount: number;
    receipt_number: string;
    items: Array<{
      product_id: string;
      quantity: number;
      unit_price: number;
      total_price: number;
    }>;
  } | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const total = getTotalPrice();

  const handleSale = async () => {
    if (cartItems.length === 0) return;

    const saleItems = cartItems.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: Math.round(item.price),
      product_name: item.name, // Ajouter le nom du produit
    }));

    const result = await createSale(saleItems);

    if (result && result.sale_id) {
      // Adapter les données au format attendu par le générateur de reçus
      const saleData = {
        sale_id: result.sale_id,
        username: result.receipt_data?.cashier_name || getCashierName(),
        date: result.receipt_data?.date || new Date().toISOString(),
        total_amount: result.receipt_data?.total_amount || result.total_amount,
        receipt_number: result.sale_id, // Utiliser le vrai sale_id de l'API comme numéro de reçu
        items:
          result.receipt_data?.items.map((item) => ({
            product_id: item.name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
          })) || [],
      };
      setLastSale(saleData);
      setShowReceiptModal(true); // Afficher le popup après la vente
      clearCart(); // Vider le panier après la vente
    }
  };

  const handlePreviewReceipt = async () => {
    if (lastSale) {
      await generateSaleReceipt(lastSale, "preview");
    }
  };

  const handlePrintLastReceipt = async () => {
    if (lastSale) {
      await generateSaleReceipt(lastSale, "print");
    }
  };

  const handleDownloadLastReceipt = async () => {
    if (lastSale) {
      await generateSaleReceipt(lastSale, "download");
    }
  };

  return (
    <div
      className={`${isRightSidebarOpen ? "w-80" : "w-20"} h-screen bg-white border-l flex flex-col transition-all duration-300`}
    >
      {/* En-tête */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-2">
          <h2
            className={`font-semibold text-lg text-black ${!isRightSidebarOpen && "hidden"}`}
          >
            Table 5
          </h2>
          {isRightSidebarOpen ? (
            <button className="text-black text-sm hover:text-gray-700">
              Download Receipt
            </button>
          ) : (
            <button
              onClick={toggleRightSidebar}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              ←
            </button>
          )}
        </div>
        <div
          className={`flex space-x-2 text-sm text-black ${!isRightSidebarOpen && "hidden"}`}
        >
          <span>Order #123</span>
          <span>•</span>
          <span>Dine In</span>
        </div>
        {isRightSidebarOpen || (
          <button
            onClick={toggleRightSidebar}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            →
          </button>
        )}
      </div>

      {/* Liste des articles */}
      <div
        className={`flex-1 overflow-y-auto p-4 ${!isRightSidebarOpen && "hidden"}`}
      >
        <div className="space-y-4">
          {cartItems.length === 0 ? (
            <div className="text-black text-center py-8">
              Aucun article dans le panier
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.product_id}
                className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
              >
                <div>
                  <h3 className="font-medium text-black">{item.name}</h3>
                  <span className="text-black">
                    {item.price.toFixed(0)} FCFA
                  </span>
                  <div className="text-xs text-black">Stock: {item.stock}</div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => updateQuantity(item.product_id, -1)}
                    className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-black hover:bg-gray-300"
                  >
                    -
                  </button>
                  <span className="w-5 text-center text-black">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product_id, 1)}
                    className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700"
                    disabled={item.quantity >= item.stock}
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Total et validation */}
      <div
        className={`p-4 border-t bg-gray-50 ${!isRightSidebarOpen && "hidden"}`}
      >
        <div className="space-y-3 mb-4">
          <div className="flex justify-between text-black">
            <span>Sous-total</span>
            <span>{total.toFixed(0)} FCFA</span>
          </div>

          <div className="flex justify-between text-black text-lg font-semibold">
            <span>Total</span>
            <span>{total.toFixed(0)} FCFA</span>
          </div>
        </div>

        {saleError && (
          <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">
            {saleError}
          </div>
        )}

        <button
          onClick={handleSale}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          disabled={cartItems.length === 0 || saleLoading}
        >
          {saleLoading
            ? "Traitement..."
            : `Valider la commande (${getTotalItems()} articles)`}
        </button>
      </div>

      {/* Modal de confirmation après vente */}
      {showReceiptModal && lastSale && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg p-6 w-96 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Vente effectuée avec succès
              </h3>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <p className="mb-4 text-gray-600">
              Total: {lastSale.total_amount.toFixed(0)} FCFA
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  handlePreviewReceipt();
                  setShowReceiptModal(false);
                }}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                <EyeIcon className="h-5 w-5" />
                Aperçu du reçu
              </button>

              <button
                onClick={() => {
                  handlePrintLastReceipt();
                  setShowReceiptModal(false);
                }}
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
              >
                <PrinterIcon className="h-5 w-5" />
                Imprimer le reçu
              </button>

              <button
                onClick={() => {
                  handleDownloadLastReceipt();
                  setShowReceiptModal(false);
                }}
                className="w-full flex items-center justify-center gap-2 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                Télécharger en PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RightSidebar;
