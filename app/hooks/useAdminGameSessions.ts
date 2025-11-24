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

interface UseAdminGameSessionsResult {
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
  getSessionById: (sessionId: string) => Promise<void>;
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:7000";

function getAdminAuthHeaders() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

const useAdminGameSessions = (): UseAdminGameSessionsResult => {
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [session, setSession] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Lister toutes les sessions (admin)
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
      const url = `${BACKEND_URL}/games/sessions${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const res = await fetch(url, {
        method: "GET",
        headers: getAdminAuthHeaders(),
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

  // 2. Obtenir une session par son ID (admin)
  const getSessionById = async (sessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/games/sessions/${sessionId}`, {
        method: "GET",
        headers: getAdminAuthHeaders(),
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

  return {
    sessions,
    session,
    loading,
    error,
    getSessions,
    getSessionById,
  };
};

export default useAdminGameSessions;
