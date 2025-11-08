import { useCashierAuth } from "./useAuth";

/**
 * Hook pour vérifier l'authentification du caissier.
 * Redirige vers /login si le caissier n'est pas authentifié.
 * @deprecated Utilisez useCashierAuth de useAuth.ts à la place
 */
export default function useCashierAuthLegacy() {
  return useCashierAuth();
}
