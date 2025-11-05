"use client";

import React, { useState, useEffect } from "react";
import { Product } from "../../app/hooks/useProducts";
import useRestock, { RestockItem } from "../../app/hooks/useRestock";
import {
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

interface RestockFormProps {
  products: Product[];
  onClose: () => void;
  onSuccess: () => void;
}

interface RestockFormItem {
  product_id: string;
  quantity: number;
  purchase_price: number;
}

const RestockForm: React.FC<RestockFormProps> = ({
  products,
  onClose,
  onSuccess,
}) => {
  const { createRestock, loading, error } = useRestock();
  const [items, setItems] = useState<RestockFormItem[]>([
    { product_id: "", quantity: 0, purchase_price: 0 },
  ]);

  const addItem = () => {
    setItems([...items, { product_id: "", quantity: 0, purchase_price: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof RestockFormItem, value: string | number) => {
    const updatedItems = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setItems(updatedItems);
  };

  const getProductName = (productId: string) => {
    const product = products.find((p) => p.product_id === productId);
    return product ? product.name : "Produit non trouvé";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const validItems = items.filter(
      (item) => item.product_id && item.quantity > 0
    );

    if (validItems.length === 0) {
      alert("Veuillez ajouter au moins un produit avec une quantité valide.");
      return;
    }

    try {
      // Préparer les données pour l'API
      const restockItems: Omit<RestockItem, 'restock_item_id'>[] = validItems.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        purchase_price: item.purchase_price || undefined,
      }));

      await createRestock(restockItems);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Erreur lors du restockage:", err);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white backdrop-blur-none">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            Nouveau Restockage
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-12 gap-4 font-medium text-gray-700 text-sm">
              <div className="col-span-5">Produit</div>
              <div className="col-span-2">Quantité</div>
              <div className="col-span-3">Prix d'achat (FCFA)</div>
              <div className="col-span-2">Actions</div>
            </div>

            {items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-4 items-center p-4 border border-gray-200 rounded-lg"
              >
                {/* Sélection du produit */}
                <div className="col-span-5">
                  <select
                    value={item.product_id}
                    onChange={(e) =>
                      updateItem(index, "product_id", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    required
                  >
                    <option value="" className="text-black">
                      Sélectionner un produit
                    </option>
                    {products.map((product) => (
                      <option
                        key={product.product_id}
                        value={product.product_id}
                        className="text-black"
                      >
                        {product.name} (Stock: {product.quantity})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantité */}
                <div className="col-span-2">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity || ""}
                    onChange={(e) =>
                      updateItem(index, "quantity", parseInt(e.target.value) || 0)
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    placeholder="Qté"
                    required
                  />
                </div>

                {/* Prix d'achat */}
                <div className="col-span-3">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={item.purchase_price || ""}
                    onChange={(e) =>
                      updateItem(
                        index,
                        "purchase_price",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    placeholder="Prix (optionnel)"
                  />
                </div>

                {/* Actions */}
                <div className="col-span-2 flex space-x-2">
                  <button
                    type="button"
                    onClick={addItem}
                    className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Résumé */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Résumé du restockage</h4>
            <div className="text-sm text-gray-600">
              <p>
                Nombre de produits : {items.filter((item) => item.product_id).length}
              </p>
              <p>
                Quantité totale : {items.reduce((sum, item) => sum + (item.quantity || 0), 0)}
              </p>
              <p>
                Coût total : {items.reduce((sum, item) => sum + ((item.purchase_price || 0) * (item.quantity || 0)), 0)} FCFA
              </p>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <CheckIcon className="w-4 h-4" />
              )}
              <span>{loading ? "Traitement..." : "Confirmer le restockage"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RestockForm;
