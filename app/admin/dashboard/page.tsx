"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "../../../components/admin/AdminLayout";
import {
  ShoppingBagIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  TruckIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/outline";

type TrendType = "up" | "down" | "stable";

interface Stat {
  value: number;
  change: number;
  trend: TrendType;
}

interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  trend: TrendType;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color,
}) => (
  <div className="bg-white rounded-lg shadow-sm border p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {change !== 0 && (
          <div
            className={`flex items-center mt-1 ${trend === "up" ? "text-green-600" : "text-red-600"}`}
          >
            {trend === "up" ? (
              <ArrowUpIcon className="w-4 h-4 mr-1" />
            ) : (
              <ArrowDownIcon className="w-4 h-4 mr-1" />
            )}
            <span className="text-sm">{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [timeFilter, setTimeFilter] = useState("today");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  // Contrôle d'accès - vérifier la présence du token admin
  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("admin_token")
          : null;
      if (!token) {
        router.replace("/admin-login-xyz");
      } else {
        if (isMounted) setCheckingAuth(false);
      }
    };
    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [router]);

  // Données simulées - à remplacer par des appels API
  const stats: {
    totalSales: Stat;
    totalProducts: Stat;
    totalUsers: Stat;
    totalPurchases: Stat;
  } = {
    totalSales: { value: 15420, change: 12.5, trend: "up" },
    totalProducts: { value: 234, change: -2.1, trend: "down" },
    totalUsers: { value: 8, change: 0, trend: "stable" },
    totalPurchases: { value: 8750, change: 8.3, trend: "up" },
  };

  const recentActivities = [
    {
      id: 1,
      type: "sale",
      description: "Vente de Coca-Cola x5",
      amount: 25.0,
      time: "Il y a 5 min",
    },
    {
      id: 2,
      type: "purchase",
      description: "Achat auprès de Fournisseur ABC",
      amount: -150.0,
      time: "Il y a 1h",
    },
    {
      id: 3,
      type: "user",
      description: "Nouvel utilisateur: Marie Dupont",
      amount: null,
      time: "Il y a 2h",
    },
    {
      id: 4,
      type: "sale",
      description: "Vente de Sandwich x3",
      amount: 18.0,
      time: "Il y a 3h",
    },
  ];

  const lowStockProducts = [
    { name: "Coca-Cola", stock: 5, category: "Boissons" },
    { name: "Pain de mie", stock: 2, category: "Nourriture" },
    { name: "Eau minérale", stock: 8, category: "Boissons" },
  ];

  const topProducts = [
    { name: "Coca-Cola", sales: 45, revenue: 225 },
    { name: "Sandwich Jambon", sales: 32, revenue: 192 },
    { name: "Café", sales: 28, revenue: 84 },
  ];

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-lg text-gray-700">
            Vérification de l&apos;accès...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Tableau de Bord
            </h1>
            <p className="text-gray-600">
              Vue d&apos;ensemble de votre magasin
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="today">Aujourd&apos;hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="year">Cette année</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Ventes du jour"
            value={`${stats.totalSales.value.toLocaleString()} €`}
            change={stats.totalSales.change}
            trend={stats.totalSales.trend}
            icon={CurrencyDollarIcon}
            color="bg-green-500"
          />
          <StatCard
            title="Produits en stock"
            value={stats.totalProducts.value}
            change={stats.totalProducts.change}
            trend={stats.totalProducts.trend}
            icon={ShoppingBagIcon}
            color="bg-blue-500"
          />
          <StatCard
            title="Utilisateurs actifs"
            value={stats.totalUsers.value}
            change={stats.totalUsers.change}
            trend={stats.totalUsers.trend}
            icon={UsersIcon}
            color="bg-purple-500"
          />
          <StatCard
            title="Achats du mois"
            value={`${stats.totalPurchases.value.toLocaleString()} €`}
            change={stats.totalPurchases.change}
            trend={stats.totalPurchases.trend}
            icon={TruckIcon}
            color="bg-orange-500"
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activities */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Activités Récentes
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between py-3 border-b last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          activity.type === "sale"
                            ? "bg-green-500"
                            : activity.type === "purchase"
                              ? "bg-orange-500"
                              : "bg-blue-500"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                    {activity.amount && (
                      <span
                        className={`text-sm font-medium ${
                          activity.amount > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {activity.amount > 0 ? "+" : ""}
                        {activity.amount.toFixed(2)} €
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Stock Faible
                </h2>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {lowStockProducts.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {product.category}
                      </p>
                    </div>
                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded">
                      {product.stock} restant
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Produits les Plus Vendus
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topProducts.map((product, index) => (
                <div key={index} className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {product.sales}
                  </div>
                  <div className="text-sm text-gray-600 mb-1">ventes</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {product.name}
                  </div>
                  <div className="text-sm text-green-600">
                    {product.revenue} € CA
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Actions Rapides
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <ShoppingBagIcon className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">
                  Ajouter Produit
                </span>
              </button>
              <button className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
                <TruckIcon className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">
                  Nouvel Achat
                </span>
              </button>
              <button className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
                <UsersIcon className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">
                  Gérer Utilisateurs
                </span>
              </button>
              <button className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors">
                <ChartBarIcon className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">
                  Voir Rapports
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
