import { useState } from "react";

export interface Game {
  game_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GamePricing {
  pricing_id: string;
  game_id: string;
  mode: string;
  duration_minutes?: number;
  price_per_person: number;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface GameWithPricing extends Game {
  pricing_options: GamePricing[];
}

interface GamesResponse {
  games: GameWithPricing[];
}

interface GameResponse {
  game: GameWithPricing;
}

interface UseGamesResult {
  games: GameWithPricing[];
  game: GameWithPricing | null;
  loading: boolean;
  error: string | null;
  getGames: () => Promise<void>;
  getGameById: (gameId: string) => Promise<void>;
  createGame: (data: Partial<Game>) => Promise<void>;
  updateGame: (gameId: string, data: Partial<Game>) => Promise<void>;
  deleteGame: (gameId: string) => Promise<void>;
  addGamePricing: (gameId: string, data: Partial<GamePricing>) => Promise<void>;
  updateGamePricing: (
    pricingId: string,
    data: Partial<GamePricing>,
  ) => Promise<void>;
  deleteGamePricing: (pricingId: string) => Promise<void>;
  disableGame: (gameId: string) => Promise<void>;
  enableGame: (gameId: string) => Promise<void>;
  // Ajout pour debug UI
  debugError?: string | null;
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:7000";
const API_PREFIX = `${BACKEND_URL}/games/admin/games`;

function getAuthHeaders() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

const useGames = (): UseGamesResult => {
  const [games, setGames] = useState<GameWithPricing[]>([]);
  const [game, setGame] = useState<GameWithPricing | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Lister tous les jeux avec leurs modalités de prix
  // GET /games/games
  const getGames = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_PREFIX}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      const data: GamesResponse = await res.json();
      setGames(data.games);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la récupération des jeux",
      );
    } finally {
      setLoading(false);
    }
  };

  // 2. Obtenir un jeu par son ID avec ses modalités
  // GET /games/games/:gameId
  const getGameById = async (gameId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_PREFIX}/${gameId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      const data: GameResponse = await res.json();
      setGame(data.game);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la récupération du jeu",
      );
    } finally {
      setLoading(false);
    }
  };

  // 3. Créer un jeu
  // POST /games/games
  const createGame = async (data: Partial<Game>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_PREFIX}`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      await getGames(); // Refresh list
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la création du jeu",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 4. Modifier un jeu
  // PATCH /games/games/:gameId
  const updateGame = async (gameId: string, data: Partial<Game>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_PREFIX}/${gameId}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      await getGames(); // Refresh list
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la modification du jeu",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 5. Supprimer un jeu
  // DELETE /games/games/:gameId
  const deleteGame = async (gameId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_PREFIX}/${gameId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      await getGames(); // Refresh list
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la suppression du jeu",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 6. Ajouter une modalité/prix à un jeu
  // POST /admin/games/:gameId/pricing
  const addGamePricing = async (gameId: string, data: Partial<GamePricing>) => {
    console.log("🎮 addGamePricing called with gameId:", gameId);
    console.log("📊 API_PREFIX:", API_PREFIX);
    console.log("🔗 URL finale:", `${API_PREFIX}/${gameId}/pricing`);
    console.log("📝 Data:", data);

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_PREFIX}/${gameId}/pricing`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      console.log("📡 Response status:", res.status);
      const responseText = await res.text();
      console.log("📡 Response body:", responseText);
      if (!res.ok)
        throw new Error(
          `Erreur ${res.status}: ${res.statusText} - ${responseText}`,
        );
      console.log("✅ Modalité ajoutée avec succès");
      await getGames(); // Refresh list
    } catch (err) {
      console.error("❌ Erreur dans addGamePricing:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de l'ajout de la modalité de prix",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 9. Modifier une modalité/prix
  // PATCH /games/games/pricing/:pricingId
  const updateGamePricing = async (
    pricingId: string,
    data: Partial<GamePricing>,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${BACKEND_URL}/games/admin/pricing/${pricingId}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        },
      );
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      await getGames(); // Refresh list
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la modification de la modalité de prix",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 10. Supprimer une modalité/prix
  // DELETE /games/games/pricing/:pricingId
  const deleteGamePricing = async (pricingId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${BACKEND_URL}/games/admin/pricing/${pricingId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        },
      );
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      await getGames(); // Refresh list
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la suppression de la modalité de prix",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 11. Désactiver un jeu
  // PATCH /games/admin/games/:gameId/disable
  const disableGame = async (gameId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_PREFIX}/${gameId}/disable`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      await getGames(); // Refresh list
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la désactivation du jeu",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 12. Réactiver un jeu
  // PATCH /games/admin/games/:gameId/enable
  const enableGame = async (gameId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_PREFIX}/${gameId}/enable`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      await getGames(); // Refresh list
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la réactivation du jeu",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    games,
    game,
    loading,
    error,
    getGames,
    getGameById,
    createGame,
    updateGame,
    deleteGame,
    addGamePricing,
    updateGamePricing,
    deleteGamePricing,
    disableGame,
    enableGame,
    debugError: error, // Pour affichage direct dans la page si besoin
  };
};

export default useGames;
