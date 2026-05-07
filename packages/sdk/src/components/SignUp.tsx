import React, { useState, useRef, useEffect } from "react";
import { useSash } from "../context";

export interface SignUpProps {
  /** Text to show below the title */
  subtitle?: string;
  /** Callback fired upon successful signup and verification */
  onSuccess?: () => void;
  /** Optional URL to redirect to after successful signup. Will use window.location.href if provided. */
  redirectUrl?: string;
}

export function SignUp({ subtitle = "to continue to your app", onSuccess, redirectUrl }: SignUpProps) {
  const { signup, sendVerification, verifyEmail } = useSash();
  
  // State
  const [step, setStep] = useState<"form" | "verify">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Step 1: Account Creation ──────────────────────────────────────────────
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await signup(email, password);
      // Immediately send the verification email
      await sendVerification(email);
      setStep("verify");
    } catch (err: any) {
      setError(err.message || "Failed to create account.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2: OTP Verification ──────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only numbers
    
    const newOtp = [...otp];
    // If pasting a full string
    if (value.length > 1) {
      const chars = value.split("").slice(0, 6);
      chars.forEach((c, i) => {
        if (index + i < 6) newOtp[index + i] = c;
      });
      setOtp(newOtp);
      // Focus the next empty input, or the last one
      const nextEmpty = newOtp.findIndex((v) => v === "");
      if (nextEmpty !== -1 && otpRefs.current[nextEmpty]) {
        otpRefs.current[nextEmpty]?.focus();
      } else if (otpRefs.current[5]) {
        otpRefs.current[5]?.focus();
      }
      return;
    }

    // Single character input
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance
    if (value && index < 5 && otpRefs.current[index + 1]) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
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
    } catch (err: any) {
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Renders ───────────────────────────────────────────────────────────────
  
  if (step === "verify") {
    return (
      <div className="sash-card">
        <div className="sash-card-header">
          <h2 className="sash-card-title">Check your email</h2>
          <p className="sash-card-subtitle">
            We sent a 6-digit code to <strong>{email}</strong>
          </p>
        </div>

        {error && <div className="sash-error">{error}</div>}

        <form onSubmit={handleVerifySubmit}>
          <div className="sash-otp-container">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (otpRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="sash-otp-input"
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                disabled={isLoading}
              />
            ))}
          </div>

          <button type="submit" className="sash-button" disabled={isLoading || otp.join("").length !== 6}>
            {isLoading ? "Verifying..." : "Verify email"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="sash-card">
      <div className="sash-card-header">
        <h2 className="sash-card-title">Create an account</h2>
        <p className="sash-card-subtitle">{subtitle}</p>
      </div>

      {error && <div className="sash-error">{error}</div>}

      <form onSubmit={handleSignupSubmit}>
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
            autoComplete="new-password"
            placeholder="Must be at least 8 characters"
          />
        </div>

        <button type="submit" className="sash-button" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Continue"}
        </button>
      </form>
    </div>
  );
}
