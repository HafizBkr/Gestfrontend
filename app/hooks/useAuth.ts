import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService, UserType, TokenPayload } from '../../utils/authService';

interface UseAuthResult {
  isAuthenticated: boolean;
  userType: UserType | null;
  tokenPayload: TokenPayload | null;
  timeUntilExpiration: number;
  logout: () => void;
  checkAuthStatus: () => void;
}

/**
 * Hook personnalisé pour gérer l'authentification et l'expiration des tokens
 * @param userType Type d'utilisateur à surveiller ('cashier' ou 'admin')
 * @returns Objet contenant l'état d'authentification et les méthodes utiles
 */
export function useAuth(userType: UserType): UseAuthResult {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [tokenPayload, setTokenPayload] = useState<TokenPayload | null>(null);
  const [timeUntilExpiration, setTimeUntilExpiration] = useState<number>(-1);

  /**
   * Vérifie le statut d'authentification
   */
  const checkAuthStatus = useCallback(() => {
    const authenticated = authService.isAuthenticated(userType);
    const payload = authService.getTokenPayload(userType);
    const timeLeft = authService.getTimeUntilExpiration(userType);

    setIsAuthenticated(authenticated);
    setTokenPayload(payload);
    setTimeUntilExpiration(timeLeft);

    // Si non authentifié, rediriger vers la page de login
    if (!authenticated && typeof window !== 'undefined') {
      const loginUrl = userType === 'cashier' ? '/login' : '/admin-login-xyz';
      router.replace(loginUrl);
    }
  }, [userType, router]);

  /**
   * Déconnecte l'utilisateur
   */
  const logout = useCallback(() => {
    authService.logout(userType);
  }, [userType]);

  // Vérification initiale et mise en place des intervalles
  useEffect(() => {
    // Vérification initiale
    checkAuthStatus();

    // Vérification périodique toutes les 30 secondes
    const intervalId = setInterval(checkAuthStatus, 30000);

    // Nettoyage à la destruction du composant
    return () => {
      clearInterval(intervalId);
    };
  }, [checkAuthStatus]);

  // Écouter les changements dans le localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      const relevantKeys = userType === 'cashier'
        ? ['cashier_token', 'cashier_data']
        : ['admin_token', 'admin_data'];

      if (relevantKeys.includes(e.key || '')) {
        checkAuthStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkAuthStatus, userType]);

  // Afficher un avertissement quand le token approche de l'expiration (5 minutes)
  useEffect(() => {
    if (timeUntilExpiration > 0 && timeUntilExpiration <= 300 && isAuthenticated) {
      console.warn(`Token ${userType} expire dans ${Math.floor(timeUntilExpiration / 60)} minutes`);
    }
  }, [timeUntilExpiration, isAuthenticated, userType]);

  return {
    isAuthenticated,
    userType: isAuthenticated ? userType : null,
    tokenPayload,
    timeUntilExpiration,
    logout,
    checkAuthStatus
  };
}

/**
 * Hook spécialisé pour l'authentification des caissiers
 */
export function useCashierAuth(): UseAuthResult {
  return useAuth('cashier');
}

/**
 * Hook spécialisé pour l'authentification des administrateurs
 */
export function useAdminAuth(): UseAuthResult {
  return useAuth('admin');
}
