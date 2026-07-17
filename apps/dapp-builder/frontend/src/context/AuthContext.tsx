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
// work so existing dev/demo flows are unaffected when VITE_DEMO_MODE=true.

import React, { createContext, useContext, useEffect, useState } from 'react';
import { setToken, getToken, clearToken, apiJSON, ApiError } from '../services/api';

export interface AuthUser {
  userId: string;
  userName: string;
  userEmail: string;
}

interface AuthContextValue {
  currentUser: AuthUser | null;
  isLoading: boolean;
  token: string | null;
  authError: string | null;
}

const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  isLoading: true,
  token: null,
  authError: null,
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

// ── Legacy query-param handoff (demo mode only) ───────────────────────────────

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
  const [authError,   setAuthError]   = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        // 1. Try to extract JWT from URL fragment (production handoff)
        const fragmentToken = extractAndConsumeToken();
        if (fragmentToken) {
          setToken(fragmentToken);
          setTokenState(fragmentToken);
        }
        // Also use any JWT stored on a prior page load (no new fragment).
        const activeToken = fragmentToken ?? getToken();
        if (!fragmentToken && activeToken) {
          setTokenState(activeToken);
        }

        // 2. Resolve user identity.
        //
        // When a JWT is present the backend /profile is ALWAYS authoritative.
        // The sessionStorage cache is never trusted for identity — a stale or
        // forged entry could claim a different user than the JWT belongs to.
        //
        // URL query params are only honored when VITE_DEMO_MODE=true AND no
        // JWT is present. In production without a JWT, currentUser stays null
        // and the sign-in gate appears.
        if (activeToken) {
          try {
            const profile = await apiJSON<{ id: string; name: string; email: string }>('/profile');
            if (!profile.id || !profile.name || !profile.email) {
              setAuthError('Your account profile is incomplete. Please contact support.');
            } else {
              const user: AuthUser = {
                userId: profile.id,
                userName: profile.name,
                userEmail: profile.email,
              };
              saveUserToSession(user);
              setCurrentUser(user);
            }
          } catch (err) {
            if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
              // Invalid or expired token — clear it so the next visit starts fresh.
              clearToken();
              try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
              // currentUser stays null; sign-in gate shows.
            } else if (err instanceof ApiError) {
              setAuthError('Server error — unable to load your profile. Please try again.');
            } else {
              setAuthError('Network error — unable to load your profile. Please check your connection.');
            }
          }
        } else {
          // No JWT: URL params only in explicit demo/dev mode.
          const isDemoMode = (import.meta.env as Record<string, string | undefined>).VITE_DEMO_MODE === 'true';
          if (isDemoMode) {
            const fromUrl = readUserFromUrl();
            if (fromUrl) {
              saveUserToSession(fromUrl);
              setCurrentUser(fromUrl);
            }
          }
          // Production without JWT: currentUser stays null; sign-in gate shows.
        }
      } finally {
        setIsLoading(false);
      }
    }

    void init();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, token, authError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
