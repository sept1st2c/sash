import * as react_jsx_runtime from 'react/jsx-runtime';
import React from 'react';

/**
 * src/types.ts
 *
 * All shared TypeScript types for the Sash SDK.
 * These mirror the exact shapes returned by the Sash API so consumers
 * get full type-safety when using the useSash() hook.
 */
/**
 * SashUser
 * The user object returned by /me, /login, and /signup.
 * This is what your application receives after a user authenticates.
 */
interface SashUser {
    id: string;
    email: string;
    emailVerified: boolean;
    isActive: boolean;
    createdAt: string;
}
interface AuthResponse {
    user: SashUser;
    sessionId: string;
}
interface MessageResponse {
    message: string;
}
interface ApiError {
    error: string;
}
/**
 * SashState
 * The full state managed by SashProvider and exposed via useSash().
 */
interface SashState {
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
/**
 * SashConfig
 * Options passed to <SashProvider>.
 */
interface SashConfig {
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

interface SashProviderProps extends SashConfig {
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
declare function SashProvider({ apiKey, baseUrl, children, }: SashProviderProps): react_jsx_runtime.JSX.Element;
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
declare function useSash(): SashState;

/**
 * src/client.ts
 *
 * A typed HTTP client that wraps all Sash API endpoints.
 * This is the core layer — the React hook sits on top of this.
 *
 * DESIGN DECISIONS:
 *   - No external dependencies — only uses the browser's native fetch API.
 *   - All methods throw a SashApiError on non-2xx responses with the
 *     server's error message included, so callers can surface it to the user.
 *   - The API key is sent on every request via the Authorization header.
 *   - Session cookies are set by the server (httpOnly). For non-browser
 *     environments, the sessionId from login/signup can be used instead.
 *
 * EXPORTED:
 *   SashApiError  — typed error class with status code + server message
 *   SashClient    — class with methods for all Phase 1–3 endpoints
 *   createClient  — factory function (cleaner than `new SashClient()`)
 */

/**
 * SashApiError
 * Thrown by SashClient when the API returns a non-2xx status.
 * Consumers can catch this and read .message to show users a meaningful error.
 */
declare class SashApiError extends Error {
    status: number;
    constructor(message: string, status: number);
}
declare class SashClient {
    private apiKey;
    private baseUrl;
    constructor(apiKey: string, baseUrl?: string);
    /**
     * request
     * Internal method. Sends a fetch request with the API key header,
     * parses JSON, and throws SashApiError on non-2xx responses.
     */
    private request;
    /**
     * signup
     * Creates a new user account within this project.
     * Returns the new user object and sessionId.
     */
    signup(email: string, password: string): Promise<AuthResponse>;
    /**
     * login
     * Authenticates an existing user.
     * On success, the server sets an HTTP-only session cookie automatically.
     */
    login(email: string, password: string): Promise<AuthResponse>;
    /**
     * logout
     * Destroys the current session on the server and clears the cookie.
     */
    logout(): Promise<MessageResponse>;
    /**
     * me
     * Returns the currently authenticated user.
     * Also refreshes the session TTL (sliding window).
     * Returns null if the session is expired or doesn't exist.
     */
    me(): Promise<SashUser | null>;
    /**
     * sendVerification
     * Sends a 6-digit OTP to the user's email for verification.
     */
    sendVerification(email: string): Promise<MessageResponse>;
    /**
     * verifyEmail
     * Submits the 6-digit OTP to verify the user's email address.
     */
    verifyEmail(email: string, code: string): Promise<MessageResponse>;
    /**
     * forgotPassword
     * Sends a 6-digit OTP to the user's email for password reset.
     * Always returns a success response (anti-enumeration).
     */
    forgotPassword(email: string): Promise<MessageResponse>;
    /**
     * resetPassword
     * Submits the OTP and new password to complete the reset flow.
     * Invalidates all existing sessions on success.
     */
    resetPassword(email: string, code: string, newPassword: string): Promise<MessageResponse>;
}
/**
 * createClient
 * The recommended way to create a SashClient instance.
 * Cleaner than `new SashClient(...)` for most use cases.
 *
 * @example
 * const sash = createClient({ apiKey: process.env.NEXT_PUBLIC_SASH_API_KEY! });
 */
declare function createClient(config: {
    apiKey: string;
    baseUrl?: string;
}): SashClient;

export { type ApiError, type AuthResponse, type MessageResponse, SashApiError, SashClient, type SashConfig, SashProvider, type SashProviderProps, type SashState, type SashUser, createClient, useSash };
