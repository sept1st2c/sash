"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  SashApiError: () => SashApiError,
  SashClient: () => SashClient,
  SashProvider: () => SashProvider,
  createClient: () => createClient,
  useSash: () => useSash
});
module.exports = __toCommonJS(index_exports);

// src/context.tsx
var import_react = require("react");

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
var import_jsx_runtime = require("react/jsx-runtime");
var SashContext = (0, import_react.createContext)(null);
function SashProvider({
  apiKey,
  baseUrl,
  children
}) {
  const [user, setUser] = (0, import_react.useState)(null);
  const [loading, setLoading] = (0, import_react.useState)(true);
  const client = (0, import_react.useMemo)(
    () => new SashClient(apiKey, baseUrl),
    [apiKey, baseUrl]
  );
  const mountedRef = (0, import_react.useRef)(true);
  (0, import_react.useEffect)(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  (0, import_react.useEffect)(() => {
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
  const signup = (0, import_react.useCallback)(
    async (email, password) => {
      const { user: newUser } = await client.signup(email, password);
      setUser(newUser);
      return newUser;
    },
    [client]
  );
  const login = (0, import_react.useCallback)(
    async (email, password) => {
      const { user: loggedIn } = await client.login(email, password);
      setUser(loggedIn);
      return loggedIn;
    },
    [client]
  );
  const logout = (0, import_react.useCallback)(async () => {
    await client.logout();
    setUser(null);
  }, [client]);
  const sendVerification = (0, import_react.useCallback)(
    async (email) => {
      await client.sendVerification(email);
    },
    [client]
  );
  const verifyEmail = (0, import_react.useCallback)(
    async (email, code) => {
      await client.verifyEmail(email, code);
      const me = await client.me();
      setUser(me);
    },
    [client]
  );
  const forgotPassword = (0, import_react.useCallback)(
    async (email) => {
      await client.forgotPassword(email);
    },
    [client]
  );
  const resetPassword = (0, import_react.useCallback)(
    async (email, code, newPassword) => {
      await client.resetPassword(email, code, newPassword);
      setUser(null);
    },
    [client]
  );
  const value = (0, import_react.useMemo)(
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
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SashContext.Provider, { value, children });
}
function useSash() {
  const ctx = (0, import_react.useContext)(SashContext);
  if (!ctx) {
    throw new Error(
      "[Sash] useSash() must be used inside a <SashProvider>. Make sure you have wrapped your app with <SashProvider apiKey={...}>."
    );
  }
  return ctx;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SashApiError,
  SashClient,
  SashProvider,
  createClient,
  useSash
});
