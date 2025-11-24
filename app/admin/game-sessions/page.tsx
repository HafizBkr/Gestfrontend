"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "../../../components/admin/AdminLayout";
import useAdminGameSessions from "../../hooks/useAdminGameSessions";
import { generateGameSessionReceipt } from "../../../utils/gameSessionReceiptGenerator";
import {
  generateGameSessionReport,
  GameSessionReportItem,
} from "../../../utils/gameSessionReportGenerator";
import {
  PlayIcon,
  ClockIcon,
  PrinterIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CalendarIcon,
  DocumentTextIcon,
  EyeIcon,
  DocumentChartBarIcon,
} from "@heroicons/react/24/outline";

// Redéfinir le type localement pour garantir la présence de cashier_username
type GameSession = {
  session_id: string;
  game_id: string;
  pricing_id: string;
  cashier_id: string;
  player_count: number;
  start_time: string;
  end_time?: string;
  total_price: number;
  mode: string;
  status: string;
  notes?: string;
  created_at: string;
  game_name?: string;
  pricing_description?: string;
  cashier_username?: string;
};

const formatCurrency = (amount: number) => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return "0 FCFA";
  }
  return `${amount.toLocaleString("fr-FR")} FCFA`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getModeIcon = (mode: string) => {
  switch (mode?.toLowerCase()) {
    case "heure":
      return <ClockIcon className="w-5 h-5 inline-block mr-1" />;
    case "partie":
    case "match":
    case "combat":
      return <PlayIcon className="w-5 h-5 inline-block mr-1" />;
    default:
      return <PlayIcon className="w-5 h-5 inline-block mr-1" />;
  }
};

const statusColors: Record<string, string> = {
  completed: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-800",
};

const AdminGameSessionsPage = () => {
  const { sessions, loading, error, getSessions } = useAdminGameSessions();

  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [cashierFilter, setCashierFilter] = useState("all");
  const [gameFilter, setGameFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [filteredSessions, setFilteredSessions] = useState<GameSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<GameSession | null>(
    null,
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);

  // Statistiques calculées
  const [sessionStats, setSessionStats] = useState({
    totalSessions: 0,
    totalRevenue: 0,
    totalPlayers: 0,
    averageSessionAmount: 0,
    sessionsByGame: {} as Record<string, number>,
    sessionsByCashier: {} as Record<string, number>,
  });

  // Listes uniques pour les filtres
  const uniqueCashiers = Array.from(
    new Set(sessions.map((s) => s.cashier_username).filter(Boolean)),
  );
  const uniqueGames = Array.from(
    new Set(sessions.map((s) => s.game_name).filter(Boolean)),
  );
  const uniqueStatuses = Array.from(new Set(sessions.map((s) => s.status)));

  useEffect(() => {
    getSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      console.log("Sessions récupérées (admin):", sessions);
    }
  }, [sessions]);

  // Filtrage des sessions
  useEffect(() => {
    let filtered = sessions;

    // Filtre par recherche
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.game_name?.toLowerCase().includes(lower) ||
          s.pricing_description?.toLowerCase().includes(lower) ||
          s.mode?.toLowerCase().includes(lower) ||
          s.cashier_username?.toLowerCase().includes(lower) ||
          s.session_id.toLowerCase().includes(lower),
      );
    }

    // Filtre par date
    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter((session) => {
        const sessionDate = new Date(session.created_at);
        switch (dateFilter) {
          case "today":
            return sessionDate >= today;
          case "week":
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return sessionDate >= weekAgo;
          case "month":
            const monthAgo = new Date(
              today.getTime() - 30 * 24 * 60 * 60 * 1000,
            );
            return sessionDate >= monthAgo;
          case "this_month":
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            return sessionDate >= monthStart;
          case "custom":
            if (customStartDate && customEndDate) {
              const startDate = new Date(customStartDate);
              const endDate = new Date(customEndDate + " 23:59:59");
              return sessionDate >= startDate && sessionDate <= endDate;
            }
            return true;
          default:
            return true;
        }
      });
    }

    // Filtre par caissier
    if (cashierFilter !== "all") {
      filtered = filtered.filter((s) => s.cashier_username === cashierFilter);
    }

    // Filtre par jeu
    if (gameFilter !== "all") {
      filtered = filtered.filter((s) => s.game_name === gameFilter);
    }

    // Filtre par statut
    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    setFilteredSessions(filtered);

    // Calcul des statistiques
    const stats = {
      totalSessions: filtered.length,
      totalRevenue: filtered.reduce(
        (sum, s) => sum + (parseFloat(s.total_price?.toString()) || 0),
        0,
      ),
      totalPlayers: filtered.reduce(
        (sum, s) => sum + (parseInt(s.player_count?.toString()) || 0),
        0,
      ),
      averageSessionAmount: 0,
      sessionsByGame: {} as Record<string, number>,
      sessionsByCashier: {} as Record<string, number>,
    };

    stats.averageSessionAmount =
      stats.totalSessions > 0 ? stats.totalRevenue / stats.totalSessions : 0;

    // Statistiques par jeu
    filtered.forEach((session) => {
      const game = session.game_name || "Inconnu";
      stats.sessionsByGame[game] = (stats.sessionsByGame[game] || 0) + 1;
    });

    // Statistiques par caissier
    filtered.forEach((session) => {
      const cashier = session.cashier_username || "Inconnu";
      stats.sessionsByCashier[cashier] =
        (stats.sessionsByCashier[cashier] || 0) + 1;
    });

    setSessionStats(stats);
  }, [
    sessions,
    searchTerm,
    dateFilter,
    cashierFilter,
    gameFilter,
    statusFilter,
    customStartDate,
    customEndDate,
  ]);

  const handlePrint = (session: GameSession) => {
    generateGameSessionReceipt(
      {
        session_id: session.session_id,
        game_name: session.game_name || "",
        pricing_description: session.pricing_description || "",
        mode: session.mode,
        player_count: session.player_count,
        price_per_person: session.total_price / session.player_count,
        total_price: session.total_price,
        cashier_name: session.cashier_username || "",
        date: session.created_at,
        notes: session.notes,
      },
      "print",
    );
  };

  const handleSelectAll = () => {
    if (selectedSessions.length === filteredSessions.length) {
      setSelectedSessions([]);
    } else {
      setSelectedSessions(
        filteredSessions.map((session) => session.session_id),
      );
    }
  };

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessions((prev) =>
      prev.includes(sessionId)
        ? prev.filter((id) => id !== sessionId)
        : [...prev, sessionId],
    );
  };

  const handleGenerateReport = async () => {
    try {
      const reportSessions: GameSessionReportItem[] = filteredSessions.map(
        (session) => ({
          session_id: session.session_id,
          game_id: session.game_id,
          game_name: session.game_name || "Inconnu",
          pricing_id: session.pricing_id,
          pricing_description: session.pricing_description || "Non spécifiée",
          mode: session.mode,
          player_count: session.player_count,
          total_price: session.total_price,
          cashier_username: session.cashier_username || "Inconnu",
          created_at: session.created_at,
          notes: session.notes,
          status: session.status,
        }),
      );

      const reportConfig = {
        dateRange: getDateRangeText(),
        filterType:
          `${searchTerm ? `Recherche: "${searchTerm}" | ` : ""}${
            gameFilter !== "all" ? `Jeu: ${gameFilter} | ` : ""
          }${cashierFilter !== "all" ? `Caissier: ${cashierFilter} | ` : ""}${
            statusFilter !== "all" ? `Statut: ${statusFilter}` : ""
          }`.replace(/\|\s*$/, "") || "Toutes les sessions",
      };

      await generateGameSessionReport(reportSessions, reportConfig, "preview");
    } catch (error) {
      console.error("Erreur lors de la génération du rapport:", error);
    }
  };

  const getDateRangeText = () => {
    switch (dateFilter) {
      case "today":
        return "Aujourd'hui";
      case "week":
        return "7 derniers jours";
      case "month":
        return "30 derniers jours";
      case "this_month":
        return "Ce mois";
      case "custom":
        return customStartDate && customEndDate
          ? `${customStartDate} - ${customEndDate}`
          : "Période personnalisée";
      default:
        return "Toutes les périodes";
    }
  };

  if (loading && sessions.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-lg text-gray-700">Chargement des sessions...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Historique des Sessions de Jeu
              </h1>
              <p className="text-gray-600">
                Consultez et analysez toutes les sessions de jeu
              </p>
            </div>
          </div>
        </div>

        {/* Filtres de date personnalisés */}
        {dateFilter === "custom" && (
          <div className="flex items-center space-x-4 mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Du:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Au:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
            </div>
          </div>
        )}

        {/* Actions et informations */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleGenerateReport}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
              disabled={filteredSessions.length === 0}
            >
              <DocumentChartBarIcon className="w-5 h-5" />
              <span>Rapport PDF</span>
            </button>
          </div>

          <div className="text-sm text-gray-600">
            Période: {getDateRangeText()} | {filteredSessions.length} session(s)
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Sessions
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {sessionStats.totalSessions}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <PlayIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Chiffre d&apos;Affaires
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(sessionStats.totalRevenue)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Joueurs
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {sessionStats.totalPlayers}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <UsersIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Session Moyenne
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(sessionStats.averageSessionAmount)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <ChartBarIcon className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="text-red-800">
              <strong>Erreur:</strong> {error}
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              />
            </div>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            >
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd&apos;hui</option>
              <option value="week">7 derniers jours</option>
              <option value="month">30 derniers jours</option>
              <option value="this_month">Ce mois</option>
              <option value="custom">Période personnalisée</option>
            </select>

            <select
              value={cashierFilter}
              onChange={(e) => setCashierFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            >
              <option value="all">Tous les caissiers</option>
              {uniqueCashiers.map((cashier) => (
                <option key={cashier} value={cashier}>
                  {cashier}
                </option>
              ))}
            </select>

            <select
              value={gameFilter}
              onChange={(e) => setGameFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            >
              <option value="all">Tous les jeux</option>
              {uniqueGames.map((game) => (
                <option key={game} value={game}>
                  {game}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            >
              <option value="all">Tous les statuts</option>
              {uniqueStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tableau des sessions */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={
                        selectedSessions.length === filteredSessions.length &&
                        filteredSessions.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Session ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jeu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joueurs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Caissier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-gray-500">
                      <div className="flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-2"></div>
                        Chargement des sessions...
                      </div>
                    </td>
                  </tr>
                ) : filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <PlayIcon className="w-12 h-12 text-gray-400 mb-2" />
                        <p>Aucune session trouvée</p>
                        <p className="text-sm text-gray-400">
                          Modifiez vos filtres pour voir plus de résultats
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((session) => (
                    <tr
                      key={session.session_id}
                      className={`hover:bg-gray-50 ${
                        selectedSessions.includes(session.session_id)
                          ? "bg-blue-50"
                          : ""
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedSessions.includes(
                            session.session_id,
                          )}
                          onChange={() =>
                            handleSelectSession(session.session_id)
                          }
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                        {session.session_id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {session.game_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {session.pricing_description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div className="flex items-center">
                          {getModeIcon(session.mode)}
                          {session.mode}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div className="flex items-center">
                          <UsersIcon className="w-4 h-4 mr-1" />
                          {session.player_count}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(session.total_price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          {formatDate(session.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {session.cashier_username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                            statusColors[session.status] ||
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {session.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedSession(session);
                              setShowDetailModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Voir les détails"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handlePrint(session)}
                            className="text-green-600 hover:text-green-900"
                            title="Imprimer le reçu"
                          >
                            <PrinterIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de détails */}
        {showDetailModal && selectedSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/40">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-8">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Détails de la session #
                  {selectedSession.session_id.slice(0, 8)}
                </h3>
                <p className="text-sm text-gray-600">
                  {formatDate(selectedSession.created_at)} - Caissier:{" "}
                  {selectedSession.cashier_username}
                </p>
              </div>

              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-3">
                  Détails de la session
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Jeu
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Modalité
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mode
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Joueurs
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {selectedSession.game_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {selectedSession.pricing_description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {selectedSession.mode}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {selectedSession.player_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right text-gray-900">
                          {formatCurrency(selectedSession.total_price)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedSession.notes && (
                <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-900 mb-2">
                    Notes:
                  </h5>
                  <p className="text-sm text-gray-600">
                    {selectedSession.notes}
                  </p>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">
                    Total de la session:
                  </span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(selectedSession.total_price)}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Fermer
                </button>
                <button
                  onClick={() => handlePrint(selectedSession)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center space-x-2"
                >
                  <PrinterIcon className="w-4 h-4" />
                  <span>Imprimer Reçu</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminGameSessionsPage;
