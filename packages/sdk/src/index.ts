/**
 * src/index.ts
 *
 * Public API of the @sash/sdk package.
 *
 * CONSUMERS IMPORT FROM HERE:
 *   import { SashProvider, useSash, createClient, SashApiError } from "@sash/sdk";
 *
 * WHAT'S EXPORTED:
 *   SashProvider    — React context provider, wrap your app with this
 *   useSash         — hook to get user state + all auth methods
 *   createClient    — low-level HTTP client (for non-React / server use)
 *   SashApiError    — typed error class (check .status and .message)
 *   SashClient      — the client class (if you need to instantiate directly)
 *
 *   Types:
 *   SashUser        — shape of the authenticated user object
 *   SashState       — full shape of the useSash() return value
 *   SashConfig      — props accepted by <SashProvider>
 *   AuthResponse    — shape of login/signup API response
 *   MessageResponse — shape of simple success responses
 */

// ── Context + Hook ────────────────────────────────────────────────────────────
export { SashProvider, useSash } from "./context";
export type { SashProviderProps } from "./context";

// ── Low-level client ──────────────────────────────────────────────────────────
export { SashClient, SashApiError, createClient } from "./client";

// ── Types ─────────────────────────────────────────────────────────────────────
export type {
  SashUser,
  SashState,
  SashConfig,
  AuthResponse,
  MessageResponse,
  ApiError,
} from "./types";
