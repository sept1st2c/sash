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

import type {
  SashUser,
  AuthResponse,
  MessageResponse,
  ApiError,
} from "./types";

// ─── Error Class ──────────────────────────────────────────────────────────────

/**
 * SashApiError
 * Thrown by SashClient when the API returns a non-2xx status.
 * Consumers can catch this and read .message to show users a meaningful error.
 */
export class SashApiError extends Error {
  public status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "SashApiError";
    this.status = status;
  }
}

// ─── Client ───────────────────────────────────────────────────────────────────

export class SashClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl = "http://localhost:3000") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, ""); // strip trailing slash
  }

  // ─── Internal fetch helper ─────────────────────────────────────────────────

  /**
   * request
   * Internal method. Sends a fetch request with the API key header,
   * parses JSON, and throws SashApiError on non-2xx responses.
   */
  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    const res = await fetch(url, {
      ...options,
      credentials: "include", // include cookies for browser session
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    const data = (await res.json()) as T | ApiError;

    if (!res.ok) {
      const message =
        (data as ApiError).error ?? `HTTP error ${res.status}`;
      throw new SashApiError(message, res.status);
    }

    return data as T;
  }

  // ─── Auth endpoints ────────────────────────────────────────────────────────

  /**
   * signup
   * Creates a new user account within this project.
   * Returns the new user object and sessionId.
   */
  async signup(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/api/v1/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  /**
   * login
   * Authenticates an existing user.
   * On success, the server sets an HTTP-only session cookie automatically.
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/api/v1/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  /**
   * logout
   * Destroys the current session on the server and clears the cookie.
   */
  async logout(): Promise<MessageResponse> {
    return this.request<MessageResponse>("/api/v1/logout", {
      method: "POST",
    });
  }

  /**
   * me
   * Returns the currently authenticated user.
   * Also refreshes the session TTL (sliding window).
   * Returns null if the session is expired or doesn't exist.
   */
  async me(): Promise<SashUser | null> {
    try {
      const data = await this.request<{ user: SashUser }>("/api/v1/me", {
        method: "GET",
      });
      return data.user;
    } catch (err) {
      // 401 means unauthenticated — not an error worth throwing
      if (err instanceof SashApiError && err.status === 401) return null;
      throw err;
    }
  }

  // ─── Email verification endpoints ──────────────────────────────────────────

  /**
   * sendVerification
   * Sends a 6-digit OTP to the user's email for verification.
   */
  async sendVerification(email: string): Promise<MessageResponse> {
    return this.request<MessageResponse>("/api/v1/send-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  /**
   * verifyEmail
   * Submits the 6-digit OTP to verify the user's email address.
   */
  async verifyEmail(email: string, code: string): Promise<MessageResponse> {
    return this.request<MessageResponse>("/api/v1/verify-email", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    });
  }

  // ─── Password reset endpoints ──────────────────────────────────────────────

  /**
   * forgotPassword
   * Sends a 6-digit OTP to the user's email for password reset.
   * Always returns a success response (anti-enumeration).
   */
  async forgotPassword(email: string): Promise<MessageResponse> {
    return this.request<MessageResponse>("/api/v1/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  /**
   * resetPassword
   * Submits the OTP and new password to complete the reset flow.
   * Invalidates all existing sessions on success.
   */
  async resetPassword(
    email: string,
    code: string,
    newPassword: string
  ): Promise<MessageResponse> {
    return this.request<MessageResponse>("/api/v1/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, code, newPassword }),
    });
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * createClient
 * The recommended way to create a SashClient instance.
 * Cleaner than `new SashClient(...)` for most use cases.
 *
 * @example
 * const sash = createClient({ apiKey: process.env.NEXT_PUBLIC_SASH_API_KEY! });
 */
export function createClient(config: {
  apiKey: string;
  baseUrl?: string;
}): SashClient {
  return new SashClient(config.apiKey, config.baseUrl);
}
