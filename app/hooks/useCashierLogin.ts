import React, { useState } from "react";
import { authService } from "../../utils/authService";

interface Cashier {
  cashier_id: string;
  username: string;
  cashier_name?: string;
}

interface Session {
  session_id: string;
  [key: string]: unknown;
}

interface LoginResponse {
  cashier: Cashier;
  token: string;
  session: Session;
  message?: string;
}

interface LoginErrorResponse {
  message: string;
  error?: string;
}

interface UseCashierLoginResult {
  login: (username: string, password: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  cashier: Cashier | null;
  token: string | null;
  logout: () => void;
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:7000";

export default function useCashierLogin(): UseCashierLoginResult {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cashier, setCashier] = useState<Cashier | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Initialiser le token depuis localStorage au démarrage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("cashier_token");
      const storedCashier = localStorage.getItem("cashier_data");

      if (storedToken) {
        setToken(storedToken);
      }

      if (storedCashier) {
        try {
          const cashierData = JSON.parse(storedCashier);
          setCashier(cashierData);
        } catch (err) {
          console.error("Erreur lors du parsing des données caissier:", err);
        }
      }
    }
  }, []);

  const login = async (
    username: string,
    password: string,
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/cashiers/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      let data: LoginResponse | LoginErrorResponse = {} as LoginResponse;
      try {
        data = await response.json();
      } catch (jsonErr) {
        setError("Réponse serveur invalide");
        setLoading(false);
        return false;
      }

      // Debug : log la réponse
      console.log("Réponse login caissier:", data);

      if (response.ok && "cashier" in data && "token" in data) {
        setCashier(data.cashier);
        setToken(data.token);
        // Stocker le token dans localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("cashier_token", data.token);
          localStorage.setItem("cashier_data", JSON.stringify(data.cashier));
        }

        // Forcer une vérification immédiate de l'état d'authentification
        authService.checkNow();
        setLoading(false);
        return true;
      } else {
        setError(data.message || "Nom d'utilisateur ou mot de passe incorrect");
        setLoading(false);
        return false;
      }
    } catch (err) {
      setError("Erreur réseau ou serveur");
      setLoading(false);
      return false;
    }
  };

  const logout = (): void => {
    setCashier(null);
    setToken(null);
    setError(null);

    // Utiliser le service d'authentification pour la déconnexion
    authService.logout("cashier");
  };

  return { login, loading, error, cashier, token, logout };
}
