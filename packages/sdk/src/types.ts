/**
 * src/types.ts
 *
 * All shared TypeScript types for the Sash SDK.
 * These mirror the exact shapes returned by the Sash API so consumers
 * get full type-safety when using the useSash() hook.
 */

// ─── API User ─────────────────────────────────────────────────────────────────

/**
 * SashUser
 * The user object returned by /me, /login, and /signup.
 * This is what your application receives after a user authenticates.
 */
export interface SashUser {
  id: string;
  email: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string; // ISO date string
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface AuthResponse {
  user: SashUser;
  sessionId: string;
}

export interface MessageResponse {
  message: string;
}

export interface ApiError {
  error: string;
}

// ─── Hook State ───────────────────────────────────────────────────────────────

/**
 * SashState
 * The full state managed by SashProvider and exposed via useSash().
 */
export interface SashState {
  /** The currently authenticated user, or null if not logged in. */
  user: SashUser | null;
  /** True while the provider is restoring session on mount. */
  loading: boolean;
  /** Sign up a new user. Returns the user on success. */
  signup: (email: string, password: string) => Promise<SashUser>;
  /** Log in an existing user. Returns the user on success. */
  login: (email: string, password: string) => Promise<SashUser>;
  /** Log out the current user and clear the session. */
  logout: () => Promise<void>;
  /** Request an OTP email for email verification. */
  sendVerification: (email: string) => Promise<void>;
  /** Submit the 6-digit OTP to verify an email address. */
  verifyEmail: (email: string, code: string) => Promise<void>;
  /** Request an OTP email for password reset. */
  forgotPassword: (email: string) => Promise<void>;
  /** Complete password reset with OTP + new password. */
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
}

// ─── Provider Config ──────────────────────────────────────────────────────────

/**
 * SashConfig
 * Options passed to <SashProvider>.
 */
export interface SashConfig {
  /**
   * Your project's Sash API key (sash_live_...).
   * This is sent as `Authorization: Bearer <apiKey>` on every request.
   * IMPORTANT: Use an environment variable — never hardcode this in client code.
   */
  apiKey: string;
  /**
   * The base URL of your Sash deployment.
   * Defaults to "http://localhost:3000" for local development.
   */
  baseUrl?: string;
}
