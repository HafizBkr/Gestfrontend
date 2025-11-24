"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CashierLayout from "../../../components/cashier/CashierLayout";
import useCashierGamesGet, {
  CashierGame as GameWithPricing,
  CashierGamePricing as GamePricing,
} from "../../hooks/useCashierGamesGet";
import useGameSessions from "../../hooks/useGameSessions";
import {
  PlayIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UsersIcon,
  CheckCircleIcon,
  XMarkIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import { generateGameSessionReceipt } from "../../../utils/gameSessionReceiptGenerator";

const CashierGamesPage = () => {
  const router = useRouter();
  const {
    games,
    loading: gamesLoading,
    error: gamesError,
    getGames,
  } = useCashierGamesGet();
  const {
    createSession,
    loading: sessionLoading,
    error: sessionError,
  } = useGameSessions();

  // État du formulaire de vente
  const [selectedGame, setSelectedGame] = useState<GameWithPricing | null>(
    null,
  );
  const [selectedPricing, setSelectedPricing] = useState<GamePricing | null>(
    null,
  );
  const [playerCount, setPlayerCount] = useState<number>(1);
  const [notes, setNotes] = useState<string>("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  interface LastSaleData {
    sessionId?: string;
    gameName: string;
    pricingDescription: string;
    mode: string;
    playerCount: number;
    pricePerPerson: number;
    totalPrice: number;
    notes: string;
    timestamp: string;
    cashierName?: string;
  }
  const [lastSaleData, setLastSaleData] = useState<LastSaleData | null>(null);

  // Filtres et recherche
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    getGames();
  }, []);

  // Filtrer les jeux disponibles (avec au moins une modalité active)
  const availableGames = games.filter(
    (game) =>
      game.is_active &&
      game.pricing_options.some((pricing) => pricing.is_active) &&
      game.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Calculer le prix total
  const calculateTotalPrice = () => {
    if (!selectedPricing) return 0;
    return selectedPricing.price_per_person * playerCount;
  };

  // Gestionnaire de sélection de jeu
  const handleGameSelect = (game: GameWithPricing) => {
    setSelectedGame(game);
    setSelectedPricing(null); // Reset pricing selection
  };

  // Gestionnaire de sélection de modalité
  const handlePricingSelect = (pricing: GamePricing) => {
    setSelectedPricing(pricing);
  };

  // Gestionnaire de vente
  const handleSell = async () => {
    if (!selectedGame || !selectedPricing || playerCount < 1) {
      alert(
        "Veuillez sélectionner un jeu, une modalité et un nombre valide de joueurs",
      );
      return;
    }

    try {
      // On suppose que createSession retourne la session créée (à adapter si besoin)
      const session = await createSession({
        game_id: selectedGame.game_id,
        pricing_id: selectedPricing.pricing_id,
        player_count: playerCount,
        notes: notes.trim() || undefined,
      });

      // Sauvegarder les données pour le reçu
      setLastSaleData({
        sessionId: session?.session_id, // à adapter selon le retour réel de createSession
        gameName: selectedGame.name,
        pricingDescription: selectedPricing.description,
        mode: selectedPricing.mode,
        playerCount,
        pricePerPerson: selectedPricing.price_per_person,
        totalPrice: calculateTotalPrice(),
        notes,
        timestamp: new Date().toISOString(),
        cashierName: session?.cashier_username || "", // à adapter selon le retour réel
      });

      // Réinitialiser le formulaire
      setSelectedGame(null);
      setSelectedPricing(null);
      setPlayerCount(1);
      setNotes("");
      setShowConfirmation(true);
    } catch (error) {
      console.error("Erreur lors de la vente:", error);
    }
  };

  // Réinitialiser la sélection
  const handleReset = () => {
    setSelectedGame(null);
    setSelectedPricing(null);
    setPlayerCount(1);
    setNotes("");
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} FCFA`;
  };

  const getModeIcon = (mode: string) => {
    switch (mode.toLowerCase()) {
      case "heure":
        return <ClockIcon className="w-5 h-5" />;
      case "partie":
      case "match":
      case "combat":
        return <PlayIcon className="w-5 h-5" />;
      default:
        return <CurrencyDollarIcon className="w-5 h-5" />;
    }
  };

  if (gamesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des jeux...</p>
        </div>
      </div>
    );
  }

  return (
    <CashierLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <PlayIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Vente de Sessions de Jeu
                  </h1>
                  <p className="text-sm text-gray-500">
                    Sélectionnez un jeu et enregistrez la vente
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push("/dashboard")}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Retour au tableau de bord
              </button>
            </div>
          </div>
        </div>

        {/* Messages d'erreur */}
        {(gamesError || sessionError) && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <XMarkIcon className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                  <p className="mt-2 text-sm text-red-700">
                    {gamesError || sessionError}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Liste des jeux */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">
                    Jeux disponibles
                  </h2>
                  <div className="mt-4">
                    <input
                      type="text"
                      placeholder="Rechercher un jeu..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                    />
                  </div>
                </div>
                <div className="p-6">
                  {availableGames.length === 0 ? (
                    <div className="text-center py-12">
                      <PlayIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        Aucun jeu disponible
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {searchTerm
                          ? "Aucun jeu ne correspond à votre recherche."
                          : "Aucun jeu actif avec des modalités de prix configurées."}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {availableGames.map((game) => (
                        <div
                          key={game.game_id}
                          onClick={() => handleGameSelect(game)}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedGame?.game_id === game.game_id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-medium text-gray-900">
                              {game.name}
                            </h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {
                                game.pricing_options.filter((p) => p.is_active)
                                  .length
                              }{" "}
                              modalité(s)
                            </span>
                          </div>
                          {game.description && (
                            <p className="text-sm text-gray-500 mb-2">
                              {game.description}
                            </p>
                          )}
                          <div className="space-y-1">
                            {game.pricing_options
                              .filter((p) => p.is_active)
                              .map((pricing) => (
                                <div
                                  key={pricing.pricing_id}
                                  className="flex items-center text-sm text-gray-600"
                                >
                                  {getModeIcon(pricing.mode)}
                                  <span className="ml-2">
                                    {pricing.description} -{" "}
                                    {formatCurrency(pricing.price_per_person)}
                                    /pers
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Panneau de vente */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow sticky top-8">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">
                    Détails de la vente
                  </h2>
                </div>
                <div className="p-6 space-y-6">
                  {/* Jeu sélectionné */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jeu sélectionné
                    </label>
                    {selectedGame ? (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="font-medium text-blue-900">
                          {selectedGame.name}
                        </p>
                        {selectedGame.description && (
                          <p className="text-sm text-blue-700">
                            {selectedGame.description}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        Aucun jeu sélectionné
                      </p>
                    )}
                  </div>

                  {/* Modalité de paiement */}
                  {selectedGame && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Modalité de paiement
                      </label>
                      <div className="space-y-2">
                        {selectedGame.pricing_options
                          .filter((p) => p.is_active)
                          .map((pricing) => (
                            <label
                              key={pricing.pricing_id}
                              className="flex items-center"
                            >
                              <input
                                type="radio"
                                name="pricing"
                                value={pricing.pricing_id}
                                checked={
                                  selectedPricing?.pricing_id ===
                                  pricing.pricing_id
                                }
                                onChange={() => handlePricingSelect(pricing)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                              />
                              <div className="ml-3 flex-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    {getModeIcon(pricing.mode)}
                                    <span className="ml-2 text-sm font-medium text-gray-700">
                                      {pricing.description}
                                    </span>
                                  </div>
                                  <span className="text-sm font-bold text-green-600">
                                    {formatCurrency(pricing.price_per_person)}
                                    /pers
                                  </span>
                                </div>
                              </div>
                            </label>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Nombre de joueurs */}
                  {selectedPricing && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre de joueurs
                      </label>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() =>
                            setPlayerCount(Math.max(1, playerCount - 1))
                          }
                          className="inline-flex items-center justify-center w-8 h-8 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={playerCount}
                          onChange={(e) =>
                            setPlayerCount(
                              Math.max(1, parseInt(e.target.value) || 1),
                            )
                          }
                          className="w-20 text-center border border-gray-300 rounded-md py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                        />
                        <button
                          onClick={() => setPlayerCount(playerCount + 1)}
                          className="inline-flex items-center justify-center w-8 h-8 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50"
                        >
                          +
                        </button>
                        <div className="flex items-center text-gray-500">
                          <UsersIcon className="w-4 h-4 mr-1" />
                          <span className="text-sm">joueur(s)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes optionnelles */}
                  {selectedPricing && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes (optionnel)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        placeholder="Informations supplémentaires..."
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                      />
                    </div>
                  )}

                  {/* Récapitulatif du prix */}
                  {selectedPricing && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-black mb-2">
                        Récapitulatif
                      </h3>
                      <div className="space-y-1 text-sm text-black">
                        <div className="flex justify-between">
                          <span>Prix par joueur :</span>
                          <span>
                            {formatCurrency(selectedPricing.price_per_person)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Nombre de joueurs :</span>
                          <span>× {playerCount}</span>
                        </div>
                        <div className="border-t pt-1 mt-2">
                          <div className="flex justify-between font-bold text-lg">
                            <span>Total :</span>
                            <span className="text-green-600">
                              {formatCurrency(calculateTotalPrice())}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Boutons d'action */}
                  <div className="space-y-3">
                    <button
                      onClick={handleSell}
                      disabled={
                        !selectedGame ||
                        !selectedPricing ||
                        playerCount < 1 ||
                        sessionLoading
                      }
                      className={`w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                        selectedGame &&
                        selectedPricing &&
                        playerCount >= 1 &&
                        !sessionLoading
                          ? "bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          : "bg-gray-300 cursor-not-allowed"
                      }`}
                    >
                      {sessionLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="w-5 h-5 mr-2" />
                          Enregistrer la vente
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleReset}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <XMarkIcon className="w-4 h-4 mr-2" />
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de confirmation de vente */}
        {showConfirmation && lastSaleData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/40">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-8">
              <div className="mt-3 text-center">
                <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
                <h3 className="text-lg font-medium text-gray-900 mt-2">
                  Vente enregistrée !
                </h3>
                <div className="mt-4 text-left bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Détails de la vente :
                  </h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <strong>Jeu :</strong> {lastSaleData.gameName}
                    </p>
                    <p>
                      <strong>Modalité :</strong>{" "}
                      {lastSaleData.pricingDescription}
                    </p>
                    <p>
                      <strong>Joueurs :</strong> {lastSaleData.playerCount}
                    </p>
                    <p>
                      <strong>Total :</strong>{" "}
                      <span className="text-green-600 font-bold">
                        {formatCurrency(lastSaleData.totalPrice)}
                      </span>
                    </p>
                    {lastSaleData.notes && (
                      <p>
                        <strong>Notes :</strong> {lastSaleData.notes}
                      </p>
                    )}
                    <p>
                      <strong>Heure :</strong> {lastSaleData.timestamp}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={() => setShowConfirmation(false)}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                  >
                    Nouvelle vente
                  </button>
                  <button
                    onClick={() => {
                      if (lastSaleData) {
                        generateGameSessionReceipt(
                          {
                            session_id: lastSaleData.sessionId || "session",
                            game_name: lastSaleData.gameName,
                            pricing_description:
                              lastSaleData.pricingDescription,
                            mode: lastSaleData.mode,
                            player_count: lastSaleData.playerCount,
                            price_per_person: lastSaleData.pricePerPerson,
                            total_price: lastSaleData.totalPrice,
                            cashier_name:
                              lastSaleData.cashierName || "Caissier",
                            date: lastSaleData.timestamp,
                            notes: lastSaleData.notes,
                          },
                          "print",
                        );
                      }
                    }}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50"
                  >
                    <PrinterIcon className="w-4 h-4 mr-2" />
                    Imprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </CashierLayout>
  );
};

export default CashierGamesPage;
