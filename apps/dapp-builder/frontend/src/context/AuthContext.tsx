// Auth context for DApp Builder.
//
// Token handoff from DAppGenius:
//   DAppGenius opens the builder with the JWT in the URL fragment:
//     https://app-builder-sqqz.onrender.com#token=<JWT>
//
// The fragment is never sent to the server (browser security), so it is safe
// to transport the token this way. On load we:
//   1. Read window.location.hash for #token=...
//   2. Store it in sessionStorage under DAPPBUILDER_TOKEN_KEY
//   3. Immediately remove it from the displayed URL via history.replaceState
//
// Fallback for local dev: URL query params (?userId=...&userEmail=...) still
// work so existing dev/demo flows are unaffected.

import React, { createContext, useContext, useEffect, useState } from 'react';
import { setToken } from '../services/api';

export interface AuthUser {
  userId: string;
  userName: string;
  userEmail: string;
}

interface AuthContextValue {
  currentUser: AuthUser | null;
  isLoading: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  isLoading: true,
  token: null,
});

const SESSION_KEY = 'dappbuilder:auth_user';

// ── Fragment token handoff ────────────────────────────────────────────────────

function extractAndConsumeToken(): string | null {
  const hash = window.location.hash;
  if (!hash.startsWith('#')) return null;

  const params = new URLSearchParams(hash.slice(1));
  const token = params.get('token');
  if (!token) return null;

  // Remove token from hash immediately so it doesn't stay in browser history.
  // Remove ALL hash params that we consumed; keep any non-token ones.
  params.delete('token');
  const remaining = params.toString();
  const newUrl = window.location.pathname + window.location.search + (remaining ? '#' + remaining : '');
  window.history.replaceState(null, '', newUrl);

  return token;
}

// ── Legacy query-param handoff (dev/demo only) ────────────────────────────────

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
    // sessionStorage unavailable — silently ignore
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading,   setIsLoading]   = useState(true);
  const [token,       setTokenState]  = useState<string | null>(null);

  useEffect(() => {
    // 1. Try to extract JWT from URL fragment (production handoff)
    const fragmentToken = extractAndConsumeToken();
    if (fragmentToken) {
      setToken(fragmentToken);
      setTokenState(fragmentToken);
    }

    // 2. Resolve user identity (legacy query params → sessionStorage)
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
    <AuthContext.Provider value={{ currentUser, isLoading, token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
