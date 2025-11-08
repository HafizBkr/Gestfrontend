/**
 * Intercepteur API pour gérer automatiquement l'expiration des tokens
 * et les redirections vers les pages de login
 */

import { authService, UserType } from './authService';

interface ApiRequestOptions extends RequestInit {
  userType?: UserType;
  skipAuthCheck?: boolean;
}

interface ApiResponse<T = any> extends Response {
  data?: T;
}

class ApiInterceptor {
  private static instance: ApiInterceptor;
  private readonly BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7000';

  private constructor() {}

  public static getInstance(): ApiInterceptor {
    if (!ApiInterceptor.instance) {
      ApiInterceptor.instance = new ApiInterceptor();
    }
    return ApiInterceptor.instance;
  }

  /**
   * Effectue une requête HTTP avec gestion automatique de l'authentification
   * @param url URL relative ou absolue
   * @param options Options de la requête avec type d'utilisateur
   * @returns Promise de la réponse
   */
  public async request<T = any>(
    url: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { userType, skipAuthCheck = false, ...fetchOptions } = options;

    // Construire l'URL complète si elle est relative
    const fullUrl = url.startsWith('http') ? url : `${this.BACKEND_URL}${url}`;

    // Préparer les headers
    const headers = new Headers(fetchOptions.headers);

    // Ajouter le token d'authentification si nécessaire
    if (!skipAuthCheck && userType) {
      const token = this.getAuthToken(userType);

      if (token) {
        // Vérifier si le token est valide avant la requête
        if (!authService.isTokenValid(userType)) {
          console.warn(`Token ${userType} expiré, redirection automatique`);
          authService.logout(userType);
          throw new Error('Token expiré');
        }

        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    // Ajouter le Content-Type par défaut pour les requêtes POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(fetchOptions.method?.toUpperCase() || 'GET')) {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
    }

    try {
      const response = await fetch(fullUrl, {
        ...fetchOptions,
        headers
      });

      // Vérifier si la réponse indique un token expiré
      if (response.status === 401 && userType && !skipAuthCheck) {
        console.warn(`Réponse 401 reçue pour ${userType}, token probablement expiré`);
        authService.logout(userType);
        throw new Error('Token expiré ou invalide');
      }

      // Traiter la réponse JSON si possible
      let data: T | undefined;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonError) {
          console.warn('Erreur lors du parsing JSON:', jsonError);
        }
      }

      // Créer un objet de réponse enrichi
      const apiResponse = response as ApiResponse<T>;
      apiResponse.data = data;

      return apiResponse;
    } catch (error) {
      // Gestion des erreurs réseau
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Erreur réseau:', error);
        throw new Error('Erreur de connexion au serveur');
      }

      throw error;
    }
  }

  /**
   * Méthodes de commodité pour les requêtes HTTP courantes
   */

  public async get<T = any>(
    url: string,
    userType?: UserType,
    options: Omit<ApiRequestOptions, 'method' | 'userType'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'GET',
      userType
    });
  }

  public async post<T = any>(
    url: string,
    data?: any,
    userType?: UserType,
    options: Omit<ApiRequestOptions, 'method' | 'body' | 'userType'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      userType
    });
  }

  public async put<T = any>(
    url: string,
    data?: any,
    userType?: UserType,
    options: Omit<ApiRequestOptions, 'method' | 'body' | 'userType'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      userType
    });
  }

  public async patch<T = any>(
    url: string,
    data?: any,
    userType?: UserType,
    options: Omit<ApiRequestOptions, 'method' | 'body' | 'userType'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      userType
    });
  }

  public async delete<T = any>(
    url: string,
    userType?: UserType,
    options: Omit<ApiRequestOptions, 'method' | 'userType'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'DELETE',
      userType
    });
  }

  /**
   * Récupère le token d'authentification pour un type d'utilisateur
   * @param userType Type d'utilisateur
   * @returns Token ou null
   */
  private getAuthToken(userType: UserType): string | null {
    if (typeof window === 'undefined') return null;

    const tokenKey = userType === 'cashier' ? 'cashier_token' : 'admin_token';
    return localStorage.getItem(tokenKey);
  }

  /**
   * Méthode utilitaire pour vérifier si une requête nécessite une authentification
   * @param url URL de la requête
   * @returns true si l'authentification est requise
   */
  public requiresAuth(url: string): boolean {
    const publicEndpoints = [
      '/admin/auth/login',
      '/cashiers/login',
      '/health',
      '/ping'
    ];

    return !publicEndpoints.some(endpoint => url.includes(endpoint));
  }

  /**
   * Méthode pour effectuer une requête de login sans vérification de token
   * @param url URL de login
   * @param credentials Identifiants de connexion
   * @returns Promise de la réponse
   */
  public async login<T = any>(
    url: string,
    credentials: { email?: string; username?: string; password: string }
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'POST',
      body: JSON.stringify(credentials),
      skipAuthCheck: true
    });
  }
}

// Export de l'instance singleton
export const apiInterceptor = ApiInterceptor.getInstance();

// Export des types pour utilisation externe
export type { ApiRequestOptions, ApiResponse };
