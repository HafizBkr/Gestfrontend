"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "../../../components/admin/AdminLayout";
import useAdminDashboard from "../../hooks/useAdminDashboard";
import {
  ShoppingBagIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/outline";

// Anti-flash wrapper component
const AntiFlashWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        minHeight: "100vh",
        opacity: mounted ? 1 : 1,
        transition: "none",
      }}
    >
      {children}
    </div>
  );
};

type TrendType = "up" | "down" | "stable";

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
            className={`flex items-center mt-1 ${
              trend === "up" ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend === "up" ? (
              <ArrowUpIcon className="w-4 h-4 mr-1" />
            ) : (
              <ArrowDownIcon className="w-4 h-4 mr-1" />
            )}
            <span className="text-sm">{change.toFixed(1)}%</span>
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

  // Utiliser le hook pour les données réelles
  const {
    stats,
    recentActivities,
    lowStockProducts,
    topProducts,
    loading: dataLoading,
    error,
    refetch,
  } = useAdminDashboard(timeFilter);

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

  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case "today":
        return "aujourd'hui";
      case "week":
        return "cette semaine";
      case "month":
        return "ce mois";
      case "year":
        return "cette année";
      default:
        return "aujourd'hui";
    }
  };

  return (
    <AntiFlashWrapper>
      <AdminLayout>
        <div className="p-6 space-y-6">
          {/* Vérification d'accès en arrière-plan sans bloquer l'affichage */}
          {checkingAuth && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mr-2"></div>
                <span className="text-sm text-blue-700">
                  Vérification d&apos;accès en cours...
                </span>
              </div>
            </div>
          )}
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Tableau de Bord
              </h1>
              <p className="text-gray-600">
                Restaurant chez Mamoune - Vue d&apos;ensemble{" "}
                {getTimeFilterLabel()}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm text-black"
              >
                <option value="today">Aujourd&apos;hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
                <option value="year">Cette année</option>
              </select>
              {/* Filtre par catégorie */}
              <button
                onClick={refetch}
                className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
              >
                Actualiser
              </button>
            </div>
          </div>

          {/* Indicateur d'erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Erreur de chargement
                  </h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title={`Ventes ${getTimeFilterLabel()}`}
              value={`${stats.totalSales.value.toLocaleString()} FCFA`}
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
              title="Caissiers actifs"
              value={stats.totalUsers.value}
              change={stats.totalUsers.change}
              trend={stats.totalUsers.trend}
              icon={UsersIcon}
              color="bg-purple-500"
            />
          </div>
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
              {recentActivities.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Aucune activité récente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivities
                    .filter((activity) => activity.type === "sale")
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 3)
                    .map((activity) => (
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
                                  : activity.type === "restock"
                                    ? "bg-blue-500"
                                    : "bg-purple-500"
                            }`}
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {activity.description}
                            </p>
                            <p className="text-xs text-gray-500">
                              {activity.time}
                            </p>
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
                            {activity.amount.toFixed(0)} FCFA
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              )}
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
              {lowStockProducts.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-green-600 text-sm">
                    ✓ Tous les stocks sont suffisants
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lowStockProducts.map((product) => (
                    <div
                      key={product.product_id}
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
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded ${
                          product.stock === 0
                            ? "bg-red-100 text-red-800"
                            : product.stock < 5
                              ? "bg-orange-100 text-orange-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {product.stock} restant
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Produits les Plus Vendus {getTimeFilterLabel()}
            </h2>
          </div>
          <div className="p-6">
            {topProducts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Aucune vente pour cette période</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {topProducts.slice(0, 6).map((product, index) => (
                  <div
                    key={product.product_id}
                    className="text-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-center mb-2">
                      <span className="text-2xl font-bold text-gray-900">
                        #{index + 1}
                      </span>
                    </div>
                    <div className="text-xl font-bold text-green-600 mb-1">
                      {product.sales}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">ventes</div>
                    <div className="text-sm font-semibold text-gray-900 mb-2">
                      {product.name}
                    </div>
                    <div className="text-sm text-green-600">
                      {product.revenue.toFixed(0)} FCFA CA
                    </div>
                  </div>
                ))}
              </div>
            )}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => router.push("/admin/products")}
                className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
              >
                <ShoppingBagIcon className="w-8 h-8 text-gray-400 group-hover:text-blue-500 mb-2" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                  Gérer Produits
                </span>
              </button>

              <button
                onClick={() => router.push("/admin/users")}
                className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors group"
              >
                <UsersIcon className="w-8 h-8 text-gray-400 group-hover:text-purple-500 mb-2" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">
                  Gérer Utilisateurs
                </span>
              </button>
              <button
                onClick={() => router.push("/admin/sales")}
                className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors group"
              >
                <ChartBarIcon className="w-8 h-8 text-gray-400 group-hover:text-orange-500 mb-2" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-orange-700">
                  Voir Rapports
                </span>
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AntiFlashWrapper>
  );
};

export default AdminDashboard;
