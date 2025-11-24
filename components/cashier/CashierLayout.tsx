"use client";

import React from "react";
import LeftSidebar from "../layout/LeftSidebar";
import { SidebarProvider } from "@/context/SidebarContext";
import AuthWrapper from "../auth/AuthWrapper";

interface CashierLayoutProps {
  children: React.ReactNode;
}

const CashierLayout: React.FC<CashierLayoutProps> = ({ children }) => {
  return (
    <AuthWrapper userType="cashier">
      <SidebarProvider>
        <div className="flex h-screen bg-gray-100">
          {/* Sidebar gauche */}
          <LeftSidebar />

          {/* Contenu principal */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </AuthWrapper>
  );
};

export default CashierLayout;
