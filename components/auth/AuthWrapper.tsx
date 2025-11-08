'use client';

import React from 'react';
import { useAuth } from '../../app/hooks/useAuth';
import { UserType } from '../../utils/authService';
import TokenExpirationAlert from './TokenExpirationAlert';

interface AuthWrapperProps {
  userType: UserType;
  children: React.ReactNode;
  showExpirationAlert?: boolean;
  onExtendSession?: () => void;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({
  userType,
  children,
  showExpirationAlert = true,
  onExtendSession
}) => {
  const {
    isAuthenticated,
    timeUntilExpiration,
    logout,
    checkAuthStatus
  } = useAuth(userType);

  // Si pas authentifié, le hook useAuth gère déjà la redirection
  // On peut afficher un loading ou rien
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {children}

      {/* Alerte d'expiration de token */}
      {showExpirationAlert && timeUntilExpiration > 0 && (
        <TokenExpirationAlert
          timeUntilExpiration={timeUntilExpiration}
          userType={userType}
          onExtendSession={onExtendSession}
          onLogout={logout}
        />
      )}
    </div>
  );
};

export default AuthWrapper;
