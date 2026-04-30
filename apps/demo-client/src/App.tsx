import { useState } from "react";
import { useSash } from "@sash/sdk";

export default function App() {
  const { user, loading } = useSash();

  if (loading) {
    return (
      <div className="app-container">
        <div className="glass-card header">
          <h2>Restoring Session...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {user ? <AuthenticatedView /> : <UnauthenticatedView />}
    </div>
  );
}

// ─── Authenticated Flow ────────────────────────────────────────────────────────

function AuthenticatedView() {
  const { user, logout, sendVerification, verifyEmail } = useSash();
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSendVerification = async () => {
    try {
      await sendVerification(user!.email);
      setSuccess("Verification email sent! Check your inbox.");
      setError("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setError("");
    try {
      await verifyEmail(user!.email, code);
      setSuccess("Email verified successfully!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="glass-card">
      <div className="header">
        <h1>Dashboard</h1>
        <p>You are logged in.</p>
      </div>

      <div className="user-card">
        <code>{user!.email}</code>
        <div className={`badge ${user!.emailVerified ? "verified" : "unverified"}`}>
          {user!.emailVerified ? "✓ Verified" : "⚠ Unverified"}
        </div>
      </div>

      {!user!.emailVerified && (
        <div className="banner">
          <p style={{ margin: "0 0 1rem 0" }}>Your email is unverified.</p>
          <button className="secondary-button" onClick={handleSendVerification} style={{ marginBottom: "1rem" }}>
            Send Verification Code
          </button>
          
          <form onSubmit={handleVerify}>
            <div className="form-group">
              <input
                type="text"
                placeholder="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                required
              />
            </div>
            <button type="submit" disabled={verifying || code.length < 6}>
              {verifying ? "Verifying..." : "Verify Code"}
            </button>
          </form>
        </div>
      )}

      {error && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      <button className="secondary-button" onClick={logout} style={{ marginTop: "2rem" }}>
        Sign Out
      </button>
    </div>
  );
}

// ─── Unauthenticated Flow ──────────────────────────────────────────────────────

function UnauthenticatedView() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const { login, signup, forgotPassword, resetPassword } = useSash();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Specifically for the "reset" step after forgotPassword succeeds
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (mode === "login") {
        await login(email, password);
      } else if (mode === "signup") {
        await signup(email, password);
      } else if (mode === "forgot") {
        if (!resetSent) {
          await forgotPassword(email);
          setSuccess("If an account exists, a reset code was sent.");
          setResetSent(true);
        } else {
          await resetPassword(email, code, password);
          setSuccess("Password reset successful! You can now log in.");
          setMode("login");
          setResetSent(false);
          setPassword("");
          setCode("");
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card">
      <div className="header">
        <h1>{mode === "login" ? "Welcome Back" : mode === "signup" ? "Create Account" : "Reset Password"}</h1>
        <p>Sash React SDK Demo</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={resetSent} // freeze email if waiting for code
          />
        </div>

        {(!resetSent) && mode !== "forgot" && (
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        )}

        {resetSent && (
          <>
            <div className="form-group">
              <label>6-Digit Reset Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                required
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Please wait..." : 
            mode === "login" ? "Sign In" : 
            mode === "signup" ? "Sign Up" : 
            resetSent ? "Save New Password" : "Send Reset Code"}
        </button>
      </form>

      {error && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      <div style={{ marginTop: "1.5rem", textAlign: "center", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {mode === "login" ? (
          <>
            <button type="button" className="link-button" onClick={() => setMode("signup")}>
              Don't have an account? Sign up
            </button>
            <button type="button" className="link-button" onClick={() => setMode("forgot")}>
              Forgot password?
            </button>
          </>
        ) : (
          <button type="button" className="link-button" onClick={() => { setMode("login"); setResetSent(false); }}>
            Back to login
          </button>
        )}
      </div>
    </div>
  );
}
