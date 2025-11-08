"use client";

import React from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { authService } from "../../utils/authService";

const menuItems = [
  { icon: "dashboard-img", label: "Dashboard", path: "/dashboard" },
  { icon: "history-svg", label: "Historique", path: "/dashboard/history" },
  { icon: "report-svg", label: "Sales Reports", path: "/dashboard/sales" },
];

const LeftSidebar = () => {
  const router = useRouter();
  const pathname = usePathname();

  // Fonction de déconnexion
  const handleLogout = () => {
    authService.logout("cashier");
  };

  const { isLeftSidebarOpen, toggleLeftSidebar } = useSidebar();

  return (
    <div className="relative">
      <div
        className={`${isLeftSidebarOpen ? "w-64" : "w-20"} h-screen bg-white border-r flex flex-col transition-all duration-300 overflow-hidden`}
      >
        {/* Logo */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">G</span>
            </div>
            <h1
              className={`text-xl font-bold text-gray-800 whitespace-nowrap transition-opacity duration-300 ${isLeftSidebarOpen ? "opacity-100" : "opacity-0"}`}
            >
              Gest Store
            </h1>
          </div>
          {isLeftSidebarOpen && (
            <button
              onClick={toggleLeftSidebar}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 shadow-sm"
            >
              ←
            </button>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`w-full flex items-center p-3 rounded-lg transition-colors
              ${
                pathname === item.path
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {item.icon === "dashboard-img" ? (
                <Image
                  src="/maison.png"
                  alt="Dashboard"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              ) : item.icon === "report-svg" ? (
                <span className="text-xl flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-clipboard-minus-icon lucide-clipboard-minus"
                  >
                    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <path d="M9 14h6" />
                  </svg>
                </span>
              ) : item.icon === "history-svg" ? (
                <span className="text-xl flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-history"
                  >
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                    <path d="M12 7v5l4 2" />
                  </svg>
                </span>
              ) : (
                <span className="text-xl">{item.icon}</span>
              )}
              <span
                className={`ml-3 font-medium whitespace-nowrap transition-opacity duration-300 ${isLeftSidebarOpen ? "opacity-100" : "opacity-0"}`}
              >
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center p-3 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <span>🚪</span>
            <span
              className={`ml-3 font-medium whitespace-nowrap transition-opacity duration-300 ${isLeftSidebarOpen ? "opacity-100" : "opacity-0"}`}
            >
              Déconnexion
            </span>
          </button>
        </div>
      </div>
      {!isLeftSidebarOpen && (
        <button
          onClick={toggleLeftSidebar}
          className="absolute top-4 -right-4 p-2 rounded-lg border bg-blue-600 text-white hover:bg-blue-700 border-blue-600 shadow-sm"
        >
          →
        </button>
      )}
    </div>
  );
};

export default LeftSidebar;
