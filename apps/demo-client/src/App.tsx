import { useState } from "react";
import { useSash, SignIn, SignUp, ForgotPassword } from "@septic/sdk";

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {mode === "login" && (
        <>
          <SignIn 
            subtitle="Sign in to test the React SDK" 
            onForgotPassword={() => setMode("forgot")}
          />
          <p style={{ textAlign: "center", color: "var(--sash-text-secondary)", fontSize: "14px" }}>
            Don't have an account?{" "}
            <button className="link-button" onClick={() => setMode("signup")} style={{ color: "var(--sash-brand)", background: "none", border: "none", cursor: "pointer", fontWeight: "500" }}>
              Sign up
            </button>
          </p>
        </>
      )}
      
      {mode === "signup" && (
        <>
          <SignUp subtitle="Create an account to test the React SDK" />
          <p style={{ textAlign: "center", color: "var(--sash-text-secondary)", fontSize: "14px" }}>
            Already have an account?{" "}
            <button className="link-button" onClick={() => setMode("login")} style={{ color: "var(--sash-brand)", background: "none", border: "none", cursor: "pointer", fontWeight: "500" }}>
              Sign in
            </button>
          </p>
        </>
      )}

      {mode === "forgot" && (
        <ForgotPassword 
          subtitle="We'll send a code to reset your password"
          onBackToSignIn={() => setMode("login")}
          onSuccess={() => setMode("login")}
        />
      )}
    </div>
  );
}
