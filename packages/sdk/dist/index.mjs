// src/context.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

// src/client.ts
var SashApiError = class extends Error {
  constructor(message, status) {
    super(message);
    this.name = "SashApiError";
    this.status = status;
  }
};
var SashClient = class {
  constructor(apiKey, baseUrl = "http://localhost:3000") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }
  // ─── Internal fetch helper ─────────────────────────────────────────────────
  /**
   * request
   * Internal method. Sends a fetch request with the API key header,
   * parses JSON, and throws SashApiError on non-2xx responses.
   */
  async request(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      ...options,
      credentials: "include",
      // include cookies for browser session
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...options.headers
      }
    });
    const data = await res.json();
    if (!res.ok) {
      const message = data.error ?? `HTTP error ${res.status}`;
      throw new SashApiError(message, res.status);
    }
    return data;
  }
  // ─── Auth endpoints ────────────────────────────────────────────────────────
  /**
   * signup
   * Creates a new user account within this project.
   * Returns the new user object and sessionId.
   */
  async signup(email, password) {
    return this.request("/api/v1/signup", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  }
  /**
   * login
   * Authenticates an existing user.
   * On success, the server sets an HTTP-only session cookie automatically.
   */
  async login(email, password) {
    return this.request("/api/v1/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  }
  /**
   * logout
   * Destroys the current session on the server and clears the cookie.
   */
  async logout() {
    return this.request("/api/v1/logout", {
      method: "POST"
    });
  }
  /**
   * me
   * Returns the currently authenticated user.
   * Also refreshes the session TTL (sliding window).
   * Returns null if the session is expired or doesn't exist.
   */
  async me() {
    try {
      const data = await this.request("/api/v1/me", {
        method: "GET"
      });
      return data.user;
    } catch (err) {
      if (err instanceof SashApiError && err.status === 401) return null;
      throw err;
    }
  }
  // ─── Email verification endpoints ──────────────────────────────────────────
  /**
   * sendVerification
   * Sends a 6-digit OTP to the user's email for verification.
   */
  async sendVerification(email) {
    return this.request("/api/v1/send-verification", {
      method: "POST",
      body: JSON.stringify({ email })
    });
  }
  /**
   * verifyEmail
   * Submits the 6-digit OTP to verify the user's email address.
   */
  async verifyEmail(email, code) {
    return this.request("/api/v1/verify-email", {
      method: "POST",
      body: JSON.stringify({ email, code })
    });
  }
  // ─── Password reset endpoints ──────────────────────────────────────────────
  /**
   * forgotPassword
   * Sends a 6-digit OTP to the user's email for password reset.
   * Always returns a success response (anti-enumeration).
   */
  async forgotPassword(email) {
    return this.request("/api/v1/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email })
    });
  }
  /**
   * resetPassword
   * Submits the OTP and new password to complete the reset flow.
   * Invalidates all existing sessions on success.
   */
  async resetPassword(email, code, newPassword) {
    return this.request("/api/v1/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, code, newPassword })
    });
  }
};
function createClient(config) {
  return new SashClient(config.apiKey, config.baseUrl);
}

// src/context.tsx
import { jsx } from "react/jsx-runtime";
var SashContext = createContext(null);
function SashProvider({
  apiKey,
  baseUrl,
  children
}) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const client = useMemo(
    () => new SashClient(apiKey, baseUrl),
    [apiKey, baseUrl]
  );
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    async function restoreSession() {
      try {
        const me = await client.me();
        if (!cancelled && mountedRef.current) {
          setUser(me);
        }
      } catch {
      } finally {
        if (!cancelled && mountedRef.current) {
          setLoading(false);
        }
      }
    }
    restoreSession();
    return () => {
      cancelled = true;
    };
  }, [client]);
  const signup = useCallback(
    async (email, password) => {
      const { user: newUser } = await client.signup(email, password);
      setUser(newUser);
      return newUser;
    },
    [client]
  );
  const login = useCallback(
    async (email, password) => {
      const { user: loggedIn } = await client.login(email, password);
      setUser(loggedIn);
      return loggedIn;
    },
    [client]
  );
  const logout = useCallback(async () => {
    await client.logout();
    setUser(null);
  }, [client]);
  const sendVerification = useCallback(
    async (email) => {
      await client.sendVerification(email);
    },
    [client]
  );
  const verifyEmail = useCallback(
    async (email, code) => {
      await client.verifyEmail(email, code);
      const me = await client.me();
      setUser(me);
    },
    [client]
  );
  const forgotPassword = useCallback(
    async (email) => {
      await client.forgotPassword(email);
    },
    [client]
  );
  const resetPassword = useCallback(
    async (email, code, newPassword) => {
      await client.resetPassword(email, code, newPassword);
      setUser(null);
    },
    [client]
  );
  const value = useMemo(
    () => ({
      user,
      loading,
      signup,
      login,
      logout,
      sendVerification,
      verifyEmail,
      forgotPassword,
      resetPassword
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
      resetPassword
    ]
  );
  return /* @__PURE__ */ jsx(SashContext.Provider, { value, children });
}
function useSash() {
  const ctx = useContext(SashContext);
  if (!ctx) {
    throw new Error(
      "[Sash] useSash() must be used inside a <SashProvider>. Make sure you have wrapped your app with <SashProvider apiKey={...}>."
    );
  }
  return ctx;
}
export {
  SashApiError,
  SashClient,
  SashProvider,
  createClient,
  useSash
};
