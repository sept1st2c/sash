import React, { useState } from "react";
import { useSash } from "../context";

export interface SignInProps {
  /** Text to show below the title */
  subtitle?: string;
  /** Callback fired upon successful login */
  onSuccess?: () => void;
  /** Optional URL to redirect to after successful login. Will use window.location.href if provided. */
  redirectUrl?: string;
}

export function SignIn({ subtitle = "to continue to your app", onSuccess, redirectUrl }: SignInProps) {
  const { login } = useSash();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="sash-card">
      <div className="sash-card-header">
        <h2 className="sash-card-title">Sign in</h2>
        <p className="sash-card-subtitle">{subtitle}</p>
      </div>

      {error && <div className="sash-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="sash-form-group">
          <label className="sash-label" htmlFor="sash-email">Email address</label>
          <input
            id="sash-email"
            type="email"
            className="sash-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </div>

        <div className="sash-form-group">
          <label className="sash-label" htmlFor="sash-password">Password</label>
          <input
            id="sash-password"
            type="password"
            className="sash-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
            autoComplete="current-password"
          />
        </div>

        <button type="submit" className="sash-button" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Continue"}
        </button>
      </form>
    </div>
  );
}
