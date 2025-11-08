/**
 * Utilitaires d'authentification pour récupérer les informations du token
 */

interface TokenPayload {
  username: string;
  cashier_id: string;
  exp: number;
  iat: number;
}

/**
 * Récupère le nom du caissier depuis le token d'authentification
 * @returns Le nom d'utilisateur du caissier ou "Caissier" par défaut
 */
export const getCashierName = (): string => {
  try {
    const token = typeof window !== "undefined"
      ? localStorage.getItem("cashier_token")
      : null;

    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1])) as TokenPayload;
      return payload.username || "Caissier";
    }
  } catch (error) {
    console.error("Erreur lors du décodage du token:", error);
  }
  return "Caissier";
};

/**
 * Récupère l'ID du caissier depuis le token d'authentification
 * @returns L'ID du caissier ou null si non trouvé
 */
export const getCashierId = (): string | null => {
  try {
    const token = typeof window !== "undefined"
      ? localStorage.getItem("cashier_token")
      : null;

    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1])) as TokenPayload;
      return payload.cashier_id || null;
    }
  } catch (error) {
    console.error("Erreur lors du décodage du token:", error);
  }
  return null;
};

/**
 * Vérifie si le token est valide et non expiré
 * @returns true si le token est valide, false sinon
 */
export const isTokenValid = (): boolean => {
  try {
    const token = typeof window !== "undefined"
      ? localStorage.getItem("cashier_token")
      : null;

    if (!token) return false;

    const payload = JSON.parse(atob(token.split(".")[1])) as TokenPayload;
    const currentTime = Math.floor(Date.now() / 1000);

    return payload.exp > currentTime;
  } catch (error) {
    console.error("Erreur lors de la validation du token:", error);
    return false;
  }
};

/**
 * Récupère toutes les informations du payload du token
 * @returns Le payload du token ou null si erreur
 */
export const getTokenPayload = (): TokenPayload | null => {
  try {
    const token = typeof window !== "undefined"
      ? localStorage.getItem("cashier_token")
      : null;

    if (token) {
      return JSON.parse(atob(token.split(".")[1])) as TokenPayload;
    }
  } catch (error) {
    console.error("Erreur lors du décodage du token:", error);
  }
  return null;
};
