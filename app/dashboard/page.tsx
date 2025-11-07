"use client";

import React from "react";
import useCashierAuth from "../hooks/useCashierAuth";
import LeftSidebar from "@/components/layout/LeftSidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import ProductGrid from "@/components/menu/ProductGrid";
import { SidebarProvider } from "@/context/SidebarContext";
import { CartProvider } from "../context/CartContext";

const DashboardPage = () => {
  const { isAuthenticated, loading } = useCashierAuth();

  if (loading) return <div>Chargement...</div>;
  if (!isAuthenticated) return null; // La redirection est déjà gérée par le hook

  return (
    <CartProvider>
      <SidebarProvider>
        <div className="flex h-screen bg-gray-100">
          {/* Sidebar Gauche - Navigation */}
          <LeftSidebar />

          {/* Zone Centrale - Grille de Produits */}
          <ProductGrid />

          {/* Sidebar Droite - Panier */}
          <RightSidebar />
        </div>
      </SidebarProvider>
    </CartProvider>
  );
};

export default DashboardPage;
