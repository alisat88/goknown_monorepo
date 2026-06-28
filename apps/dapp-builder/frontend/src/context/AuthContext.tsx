// Auth context for DApp Builder.
//
// DAppGenius opens the builder with the authenticated user's identity in the URL:
//   ?userId=<id>&userName=<name>&userEmail=<email>
//
// On load, URL params are read and stored in sessionStorage so navigation within
// the same tab keeps the user context without repeating the handoff.
//
// If neither URL params nor sessionStorage are present, currentUser is null —
// the builder shows a demo identity selector but never defaults to any named user.
//
// TODO (production): Replace URL params with a signed JWT or server-side session
// cookie so the handoff is tamper-proof.

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface AuthUser {
  userId: string;
  userName: string;
  userEmail: string;
}

interface AuthContextValue {
  currentUser: AuthUser | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ currentUser: null, isLoading: true });

const SESSION_KEY = 'dappbuilder:auth_user';

function readUserFromUrl(): AuthUser | null {
  const params = new URLSearchParams(window.location.search);
  const userId    = params.get('userId');
  const userName  = params.get('userName');
  const userEmail = params.get('userEmail');
  if (userId && userName && userEmail) {
    return { userId, userName, userEmail };
  }
  return null;
}

function readUserFromSession(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function saveUserToSession(user: AuthUser): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch {
    // sessionStorage unavailable (e.g. restricted private browsing) — silently ignore
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading,   setIsLoading]   = useState(true);

  useEffect(() => {
    const fromUrl = readUserFromUrl();
    if (fromUrl) {
      saveUserToSession(fromUrl);
      setCurrentUser(fromUrl);
    } else {
      setCurrentUser(readUserFromSession());
    }
    setIsLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
