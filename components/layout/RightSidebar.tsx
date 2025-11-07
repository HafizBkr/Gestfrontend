"use client";

import React, { useState } from "react";
import { useSidebar } from "@/context/SidebarContext";
import { useCart } from "../../app/context/CartContext";
import useSales, { ReceiptData } from "../../app/hooks/useSales";
import Receipt from "../../app/components/receipt/Receipt";

const RightSidebar = () => {
  const { cartItems, updateQuantity, getTotalPrice, getTotalItems, clearCart } =
    useCart();
  const { isRightSidebarOpen, toggleRightSidebar } = useSidebar();
  const { createSale, loading: saleLoading, error: saleError } = useSales();
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

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

    if (result && result.receipt_data) {
      setReceiptData(result.receipt_data);
      setShowReceipt(true);
      clearCart(); // Vider le panier après la vente
    }
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setReceiptData(null);
  };

  const handlePrintReceipt = () => {
    // Action après impression (si nécessaire)
    console.log("Reçu imprimé");
  };

  const handleDownloadReceipt = () => {
    // Action après téléchargement (si nécessaire)
    console.log("Reçu téléchargé");
  };

  return (
    <div
      className={`${isRightSidebarOpen ? "w-80" : "w-20"} h-screen bg-white border-l flex flex-col transition-all duration-300`}
    >
      {/* En-tête */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-2">
          <h2
            className={`font-semibold text-lg ${!isRightSidebarOpen && "hidden"}`}
          >
            Table 5
          </h2>
          {isRightSidebarOpen ? (
            <button className="text-blue-600 text-sm hover:text-blue-700">
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
          className={`flex space-x-2 text-sm text-gray-600 ${!isRightSidebarOpen && "hidden"}`}
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
            <div className="text-gray-500 text-center py-8">
              Aucun article dans le panier
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.product_id}
                className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
              >
                <div>
                  <h3 className="font-medium text-gray-800">{item.name}</h3>
                  <span className="text-gray-600">
                    {item.price.toFixed(0)} FCFA
                  </span>
                  <div className="text-xs text-gray-500">
                    Stock: {item.stock}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => updateQuantity(item.product_id, -1)}
                    className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300"
                  >
                    -
                  </button>
                  <span className="w-5 text-center">{item.quantity}</span>
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

      {showReceipt && receiptData && (
        <Receipt
          receiptData={receiptData}
          onClose={handleCloseReceipt}
          onPrint={handlePrintReceipt}
          onDownload={handleDownloadReceipt}
        />
      )}
    </div>
  );
};

export default RightSidebar;
