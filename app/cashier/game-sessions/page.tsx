"use client";

import React, { useEffect, useState } from "react";
import CashierLayout from "../../../components/cashier/CashierLayout";
import useGameSessions, { GameSession } from "../../hooks/useGameSessions";
import { generateGameSessionReceipt } from "../../../utils/gameSessionReceiptGenerator";
import {
  PlayIcon,
  ClockIcon,
  PrinterIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const formatCurrency = (amount: number) =>
  `${amount.toLocaleString("fr-FR")} FCFA`;

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

const CashierGameSessionsPage = () => {
  const { sessions, loading, error, getSessionsForCashier } = useGameSessions();

  const [search, setSearch] = useState("");
  const [filteredSessions, setFilteredSessions] = useState<GameSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<GameSession | null>(
    null,
  );

  useEffect(() => {
    getSessionsForCashier();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!search) {
      setFilteredSessions(sessions);
    } else {
      const lower = search.toLowerCase();
      setFilteredSessions(
        sessions.filter(
          (s) =>
            s.game_name?.toLowerCase().includes(lower) ||
            s.pricing_description?.toLowerCase().includes(lower) ||
            s.mode?.toLowerCase().includes(lower) ||
            s.status?.toLowerCase().includes(lower) ||
            s.cashier_username?.toLowerCase().includes(lower) ||
            formatDate(s.created_at).includes(lower),
        ),
      );
    }
  }, [search, sessions]);

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

  return (
    <CashierLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Historique des sessions de jeu
              </h1>
              <p className="text-sm text-gray-500">
                Retrouvez ici toutes les sessions enregistrées par le caissier.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher (jeu, modalité, caissier, date...)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                />
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-2 top-2.5 text-gray-400" />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jeu
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Modalité
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mode
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joueurs
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Caissier
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-500">
                      Chargement des sessions...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-red-500">
                      {error}
                    </td>
                  </tr>
                ) : filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-500">
                      Aucune session trouvée.
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((session) => (
                    <tr key={session.session_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                        {session.game_name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                        {session.pricing_description}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                        {getModeIcon(session.mode)}
                        {session.mode}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                        {session.player_count}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900 font-bold">
                        {formatCurrency(session.total_price)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                        {formatDate(session.created_at)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                        {session.cashier_username}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                            statusColors[session.status] ||
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {session.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <button
                          title="Imprimer le reçu"
                          onClick={() => handlePrint(session)}
                          className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <PrinterIcon className="w-5 h-5 mr-1" />
                          Reçu
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </CashierLayout>
  );
};

export default CashierGameSessionsPage;
