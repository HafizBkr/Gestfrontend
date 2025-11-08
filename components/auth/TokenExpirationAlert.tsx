'use client';

import React, { useState, useEffect } from 'react';
import { UserType } from '../../utils/authService';

interface TokenExpirationAlertProps {
  timeUntilExpiration: number;
  userType: UserType;
  onExtendSession?: () => void;
  onLogout?: () => void;
}

const TokenExpirationAlert: React.FC<TokenExpirationAlertProps> = ({
  timeUntilExpiration,
  userType,
  onExtendSession,
  onLogout
}) => {
  const [showAlert, setShowAlert] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Afficher l'alerte quand il reste moins de 5 minutes (300 secondes)
  useEffect(() => {
    if (timeUntilExpiration > 0 && timeUntilExpiration <= 300 && !dismissed) {
      setShowAlert(true);
    } else {
      setShowAlert(false);
      setDismissed(false);
    }
  }, [timeUntilExpiration, dismissed]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowAlert(false);
  };

  const handleExtendSession = () => {
    if (onExtendSession) {
      onExtendSession();
    }
    handleDismiss();
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  if (!showAlert) {
    return null;
  }

  const userTypeText = userType === 'cashier' ? 'caissier' : 'administrateur';
  const alertColor = timeUntilExpiration <= 60 ? 'red' : 'yellow';

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className={`rounded-lg shadow-lg p-4 border-l-4 ${
        alertColor === 'red'
          ? 'bg-red-50 border-red-500 text-red-800'
          : 'bg-yellow-50 border-yellow-500 text-yellow-800'
      }`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className={`h-5 w-5 ${alertColor === 'red' ? 'text-red-400' : 'text-yellow-400'}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium">
              Session {userTypeText} expire bientôt
            </h3>
            <div className="mt-2 text-sm">
              <p>
                Votre session expire dans{' '}
                <span className="font-semibold">{formatTime(timeUntilExpiration)}</span>
              </p>
              <p className="mt-1 text-xs opacity-75">
                Vous serez automatiquement déconnecté(e) à l'expiration.
              </p>
            </div>
            <div className="mt-3 flex space-x-2">
              {onExtendSession && (
                <button
                  onClick={handleExtendSession}
                  className={`text-xs px-3 py-1 rounded font-medium ${
                    alertColor === 'red'
                      ? 'bg-red-100 text-red-800 hover:bg-red-200'
                      : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                  } transition-colors`}
                >
                  Prolonger la session
                </button>
              )}
              <button
                onClick={handleLogout}
                className="text-xs px-3 py-1 rounded font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Se déconnecter
              </button>
              <button
                onClick={handleDismiss}
                className="text-xs px-3 py-1 rounded font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Ignorer
              </button>
            </div>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={handleDismiss}
              className={`rounded-md inline-flex ${
                alertColor === 'red' ? 'text-red-400 hover:text-red-600' : 'text-yellow-400 hover:text-yellow-600'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                alertColor === 'red' ? 'focus:ring-red-500' : 'focus:ring-yellow-500'
              }`}
            >
              <span className="sr-only">Fermer</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div
              className={`h-1 rounded-full transition-all duration-1000 ${
                alertColor === 'red' ? 'bg-red-500' : 'bg-yellow-500'
              }`}
              style={{
                width: `${Math.max(0, Math.min(100, (timeUntilExpiration / 300) * 100))}%`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenExpirationAlert;
