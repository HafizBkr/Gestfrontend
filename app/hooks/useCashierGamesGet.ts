import { useState } from "react";

export interface CashierGame {
  game_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  pricing_options: CashierGamePricing[];
}

export interface CashierGamePricing {
  pricing_id: string;
  game_id: string;
  mode: string;
  duration_minutes?: number;
  price_per_person: number;
  description: string;
  is_active: boolean;
  created_at: string;
}

interface CashierGamesResponse {
  games: CashierGame[];
}

interface UseCashierGamesGetResult {
  games: CashierGame[];
  loading: boolean;
  error: string | null;
  getGames: () => Promise<void>;
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:7000";
const API_PREFIX = `${BACKEND_URL}/games/games`;

function getAuthHeaders() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("cashier_token")
      : null;
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

/**
 * Hook pour récupérer la liste des jeux disponibles pour le caissier.
 * Utilise uniquement GET /games.
 */
const useCashierGamesGet = (): UseCashierGamesGetResult => {
  const [games, setGames] = useState<CashierGame[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getGames = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_PREFIX}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      const data: CashierGamesResponse = await res.json();
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

  return {
    games,
    loading,
    error,
    getGames,
  };
};

export default useCashierGamesGet;
