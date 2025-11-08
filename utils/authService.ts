/**
 * Service d'authentification centralisé pour gérer l'expiration des tokens
 * et les redirections automatiques vers les pages de login
 */

interface TokenPayload {
  username?: string;
  cashier_id?: string;
  admin_id?: string;
  admin_email?: string;
  exp: number;
  iat: number;
}

type UserType = 'cashier' | 'admin';

class AuthService {
  private static instance: AuthService;
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 60000; // Vérifier toutes les minutes

  private constructor() {
    this.startTokenExpirationCheck();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Démarre la vérification périodique de l'expiration des tokens
   */
  private startTokenExpirationCheck(): void {
    if (typeof window === 'undefined') return;

    this.checkInterval = setInterval(() => {
      this.checkTokenExpiration();
    }, this.CHECK_INTERVAL);
  }

  /**
   * Arrête la vérification périodique
   */
  public stopTokenExpirationCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Vérifie l'expiration des tokens et redirige si nécessaire
   */
  private checkTokenExpiration(): void {
    const cashierExpired = this.isTokenExpired('cashier');
    const adminExpired = this.isTokenExpired('admin');

    if (cashierExpired) {
      this.handleTokenExpiration('cashier');
    }

    if (adminExpired) {
      this.handleTokenExpiration('admin');
    }
  }

  /**
   * Vérifie si un token est expiré
   * @param userType Type d'utilisateur (cashier ou admin)
   * @returns true si le token est expiré ou invalide
   */
  private isTokenExpired(userType: UserType): boolean {
    if (typeof window === 'undefined') return false;

    const tokenKey = userType === 'cashier' ? 'cashier_token' : 'admin_token';
    const token = localStorage.getItem(tokenKey);

    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as TokenPayload;
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp <= currentTime;
    } catch (error) {
      console.error(`Erreur lors de la validation du token ${userType}:`, error);
      return true; // Considérer comme expiré si erreur de décodage
    }
  }

  /**
   * Gère l'expiration d'un token en nettoyant le localStorage et en redirigeant
   * @param userType Type d'utilisateur dont le token a expiré
   */
  private handleTokenExpiration(userType: UserType): void {
    if (typeof window === 'undefined') return;

    console.warn(`Token ${userType} expiré, redirection vers la page de login`);

    // Nettoyer le localStorage
    if (userType === 'cashier') {
      localStorage.removeItem('cashier_token');
      localStorage.removeItem('cashier_data');
    } else {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_data');
    }

    // Rediriger vers la page de login appropriée
    const loginUrl = userType === 'cashier' ? '/login' : '/admin-login-xyz';

    // Utiliser window.location pour forcer la redirection
    window.location.href = loginUrl;
  }

  /**
   * Vérifie manuellement si le token actuel est valide
   * @param userType Type d'utilisateur à vérifier
   * @returns true si le token est valide
   */
  public isTokenValid(userType: UserType): boolean {
    return !this.isTokenExpired(userType);
  }

  /**
   * Décode et retourne le payload d'un token
   * @param userType Type d'utilisateur
   * @returns Le payload du token ou null si erreur
   */
  public getTokenPayload(userType: UserType): TokenPayload | null {
    if (typeof window === 'undefined') return null;

    const tokenKey = userType === 'cashier' ? 'cashier_token' : 'admin_token';
    const token = localStorage.getItem(tokenKey);

    if (!token) return null;

    try {
      return JSON.parse(atob(token.split('.')[1])) as TokenPayload;
    } catch (error) {
      console.error(`Erreur lors du décodage du token ${userType}:`, error);
      return null;
    }
  }

  /**
   * Obtient le temps restant avant expiration du token en secondes
   * @param userType Type d'utilisateur
   * @returns Nombre de secondes avant expiration, -1 si erreur
   */
  public getTimeUntilExpiration(userType: UserType): number {
    const payload = this.getTokenPayload(userType);
    if (!payload) return -1;

    const currentTime = Math.floor(Date.now() / 1000);
    return Math.max(0, payload.exp - currentTime);
  }

  /**
   * Force une vérification immédiate de l'expiration des tokens
   */
  public checkNow(): void {
    this.checkTokenExpiration();
  }

  /**
   * Nettoie et déconnecte un utilisateur
   * @param userType Type d'utilisateur à déconnecter
   */
  public logout(userType: UserType): void {
    if (typeof window === 'undefined') return;

    if (userType === 'cashier') {
      localStorage.removeItem('cashier_token');
      localStorage.removeItem('cashier_data');
    } else {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_data');
    }

    const loginUrl = userType === 'cashier' ? '/login' : '/admin-login-xyz';
    window.location.href = loginUrl;
  }

  /**
   * Vérifie si l'utilisateur est actuellement connecté
   * @param userType Type d'utilisateur
   * @returns true si connecté et token valide
   */
  public isAuthenticated(userType: UserType): boolean {
    if (typeof window === 'undefined') return false;

    const tokenKey = userType === 'cashier' ? 'cashier_token' : 'admin_token';
    const token = localStorage.getItem(tokenKey);

    return token !== null && this.isTokenValid(userType);
  }
}

// Export de l'instance singleton
export const authService = AuthService.getInstance();

// Export des types pour utilisation externe
export type { UserType, TokenPayload };
