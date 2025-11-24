import { useState } from "react";

export interface GameSession {
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
  // Relations
  game_name?: string;
  pricing_description?: string;
  cashier_username?: string;
}

interface GameSessionsResponse {
  sessions: GameSession[];
}

interface GameSessionResponse {
  session: GameSession;
}

interface UseGameSessionsResult {
  sessions: GameSession[];
  session: GameSession | null;
  loading: boolean;
  error: string | null;
  getSessions: (filters?: {
    game_id?: string;
    cashier_id?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
  }) => Promise<void>;
  getSessionsForCashier: (filters?: {
    game_id?: string;
    cashier_id?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
  }) => Promise<void>;
  getSessionById: (sessionId: string) => Promise<void>;
  createSession: (data: {
    game_id: string;
    pricing_id: string;
    player_count: number;
    notes?: string;
  }) => Promise<GameSession | undefined>;
  updateSession: (
    sessionId: string,
    data: Partial<GameSession>,
  ) => Promise<void>;
  endSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:7000";

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

const useGameSessions = (): UseGameSessionsResult => {
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [session, setSession] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Lister les sessions avec filtres optionnels
  const getSessions = async (filters?: {
    game_id?: string;
    cashier_id?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) queryParams.append(key, value);
        });
      }

      // Endpoint général pour toutes les sessions (admin)
      const url = `${BACKEND_URL}/games/sessions${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const res = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      const data: GameSessionsResponse = await res.json();
      setSessions(data.sessions);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la récupération des sessions",
      );
    } finally {
      setLoading(false);
    }
  };

  // Sessions du caissier connecté uniquement
  const getSessionsForCashier = async (filters?: {
    game_id?: string;
    cashier_id?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) queryParams.append(key, value);
        });
      }
      const url = `${BACKEND_URL}/games/sessions/cashier${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const res = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      const data: GameSessionsResponse = await res.json();
      setSessions(data.sessions);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la récupération des sessions du caissier",
      );
    } finally {
      setLoading(false);
    }
  };

  // 2. Obtenir une session par son ID
  const getSessionById = async (sessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/games/sessions/${sessionId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      const data: GameSessionResponse = await res.json();
      setSession(data.session);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la récupération de la session",
      );
    } finally {
      setLoading(false);
    }
  };

  // 3. Créer une session (enregistrer une vente)
  const createSession = async (data: {
    game_id: string;
    pricing_id: string;
    player_count: number;
    notes?: string;
  }): Promise<GameSession | undefined> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/games/sessions`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      const responseData: GameSessionResponse = await res.json();
      return responseData.session;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la création de la session",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 4. Modifier une session
  const updateSession = async (
    sessionId: string,
    data: Partial<GameSession>,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/games/sessions/${sessionId}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      await getSessions(); // Refresh list
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la modification de la session",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 5. Terminer une session
  const endSession = async (sessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${BACKEND_URL}/games/sessions/${sessionId}/end`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
        },
      );
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      await getSessions(); // Refresh list
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la fin de la session",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 6. Supprimer une session
  const deleteSession = async (sessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/games/sessions/${sessionId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      await getSessions(); // Refresh list
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la suppression de la session",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    sessions,
    session,
    loading,
    error,
    getSessions,
    getSessionsForCashier,
    getSessionById,
    createSession,
    updateSession,
    endSession,
    deleteSession,
  };
};

export default useGameSessions;
