import { useState } from "react";

interface Admin {
  admin_id: string;
  admin_email: string;
  admin_name: string;
}

interface LoginResponse {
  success: boolean;
  admin: Admin;
  token: string;
  message?: string;
}

interface UseAdminLoginResult {
  login: (email: string, password: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  admin: Admin | null;
  token: string | null;
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:7000";

export default function useAdminLogin(): UseAdminLoginResult {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/admin/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data: LoginResponse = await response.json();

      if (response.ok && data.success) {
        setAdmin(data.admin);
        setToken(data.token);
        // Stocker le token dans localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("admin_token", data.token);
          localStorage.setItem("admin_data", JSON.stringify(data.admin));
        }
      } else {
        setError(data.message || "Erreur de connexion");
      }
    } catch (err) {
      setError("Erreur réseau ou serveur");
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error, admin, token };
}
