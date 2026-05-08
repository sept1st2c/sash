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
    const text = await res.text();
    let data = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: text };
      }
    }
    if (!res.ok) {
      const parsedData = data;
      const message = parsedData.error ?? `HTTP error ${res.status}: ${res.statusText}`;
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

// #style-inject:#style-inject
function styleInject(css, { insertAt } = {}) {
  if (!css || typeof document === "undefined") return;
  const head = document.head || document.getElementsByTagName("head")[0];
  const style = document.createElement("style");
  style.type = "text/css";
  if (insertAt === "top") {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }
  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

// src/index.css
styleInject(":root {\n  --sash-brand: #6366f1;\n  --sash-brand-hover: #4f46e5;\n  --sash-bg-surface: #ffffff;\n  --sash-bg-subtle: #f9fafb;\n  --sash-border: #e5e7eb;\n  --sash-border-focus: #6366f1;\n  --sash-text-primary: #111827;\n  --sash-text-secondary: #4b5563;\n  --sash-text-muted: #9ca3af;\n  --sash-danger: #ef4444;\n  --sash-danger-bg: #fef2f2;\n}\n@media (prefers-color-scheme: dark) {\n  :root {\n    --sash-bg-surface: #0a0a0a;\n    --sash-bg-subtle: #171717;\n    --sash-border: #262626;\n    --sash-text-primary: #f9fafb;\n    --sash-text-secondary: #a1a1aa;\n    --sash-danger-bg: #450a0a;\n  }\n}\n.sash-card {\n  width: 100%;\n  max-width: 400px;\n  background-color: var(--sash-bg-surface);\n  border: 1px solid var(--sash-border);\n  border-radius: 16px;\n  padding: 32px;\n  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);\n  font-family:\n    system-ui,\n    -apple-system,\n    sans-serif;\n  margin: 0 auto;\n}\n.sash-card-header {\n  margin-bottom: 24px;\n  text-align: center;\n}\n.sash-card-title {\n  font-size: 24px;\n  font-weight: 700;\n  color: var(--sash-text-primary);\n  margin: 0 0 8px 0;\n}\n.sash-card-subtitle {\n  font-size: 14px;\n  color: var(--sash-text-secondary);\n  margin: 0;\n}\n.sash-form-group {\n  margin-bottom: 16px;\n}\n.sash-label {\n  display: block;\n  font-size: 13px;\n  font-weight: 500;\n  color: var(--sash-text-primary);\n  margin-bottom: 6px;\n}\n.sash-input {\n  width: 100%;\n  box-sizing: border-box;\n  padding: 10px 14px;\n  background-color: var(--sash-bg-surface);\n  border: 1px solid var(--sash-border);\n  border-radius: 8px;\n  font-size: 14px;\n  color: var(--sash-text-primary);\n  transition: border-color 0.15s ease;\n  outline: none;\n}\n.sash-input:focus {\n  border-color: var(--sash-border-focus);\n  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);\n}\n.sash-input:disabled {\n  background-color: var(--sash-bg-subtle);\n  color: var(--sash-text-muted);\n  cursor: not-allowed;\n}\n.sash-button {\n  width: 100%;\n  padding: 10px 16px;\n  background-color: var(--sash-brand);\n  color: white;\n  border: none;\n  border-radius: 8px;\n  font-size: 14px;\n  font-weight: 600;\n  cursor: pointer;\n  transition: all 0.15s ease;\n}\n.sash-button:hover:not(:disabled) {\n  background-color: var(--sash-brand-hover);\n  transform: translateY(-1px);\n}\n.sash-button:disabled {\n  opacity: 0.7;\n  cursor: not-allowed;\n}\n.sash-error {\n  background-color: var(--sash-danger-bg);\n  border: 1px solid var(--sash-danger);\n  color: var(--sash-danger);\n  padding: 10px 14px;\n  border-radius: 8px;\n  font-size: 13px;\n  margin-bottom: 16px;\n}\n.sash-footer {\n  margin-top: 24px;\n  text-align: center;\n  font-size: 13px;\n  color: var(--sash-text-secondary);\n}\n.sash-link {\n  color: var(--sash-brand);\n  text-decoration: none;\n  font-weight: 500;\n  cursor: pointer;\n}\n.sash-link:hover {\n  text-decoration: underline;\n}\n.sash-otp-container {\n  display: flex;\n  gap: 12px;\n  justify-content: center;\n  margin-bottom: 24px;\n}\n.sash-otp-input {\n  width: 40px;\n  height: 48px;\n  text-align: center;\n  font-size: 20px;\n  font-weight: 600;\n  border: 1px solid var(--sash-border);\n  border-radius: 8px;\n  background-color: var(--sash-bg-surface);\n  color: var(--sash-text-primary);\n  outline: none;\n  transition: border-color 0.15s ease;\n}\n.sash-otp-input:focus {\n  border-color: var(--sash-border-focus);\n}\n");

// src/components/SignIn.tsx
import { useState as useState2 } from "react";
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
function SignIn({ subtitle = "to continue to your app", onSuccess, redirectUrl, onForgotPassword }) {
  const { login } = useSash();
  const [email, setEmail] = useState2("");
  const [password, setPassword] = useState2("");
  const [error, setError] = useState2("");
  const [isLoading, setIsLoading] = useState2(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login(email, password);
      if (onSuccess) {
        onSuccess();
      }
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Failed to sign in. Please check your credentials.");
      } else {
        setError("Failed to sign in. Please check your credentials.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "sash-card", children: [
    /* @__PURE__ */ jsxs("div", { className: "sash-card-header", children: [
      /* @__PURE__ */ jsx2("h2", { className: "sash-card-title", children: "Sign in" }),
      /* @__PURE__ */ jsx2("p", { className: "sash-card-subtitle", children: subtitle })
    ] }),
    error && /* @__PURE__ */ jsx2("div", { className: "sash-error", children: error }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, children: [
      /* @__PURE__ */ jsxs("div", { className: "sash-form-group", children: [
        /* @__PURE__ */ jsx2("label", { className: "sash-label", htmlFor: "sash-email", children: "Email address" }),
        /* @__PURE__ */ jsx2(
          "input",
          {
            id: "sash-email",
            type: "email",
            className: "sash-input",
            value: email,
            onChange: (e) => setEmail(e.target.value),
            disabled: isLoading,
            required: true,
            autoComplete: "email",
            placeholder: "you@example.com"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "sash-form-group", children: [
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }, children: [
          /* @__PURE__ */ jsx2("label", { className: "sash-label", htmlFor: "sash-password", style: { marginBottom: 0 }, children: "Password" }),
          onForgotPassword && /* @__PURE__ */ jsx2(
            "button",
            {
              type: "button",
              className: "sash-link",
              onClick: onForgotPassword,
              style: { background: "none", border: "none", fontSize: "12px", padding: 0 },
              tabIndex: -1,
              children: "Forgot password?"
            }
          )
        ] }),
        /* @__PURE__ */ jsx2(
          "input",
          {
            id: "sash-password",
            type: "password",
            className: "sash-input",
            value: password,
            onChange: (e) => setPassword(e.target.value),
            disabled: isLoading,
            required: true,
            autoComplete: "current-password"
          }
        )
      ] }),
      /* @__PURE__ */ jsx2("button", { type: "submit", className: "sash-button", disabled: isLoading, children: isLoading ? "Signing in..." : "Continue" })
    ] })
  ] });
}

// src/components/SignUp.tsx
import { useState as useState3, useRef as useRef2 } from "react";
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
function SignUp({ subtitle = "to continue to your app", onSuccess, redirectUrl }) {
  const { signup, sendVerification, verifyEmail } = useSash();
  const [step, setStep] = useState3("form");
  const [email, setEmail] = useState3("");
  const [password, setPassword] = useState3("");
  const [otp, setOtp] = useState3(["", "", "", "", "", ""]);
  const [error, setError] = useState3("");
  const [isLoading, setIsLoading] = useState3(false);
  const otpRefs = useRef2([]);
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await signup(email, password);
      await sendVerification(email);
      setStep("verify");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Failed to create account.");
      } else {
        setError("Failed to create account.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    if (value.length > 1) {
      const chars = value.split("").slice(0, 6);
      chars.forEach((c, i) => {
        if (index + i < 6) newOtp[index + i] = c;
      });
      setOtp(newOtp);
      const nextEmpty = newOtp.findIndex((v) => v === "");
      if (nextEmpty !== -1 && otpRefs.current[nextEmpty]) {
        otpRefs.current[nextEmpty]?.focus();
      } else if (otpRefs.current[5]) {
        otpRefs.current[5]?.focus();
      }
      return;
    }
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5 && otpRefs.current[index + 1]) {
      otpRefs.current[index + 1]?.focus();
    }
  };
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      await verifyEmail(email, code);
      if (onSuccess) onSuccess();
      if (redirectUrl) window.location.href = redirectUrl;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Verification failed. Please try again.");
      } else {
        setError("Verification failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  if (step === "verify") {
    return /* @__PURE__ */ jsxs2("div", { className: "sash-card", children: [
      /* @__PURE__ */ jsxs2("div", { className: "sash-card-header", children: [
        /* @__PURE__ */ jsx3("h2", { className: "sash-card-title", children: "Check your email" }),
        /* @__PURE__ */ jsxs2("p", { className: "sash-card-subtitle", children: [
          "We sent a 6-digit code to ",
          /* @__PURE__ */ jsx3("strong", { children: email })
        ] })
      ] }),
      error && /* @__PURE__ */ jsx3("div", { className: "sash-error", children: error }),
      /* @__PURE__ */ jsxs2("form", { onSubmit: handleVerifySubmit, children: [
        /* @__PURE__ */ jsx3("div", { className: "sash-otp-container", children: otp.map((digit, i) => /* @__PURE__ */ jsx3(
          "input",
          {
            ref: (el) => otpRefs.current[i] = el,
            type: "text",
            inputMode: "numeric",
            maxLength: 6,
            className: "sash-otp-input",
            value: digit,
            onChange: (e) => handleOtpChange(i, e.target.value),
            onKeyDown: (e) => handleOtpKeyDown(i, e),
            disabled: isLoading
          },
          i
        )) }),
        /* @__PURE__ */ jsx3("button", { type: "submit", className: "sash-button", disabled: isLoading || otp.join("").length !== 6, children: isLoading ? "Verifying..." : "Verify email" })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs2("div", { className: "sash-card", children: [
    /* @__PURE__ */ jsxs2("div", { className: "sash-card-header", children: [
      /* @__PURE__ */ jsx3("h2", { className: "sash-card-title", children: "Create an account" }),
      /* @__PURE__ */ jsx3("p", { className: "sash-card-subtitle", children: subtitle })
    ] }),
    error && /* @__PURE__ */ jsx3("div", { className: "sash-error", children: error }),
    /* @__PURE__ */ jsxs2("form", { onSubmit: handleSignupSubmit, children: [
      /* @__PURE__ */ jsxs2("div", { className: "sash-form-group", children: [
        /* @__PURE__ */ jsx3("label", { className: "sash-label", htmlFor: "sash-email", children: "Email address" }),
        /* @__PURE__ */ jsx3(
          "input",
          {
            id: "sash-email",
            type: "email",
            className: "sash-input",
            value: email,
            onChange: (e) => setEmail(e.target.value),
            disabled: isLoading,
            required: true,
            autoComplete: "email",
            placeholder: "you@example.com"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs2("div", { className: "sash-form-group", children: [
        /* @__PURE__ */ jsx3("label", { className: "sash-label", htmlFor: "sash-password", children: "Password" }),
        /* @__PURE__ */ jsx3(
          "input",
          {
            id: "sash-password",
            type: "password",
            className: "sash-input",
            value: password,
            onChange: (e) => setPassword(e.target.value),
            disabled: isLoading,
            required: true,
            autoComplete: "new-password",
            placeholder: "Must be at least 8 characters"
          }
        )
      ] }),
      /* @__PURE__ */ jsx3("button", { type: "submit", className: "sash-button", disabled: isLoading, children: isLoading ? "Creating account..." : "Continue" })
    ] })
  ] });
}

// src/components/ForgotPassword.tsx
import { useState as useState4, useRef as useRef3 } from "react";
import { jsx as jsx4, jsxs as jsxs3 } from "react/jsx-runtime";
function ForgotPassword({ subtitle = "Reset your password", onSuccess, onBackToSignIn }) {
  const { forgotPassword, resetPassword } = useSash();
  const [step, setStep] = useState4("email");
  const [email, setEmail] = useState4("");
  const [newPassword, setNewPassword] = useState4("");
  const [otp, setOtp] = useState4(["", "", "", "", "", ""]);
  const [error, setError] = useState4("");
  const [isLoading, setIsLoading] = useState4(false);
  const otpRefs = useRef3([]);
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await forgotPassword(email);
      setStep("reset");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Failed to request reset code.");
      } else {
        setError("Failed to request reset code.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    if (value.length > 1) {
      const chars = value.split("").slice(0, 6);
      chars.forEach((c, i) => {
        if (index + i < 6) newOtp[index + i] = c;
      });
      setOtp(newOtp);
      const nextEmpty = newOtp.findIndex((v) => v === "");
      if (nextEmpty !== -1 && otpRefs.current[nextEmpty]) {
        otpRefs.current[nextEmpty]?.focus();
      } else if (otpRefs.current[5]) {
        otpRefs.current[5]?.focus();
      }
      return;
    }
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5 && otpRefs.current[index + 1]) {
      otpRefs.current[index + 1]?.focus();
    }
  };
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      await resetPassword(email, code, newPassword);
      if (onSuccess) onSuccess();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Failed to reset password. Please check the code.");
      } else {
        setError("Failed to reset password. Please check the code.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  if (step === "reset") {
    return /* @__PURE__ */ jsxs3("div", { className: "sash-card", children: [
      /* @__PURE__ */ jsxs3("div", { className: "sash-card-header", children: [
        /* @__PURE__ */ jsx4("h2", { className: "sash-card-title", children: "Check your email" }),
        /* @__PURE__ */ jsxs3("p", { className: "sash-card-subtitle", children: [
          "We sent a 6-digit reset code to ",
          /* @__PURE__ */ jsx4("strong", { children: email })
        ] })
      ] }),
      error && /* @__PURE__ */ jsx4("div", { className: "sash-error", children: error }),
      /* @__PURE__ */ jsxs3("form", { onSubmit: handleResetSubmit, children: [
        /* @__PURE__ */ jsx4("div", { className: "sash-otp-container", children: otp.map((digit, i) => /* @__PURE__ */ jsx4(
          "input",
          {
            ref: (el) => otpRefs.current[i] = el,
            type: "text",
            inputMode: "numeric",
            maxLength: 6,
            className: "sash-otp-input",
            value: digit,
            onChange: (e) => handleOtpChange(i, e.target.value),
            onKeyDown: (e) => handleOtpKeyDown(i, e),
            disabled: isLoading
          },
          i
        )) }),
        /* @__PURE__ */ jsxs3("div", { className: "sash-form-group", children: [
          /* @__PURE__ */ jsx4("label", { className: "sash-label", htmlFor: "sash-new-password", children: "New Password" }),
          /* @__PURE__ */ jsx4(
            "input",
            {
              id: "sash-new-password",
              type: "password",
              className: "sash-input",
              value: newPassword,
              onChange: (e) => setNewPassword(e.target.value),
              disabled: isLoading,
              required: true,
              autoComplete: "new-password",
              placeholder: "Must be at least 8 characters"
            }
          )
        ] }),
        /* @__PURE__ */ jsx4("button", { type: "submit", className: "sash-button", disabled: isLoading || otp.join("").length !== 6, children: isLoading ? "Saving..." : "Save New Password" })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs3("div", { className: "sash-card", children: [
    /* @__PURE__ */ jsxs3("div", { className: "sash-card-header", children: [
      /* @__PURE__ */ jsx4("h2", { className: "sash-card-title", children: "Reset password" }),
      /* @__PURE__ */ jsx4("p", { className: "sash-card-subtitle", children: subtitle })
    ] }),
    error && /* @__PURE__ */ jsx4("div", { className: "sash-error", children: error }),
    /* @__PURE__ */ jsxs3("form", { onSubmit: handleEmailSubmit, children: [
      /* @__PURE__ */ jsxs3("div", { className: "sash-form-group", children: [
        /* @__PURE__ */ jsx4("label", { className: "sash-label", htmlFor: "sash-forgot-email", children: "Email address" }),
        /* @__PURE__ */ jsx4(
          "input",
          {
            id: "sash-forgot-email",
            type: "email",
            className: "sash-input",
            value: email,
            onChange: (e) => setEmail(e.target.value),
            disabled: isLoading,
            required: true,
            autoComplete: "email",
            placeholder: "you@example.com"
          }
        )
      ] }),
      /* @__PURE__ */ jsx4("button", { type: "submit", className: "sash-button", disabled: isLoading, children: isLoading ? "Sending code..." : "Send Reset Code" })
    ] }),
    onBackToSignIn && /* @__PURE__ */ jsx4("div", { className: "sash-footer", children: /* @__PURE__ */ jsx4("button", { className: "sash-link", onClick: onBackToSignIn, style: { background: "none", border: "none", fontSize: "13px" }, children: "\u2190 Back to sign in" }) })
  ] });
}
export {
  ForgotPassword,
  SashApiError,
  SashClient,
  SashProvider,
  SignIn,
  SignUp,
  createClient,
  useSash
};
