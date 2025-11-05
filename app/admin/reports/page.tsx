"use client";

import React, { useState } from "react";
import AdminLayout from "../../../components/admin/AdminLayout";
import {
  DocumentArrowDownIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  TruckIcon,
  ChartBarIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";

interface DailyReport {
  date: string;
  totalSales: number;
  totalTransactions: number;
  totalPurchases: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
  lowStockProducts: { name: string; stock: number }[];
  cashierStats: { name: string; sales: number; transactions: number }[];
}

interface SalesData {
  date: string;
  amount: number;
  transactions: number;
}

/* --- StatCard doit être défini ici, en dehors de ReportsPage --- */

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  bgColor: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  bgColor,
}) => (
  <div className={`${bgColor} rounded-lg p-6 shadow-sm border`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-full bg-white`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
    </div>
  </div>
);

const ReportsPage = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly">(
    "daily",
  );
  const [exportFormat, setExportFormat] = useState<"pdf" | "excel">("pdf");

  // Données simulées pour les rapports
  const dailyReport: DailyReport = {
    date: selectedDate,
    totalSales: 1245.5,
    totalTransactions: 87,
    totalPurchases: 650.0,
    topProducts: [
      { name: "Coca-Cola 33cl", quantity: 25, revenue: 125.0 },
      { name: "Sandwich Jambon", quantity: 15, revenue: 90.0 },
      { name: "Café", quantity: 32, revenue: 96.0 },
      { name: "Eau minérale", quantity: 18, revenue: 54.0 },
    ],
    lowStockProducts: [
      { name: "Pain de mie", stock: 2 },
      { name: "Lait", stock: 5 },
      { name: "Biscuits", stock: 8 },
    ],
    cashierStats: [
      { name: "Marie Dupont", sales: 785.5, transactions: 52 },
      { name: "Jean Martin", sales: 460.0, transactions: 35 },
    ],
  };

  const salesData: SalesData[] = [
    { date: "2024-01-15", amount: 1100.5, transactions: 78 },
    { date: "2024-01-16", amount: 1350.75, transactions: 89 },
    { date: "2024-01-17", amount: 980.25, transactions: 65 },
    { date: "2024-01-18", amount: 1245.5, transactions: 87 },
    { date: "2024-01-19", amount: 1450.0, transactions: 95 },
    { date: "2024-01-20", amount: 1200.75, transactions: 82 },
  ];

  const monthlyStats = {
    totalSales: 28450.75,
    totalTransactions: 1247,
    averageDailySales: 948.36,
    bestDay: { date: "2024-01-19", amount: 1450.0 },
    worstDay: { date: "2024-01-17", amount: 980.25 },
  };

  const handleExport = async () => {
    if (exportFormat === "pdf") {
      // Simulation d'export PDF
      const reportContent = generateReportContent();
      console.log("Génération du PDF avec:", reportContent);
      alert("Export PDF généré avec succès ! (Simulation)");
    } else {
      // Simulation d'export Excel
      console.log("Génération du fichier Excel");
      alert("Export Excel généré avec succès ! (Simulation)");
    }
  };

  const generateReportContent = () => {
    return {
      type: reportType,
      date: selectedDate,
      data: dailyReport,
      salesData: salesData,
    };
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  // StatCard est maintenant défini en dehors de ReportsPage

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Rapports & Analyses
              </h1>
              <p className="text-gray-600">
                Suivez les performances de votre magasin
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handlePrint}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
              >
                <PrinterIcon className="w-5 h-5" />
                <span>Imprimer</span>
              </button>
              <select
                value={exportFormat}
                onChange={(e) =>
                  setExportFormat(e.target.value as "pdf" | "excel")
                }
                className="border border-gray-300 rounded-md px-3 py-2 text-black"
              >
                <option value="pdf">Export PDF</option>
                <option value="excel">Export Excel</option>
              </select>
              <button
                onClick={handleExport}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <DocumentArrowDownIcon className="w-5 h-5" />
                <span>Exporter</span>
              </button>
            </div>
          </div>

          {/* Filtres */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de rapport
                </label>
                <select
                  value={reportType}
                  onChange={(e) =>
                    setReportType(
                      e.target.value as "daily" | "weekly" | "monthly",
                    )
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                >
                  <option value="daily">Rapport journalier</option>
                  <option value="weekly">Rapport hebdomadaire</option>
                  <option value="monthly">Rapport mensuel</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date sélectionnée
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() =>
                    setSelectedDate(new Date().toISOString().split("T")[0])
                  }
                  className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
                >
                  Aujourd&apos;hui
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Ventes totales"
            value={formatCurrency(dailyReport.totalSales)}
            subtitle={`${dailyReport.totalTransactions} transactions`}
            icon={CurrencyDollarIcon}
            color="text-green-600"
            bgColor="bg-green-50"
          />
          <StatCard
            title="Produits vendus"
            value={dailyReport.topProducts.reduce(
              (sum, p) => sum + p.quantity,
              0,
            )}
            subtitle="articles vendus"
            icon={ShoppingBagIcon}
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <StatCard
            title="Achats fournisseurs"
            value={formatCurrency(dailyReport.totalPurchases)}
            subtitle="coût d'approvisionnement"
            icon={TruckIcon}
            color="text-orange-600"
            bgColor="bg-orange-50"
          />
          <StatCard
            title="Marge brute"
            value={formatCurrency(
              dailyReport.totalSales - dailyReport.totalPurchases,
            )}
            subtitle={`${(((dailyReport.totalSales - dailyReport.totalPurchases) / dailyReport.totalSales) * 100).toFixed(1)}% de marge`}
            icon={ChartBarIcon}
            color="text-purple-600"
            bgColor="bg-purple-50"
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Produits les plus vendus */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Produits les Plus Vendus
              </h2>
              <p className="text-sm text-gray-600">
                Top 4 des meilleures ventes du jour
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {dailyReport.topProducts.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-bold text-blue-600">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.quantity} vendus
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(product.revenue)}
                      </div>
                      <div className="text-sm text-gray-500">CA</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Alertes stock */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Alertes Stock Faible
              </h2>
              <p className="text-sm text-gray-600">
                Produits nécessitant un réapprovisionnement
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {dailyReport.lowStockProducts.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                  >
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                      <span className="font-medium text-gray-900">
                        {product.name}
                      </span>
                    </div>
                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded">
                      {product.stock} restant
                    </span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 text-sm">
                Générer commande d&apos;approvisionnement
              </button>
            </div>
          </div>
        </div>

        {/* Performance des caissiers */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Performance des Caissiers
            </h2>
            <p className="text-sm text-gray-600">
              Statistiques de vente par utilisateur
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dailyReport.cashierStats.map((cashier, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-bold text-blue-600">
                          {cashier.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {cashier.name}
                        </div>
                        <div className="text-sm text-gray-500">Caissier</div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(cashier.sales)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Chiffre d&apos;affaires
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {cashier.transactions}
                      </div>
                      <div className="text-sm text-gray-500">Transactions</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-sm text-gray-600">
                      Panier moyen:{" "}
                      {formatCurrency(cashier.sales / cashier.transactions)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Évolution des ventes */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Évolution des Ventes (7 derniers jours)
            </h2>
            <p className="text-sm text-gray-600">
              Tendance du chiffre d&apos;affaires quotidien
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {salesData.map((day, index) => {
                const maxAmount = Math.max(...salesData.map((d) => d.amount));
                const percentage = (day.amount / maxAmount) * 100;

                return (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-20 text-sm text-gray-600">
                      {new Date(day.date).toLocaleDateString("fr-FR", {
                        weekday: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-6 relative">
                        <div
                          className="bg-blue-600 h-6 rounded-full flex items-center justify-end pr-3"
                          style={{ width: `${percentage}%` }}
                        >
                          <span className="text-white text-xs font-medium">
                            {formatCurrency(day.amount)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="w-16 text-sm text-gray-600 text-right">
                      {day.transactions} tx
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Résumé mensuel */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Résumé Mensuel
            </h2>
            <p className="text-sm text-gray-600">
              Vue d&apos;ensemble des performances du mois
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(monthlyStats.totalSales)}
                </div>
                <div className="text-sm text-gray-500">CA Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {monthlyStats.totalTransactions}
                </div>
                <div className="text-sm text-gray-500">Transactions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(monthlyStats.averageDailySales)}
                </div>
                <div className="text-sm text-gray-500">Moyenne/jour</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(monthlyStats.bestDay.amount)}
                </div>
                <div className="text-sm text-gray-500">Meilleur jour</div>
                <div className="text-xs text-gray-400">
                  {new Date(monthlyStats.bestDay.date).toLocaleDateString()}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(monthlyStats.worstDay.amount)}
                </div>
                <div className="text-sm text-gray-500">Plus faible</div>
                <div className="text-xs text-gray-400">
                  {new Date(monthlyStats.worstDay.date).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ReportsPage;
