"use client";

import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import useGames, { GamePricing, GameWithPricing } from "../../hooks/useGames";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  PlayIcon,
  CurrencyDollarIcon,
  ClockIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";

const GamesPage = () => {
  const {
    games,
    loading,
    error,
    getGames,
    createGame,
    updateGame,
    addGamePricing,
    updateGamePricing,
    deleteGamePricing,
    disableGame,
    enableGame,
  } = useGames();

  // Affichage de l'erreur en haut de la page

  // Affichage de l'erreur globale (pricing, jeu, etc.)
  // À placer dans le JSX du composant, par exemple juste après l'ouverture du return :
  // {error && (
  //   <div style={{ color: "red", margin: "16px 0", fontWeight: "bold" }}>
  //     Erreur: {error}
  //   </div>
  // )}

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showGameModal, setShowGameModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [editingGame, setEditingGame] = useState<GameWithPricing | null>(null);
  const [editingPricing, setEditingPricing] = useState<GamePricing | null>(
    null,
  );
  const [selectedGameForPricing, setSelectedGameForPricing] =
    useState<GameWithPricing | null>(null);
  const [expandedGames, setExpandedGames] = useState<Set<string>>(new Set());
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedGameDetails, setSelectedGameDetails] =
    useState<GameWithPricing | null>(null);

  const [gameFormData, setGameFormData] = useState<{
    name: string;
    description: string;
  }>({
    name: "",
    description: "",
  });

  const [pricingFormData, setPricingFormData] = useState<{
    mode: string;
    duration_minutes: string;
    price_per_person: string;
    description: string;
  }>({
    mode: "",
    duration_minutes: "",
    price_per_person: "",
    description: "",
  });

  useEffect(() => {
    getGames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtrage des jeux
  const filteredGames = games.filter((game) => {
    const matchesSearch =
      game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (game.description &&
        game.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && game.is_active) ||
      (statusFilter === "inactive" && !game.is_active);

    return matchesSearch && matchesStatus;
  });

  // Tri des jeux par date de création décroissante
  const sortedGames = [...filteredGames].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handleGameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Vérification unicité du nom
      const isDuplicateName = games.some(
        (g) =>
          g.name.trim().toLowerCase() ===
            gameFormData.name.trim().toLowerCase() &&
          (!editingGame || g.game_id !== editingGame.game_id),
      );

      if (isDuplicateName) {
        alert("Un jeu avec ce nom existe déjà !");
        return;
      }

      const data = {
        name: gameFormData.name.trim(),
        description: gameFormData.description.trim(),
      };

      if (editingGame) {
        await updateGame(editingGame.game_id, data);
      } else {
        await createGame(data);
      }

      resetGameForm();
      setShowGameModal(false);
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
    }
  };

  const handlePricingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🚀 handlePricingSubmit déclenchée");
    console.log("📝 selectedGameForPricing:", selectedGameForPricing);
    console.log("📝 pricingFormData:", pricingFormData);

    try {
      const data = {
        mode: pricingFormData.mode,
        duration_minutes: pricingFormData.duration_minutes
          ? parseInt(pricingFormData.duration_minutes)
          : undefined,
        price_per_person: parseFloat(pricingFormData.price_per_person),
        description: pricingFormData.description.trim(),
        game_id: selectedGameForPricing?.game_id, // Ajout explicite du game_id dans le body
      };

      console.log("📦 Data à envoyer:", data);

      if (editingPricing) {
        console.log("✏️ Mode édition - updateGamePricing");
        await updateGamePricing(editingPricing.pricing_id, data);
      } else if (selectedGameForPricing) {
        console.log(
          "➕ Mode ajout - addGamePricing pour game_id:",
          selectedGameForPricing.game_id,
        );
        await addGamePricing(selectedGameForPricing.game_id, data);
      } else {
        console.error("❌ Aucun jeu sélectionné !");
      }

      resetPricingForm();
      setSelectedGameForPricing(null);
      setShowPricingModal(false);
    } catch (error) {
      console.error("❌ Erreur lors de la soumission:", error);
    }
  };

  const handleEditGame = (game: GameWithPricing) => {
    setEditingGame(game);
    setGameFormData({
      name: game.name,
      description: game.description || "",
    });
    setShowGameModal(true);
  };

  const handleEditPricing = (pricing: GamePricing) => {
    setEditingPricing(pricing);
    setPricingFormData({
      mode: pricing.mode,
      duration_minutes: pricing.duration_minutes?.toString() || "",
      price_per_person: pricing.price_per_person.toString(),
      description: pricing.description,
    });
    setShowPricingModal(true);
  };

  const handleDeletePricing = async (pricingId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette modalité ?")) {
      try {
        await deleteGamePricing(pricingId);
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
      }
    }
  };

  const handleDisableGame = async (gameId: string) => {
    if (confirm("Êtes-vous sûr de vouloir désactiver ce jeu ?")) {
      try {
        await disableGame(gameId);
      } catch (error) {
        console.error("Erreur lors de la désactivation:", error);
      }
    }
  };

  const handleEnableGame = async (gameId: string) => {
    if (confirm("Êtes-vous sûr de vouloir réactiver ce jeu ?")) {
      try {
        await enableGame(gameId);
      } catch (error) {
        console.error("Erreur lors de la réactivation:", error);
      }
    }
  };

  const resetGameForm = () => {
    setGameFormData({
      name: "",
      description: "",
    });
    setEditingGame(null);
  };

  const resetPricingForm = () => {
    setPricingFormData({
      mode: "",
      duration_minutes: "",
      price_per_person: "",
      description: "",
    });
    setEditingPricing(null);
  };

  const openAddGameModal = () => {
    resetGameForm();
    setShowGameModal(true);
  };

  const openAddPricingModal = (game: GameWithPricing) => {
    setSelectedGameForPricing(game);
    resetPricingForm();
    setShowPricingModal(true);
  };

  const toggleGameExpansion = (gameId: string) => {
    const newExpanded = new Set(expandedGames);
    if (newExpanded.has(gameId)) {
      newExpanded.delete(gameId);
    } else {
      newExpanded.add(gameId);
    }
    setExpandedGames(newExpanded);
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} CFA`;
  };

  const getModeIcon = (mode: string) => {
    switch (mode.toLowerCase()) {
      case "heure":
        return ClockIcon;
      case "partie":
      case "combat":
        return PlayIcon;
      default:
        return CurrencyDollarIcon;
    }
  };

  const totalGames = games.length;
  const activeGames = games.filter((g) => g.is_active).length;
  const inactiveGames = games.filter((g) => !g.is_active).length;
  const gamesWithPricing = games.filter(
    (g) => g.pricing_options && g.pricing_options.length > 0,
  ).length;

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">
              Gestion des Jeux Vidéos
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              Gérez vos jeux et leurs modalités de prix (heure, partie, combat,
              etc.)
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              onClick={openAddGameModal}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Nouveau Jeu
            </button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="shrink-0">
                  <PlayIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Jeux
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {totalGames}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="shrink-0">
                  <PlayIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Jeux Actifs
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {activeGames}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Avec Tarifs
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {gamesWithPricing}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher un jeu..."
                className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <select
              className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>
          </div>
        </div>

        {/* Affichage des erreurs */}
        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Loader */}
        {loading && (
          <div className="mt-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Liste des jeux */}
        <div className="mt-8 flow-root">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Jeu
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Modalités
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date création
                      </th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedGames.map((game) => (
                      <React.Fragment key={game.game_id}>
                        <tr
                          className={
                            game.is_active
                              ? "cursor-pointer hover:bg-blue-50 transition"
                              : "bg-gray-50 cursor-pointer hover:bg-blue-50 transition"
                          }
                          onClick={() => {
                            setSelectedGameDetails(game);
                            setShowDetailsModal(true);
                          }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {game.name}
                              </div>
                              {game.description && (
                                <div className="text-sm text-gray-500">
                                  {game.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {game.pricing_options?.length || 0} modalités
                              </span>
                              {game.pricing_options &&
                                game.pricing_options.length > 0 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleGameExpansion(game.game_id);
                                    }}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    {expandedGames.has(game.game_id)
                                      ? "Masquer"
                                      : "Voir"}
                                  </button>
                                )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                game.is_active
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {game.is_active ? "Actif" : "Inactif"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(game.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openAddPricingModal(game);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                                title="Ajouter modalité"
                              >
                                <CurrencyDollarIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditGame(game);
                                }}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="Modifier"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </button>
                              {game.is_active ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDisableGame(game.game_id);
                                  }}
                                  className="text-orange-600 hover:text-orange-900"
                                  title="Désactiver"
                                >
                                  <EyeSlashIcon className="h-5 w-5" />
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEnableGame(game.game_id);
                                  }}
                                  className="text-green-600 hover:text-green-900"
                                  title="Réactiver"
                                >
                                  <EyeIcon className="h-5 w-5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {/* Modalités de prix détaillées */}
                        {expandedGames.has(game.game_id) &&
                          game.pricing_options && (
                            <tr>
                              <td colSpan={5} className="px-6 py-4 bg-gray-50">
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium text-gray-900">
                                    Modalités de prix pour {game.name}
                                  </h4>
                                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {game.pricing_options.map((pricing) => {
                                      const IconComponent = getModeIcon(
                                        pricing.mode,
                                      );
                                      return (
                                        <div
                                          key={pricing.pricing_id}
                                          className={`p-3 rounded-lg border ${
                                            pricing.is_active
                                              ? "border-green-200 bg-green-50"
                                              : "border-gray-200 bg-gray-100"
                                          }`}
                                        >
                                          <div className="flex items-start justify-between">
                                            <div className="flex items-center space-x-2">
                                              <IconComponent className="h-5 w-5 text-gray-400" />
                                              <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                  {pricing.description}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                  {formatCurrency(
                                                    Number(
                                                      pricing.price_per_person,
                                                    ),
                                                  )}{" "}
                                                  / personne
                                                </div>
                                                {pricing.duration_minutes && (
                                                  <div className="text-xs text-gray-400">
                                                    {pricing.duration_minutes}{" "}
                                                    minutes
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                            <div className="flex space-x-1">
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleEditPricing(pricing);
                                                }}
                                                className="text-indigo-600 hover:text-indigo-900"
                                                title="Modifier"
                                              >
                                                <PencilIcon className="h-4 w-4" />
                                              </button>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleDeletePricing(
                                                    pricing.pricing_id,
                                                  );
                                                }}
                                                className="text-red-600 hover:text-red-900"
                                                title="Supprimer"
                                              >
                                                <TrashIcon className="h-4 w-4" />
                                              </button>
                                            </div>
                                          </div>
                                          <div
                                            className={`mt-1 text-xs ${
                                              pricing.is_active
                                                ? "text-green-600"
                                                : "text-red-600"
                                            }`}
                                          >
                                            {pricing.is_active
                                              ? "Actif"
                                              : "Inactif"}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Jeu */}
        {showGameModal && (
          <div className="fixed inset-0 backdrop-blur-md overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white backdrop-blur-none">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingGame ? "Modifier le jeu" : "Nouveau jeu"}
                </h3>
                <form onSubmit={handleGameSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nom du jeu *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      value={gameFormData.name}
                      onChange={(e) =>
                        setGameFormData({
                          ...gameFormData,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      value={gameFormData.description}
                      onChange={(e) =>
                        setGameFormData({
                          ...gameFormData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowGameModal(false)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? "..." : editingGame ? "Modifier" : "Créer"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal Modalité de prix */}
        {showPricingModal && (
          <div className="fixed inset-0 backdrop-blur-md overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white backdrop-blur-none">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingPricing
                    ? "Modifier la modalité"
                    : "Nouvelle modalité"}
                  {selectedGameForPricing && (
                    <span className="text-sm text-gray-500 block">
                      pour {selectedGameForPricing.name}
                    </span>
                  )}
                </h3>
                <form onSubmit={handlePricingSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Mode *
                    </label>
                    <select
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      value={pricingFormData.mode}
                      onChange={(e) =>
                        setPricingFormData({
                          ...pricingFormData,
                          mode: e.target.value,
                        })
                      }
                    >
                      <option value="">Sélectionner un mode</option>
                      <option value="heure">Heure</option>
                      <option value="partie">Partie</option>
                      <option value="combat">Combat</option>
                    </select>
                  </div>

                  {pricingFormData.mode === "heure" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Durée (minutes)
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                        value={pricingFormData.duration_minutes}
                        onChange={(e) =>
                          setPricingFormData({
                            ...pricingFormData,
                            duration_minutes: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Prix par personne (CFA) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      value={pricingFormData.price_per_person}
                      onChange={(e) =>
                        setPricingFormData({
                          ...pricingFormData,
                          price_per_person: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ex: 1h par personne, 1 match, 1 combat..."
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      value={pricingFormData.description}
                      onChange={(e) =>
                        setPricingFormData({
                          ...pricingFormData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowPricingModal(false)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading
                        ? "..."
                        : editingPricing
                          ? "Modifier"
                          : "Ajouter"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Modal détails jeu/modalités */}
      {showDetailsModal && selectedGameDetails && (
        <div className="fixed inset-0 backdrop-blur-md overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white backdrop-blur-none">
            <div className="mt-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {selectedGameDetails.name}
              </h3>
              {selectedGameDetails.description && (
                <div className="mb-2 text-gray-600">
                  {selectedGameDetails.description}
                </div>
              )}
              <div className="mb-4 text-xs text-gray-400">
                Créé le :{" "}
                {new Date(selectedGameDetails.created_at).toLocaleString()}
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">
                  Modalités de paiement
                </h4>
                {selectedGameDetails.pricing_options &&
                selectedGameDetails.pricing_options.length > 0 ? (
                  <div className="space-y-2">
                    {selectedGameDetails.pricing_options.map((pricing) => {
                      const IconComponent = getModeIcon(pricing.mode);
                      return (
                        <div
                          key={pricing.pricing_id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            pricing.is_active
                              ? "border-green-200 bg-green-50"
                              : "border-gray-200 bg-gray-100"
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <IconComponent className="h-5 w-5 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {pricing.description}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatCurrency(
                                  Number(pricing.price_per_person),
                                )}{" "}
                                / personne
                              </div>
                              {pricing.duration_minutes && (
                                <div className="text-xs text-gray-400">
                                  {pricing.duration_minutes} minutes
                                </div>
                              )}
                            </div>
                          </div>
                          <span
                            className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                              pricing.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {pricing.is_active ? "Actif" : "Inactif"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-gray-400 italic">
                    Aucune modalité de paiement définie.
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 pt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default GamesPage;
