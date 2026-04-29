"use client";

/**
 * src/context.tsx
 *
 * The React context and Provider for Sash authentication.
 *
 * WHAT IT DOES:
 *   - Creates a SashClient instance from the config passed to <SashProvider>
 *   - On mount, calls /me to restore any existing session (page refresh resilience)
 *   - Exposes the full SashState (user, loading, all auth methods) via context
 *   - Wraps all auth methods to automatically update `user` state after success
 *
 * USAGE:
 *   Wrap your app root:
 *   ```tsx
 *   <SashProvider apiKey={process.env.NEXT_PUBLIC_SASH_API_KEY!} baseUrl="https://...">
 *     <App />
 *   </SashProvider>
 *   ```
 *
 *   Then anywhere in your tree:
 *   ```tsx
 *   const { user, login, logout } = useSash();
 *   ```
 *
 * EXPORTED:
 *   SashProvider  — the context provider component
 *   useSash       — the hook to consume the context
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { SashClient } from "./client";
import type { SashConfig, SashState, SashUser } from "./types";

// ─── Context ──────────────────────────────────────────────────────────────────

const SashContext = createContext<SashState | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export interface SashProviderProps extends SashConfig {
  children: React.ReactNode;
}

/**
 * SashProvider
 *
 * Provides the Sash authentication context to your React tree.
 * Place this at the top of your component tree (e.g. in _app.tsx or layout.tsx).
 *
 * Props:
 *   apiKey   — your project's Sash API key (use an env variable!)
 *   baseUrl  — URL of your Sash deployment (defaults to localhost:3000)
 *   children — your app's component tree
 */
export function SashProvider({
  apiKey,
  baseUrl,
  children,
}: SashProviderProps) {
  const [user, setUser] = useState<SashUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Stable client instance — recreated only if apiKey/baseUrl changes
  const client = useMemo(
    () => new SashClient(apiKey, baseUrl),
    [apiKey, baseUrl]
  );

  // Track if the component is still mounted to avoid setState after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Session restore on mount ──────────────────────────────────────────────
  // On every page load / hard refresh, call /me to restore session from cookie.
  // If the cookie is expired or doesn't exist, /me returns null and the user
  // stays logged out. This makes auth state survive page refreshes.
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const me = await client.me();
        if (!cancelled && mountedRef.current) {
          setUser(me);
        }
      } catch {
        // Non-401 errors (network down, etc.) — fail silently, stay logged out
      } finally {
        if (!cancelled && mountedRef.current) {
          setLoading(false);
        }
      }
    }

    restoreSession();
    return () => { cancelled = true; };
  }, [client]);

  // ── Auth methods ──────────────────────────────────────────────────────────

  const signup = useCallback(
    async (email: string, password: string): Promise<SashUser> => {
      const { user: newUser } = await client.signup(email, password);
      setUser(newUser);
      return newUser;
    },
    [client]
  );

  const login = useCallback(
    async (email: string, password: string): Promise<SashUser> => {
      const { user: loggedIn } = await client.login(email, password);
      setUser(loggedIn);
      return loggedIn;
    },
    [client]
  );

  const logout = useCallback(async (): Promise<void> => {
    await client.logout();
    setUser(null);
  }, [client]);

  const sendVerification = useCallback(
    async (email: string): Promise<void> => {
      await client.sendVerification(email);
    },
    [client]
  );

  const verifyEmail = useCallback(
    async (email: string, code: string): Promise<void> => {
      await client.verifyEmail(email, code);
      // Refresh user state so emailVerified updates in the UI
      const me = await client.me();
      setUser(me);
    },
    [client]
  );

  const forgotPassword = useCallback(
    async (email: string): Promise<void> => {
      await client.forgotPassword(email);
    },
    [client]
  );

  const resetPassword = useCallback(
    async (email: string, code: string, newPassword: string): Promise<void> => {
      await client.resetPassword(email, code, newPassword);
      // Session was invalidated on the server — clear local state too
      setUser(null);
    },
    [client]
  );

  // ── Context value (memoised for perf) ────────────────────────────────────
  const value = useMemo<SashState>(
    () => ({
      user,
      loading,
      signup,
      login,
      logout,
      sendVerification,
      verifyEmail,
      forgotPassword,
      resetPassword,
    }),
    [
      user,
      loading,
      signup,
      login,
      logout,
      sendVerification,
      verifyEmail,
      forgotPassword,
      resetPassword,
    ]
  );

  return <SashContext.Provider value={value}>{children}</SashContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useSash
 *
 * Returns the full Sash auth state and methods.
 * Must be used inside a <SashProvider>.
 *
 * @throws Error if called outside of SashProvider
 *
 * @example
 * function LoginButton() {
 *   const { user, login, logout } = useSash();
 *   if (user) return <button onClick={logout}>Sign Out</button>;
 *   return <button onClick={() => login("a@b.com", "pass")}>Sign In</button>;
 * }
 */
export function useSash(): SashState {
  const ctx = useContext(SashContext);
  if (!ctx) {
    throw new Error(
      "[Sash] useSash() must be used inside a <SashProvider>. " +
        "Make sure you have wrapped your app with <SashProvider apiKey={...}>."
    );
  }
  return ctx;
}
