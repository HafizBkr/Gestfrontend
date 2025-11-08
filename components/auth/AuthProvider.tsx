'use client';

import React, { useEffect, createContext, useContext } from 'react';
import { authService } from '../../utils/authService';

interface AuthContextType {
  checkAuthStatus: () => void;
  logout: (userType: 'cashier' | 'admin') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  useEffect(() => {
    // Initialiser le service d'authentification au montage du composant
    // Le service démarre automatiquement la vérification périodique
    console.log('AuthProvider: Service d\'authentification initialisé');

    // Effectuer une vérification immédiate
    authService.checkNow();

    // Nettoyage lors du démontage (optionnel car c'est un singleton)
    return () => {
      // Le service continue de fonctionner même après le démontage du provider
      // car il s'agit d'un singleton global
    };
  }, []);

  const checkAuthStatus = () => {
    authService.checkNow();
  };

  const logout = (userType: 'cashier' | 'admin') => {
    authService.logout(userType);
  };

  const contextValue: AuthContextType = {
    checkAuthStatus,
    logout
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
