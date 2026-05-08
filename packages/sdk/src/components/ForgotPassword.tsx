import React, { useState, useRef } from "react";
import { useSash } from "../context";

export interface ForgotPasswordProps {
  /** Text to show below the title */
  subtitle?: string;
  /** Callback fired upon successful password reset */
  onSuccess?: () => void;
  /** Callback to trigger when the user clicks "Back to sign in" */
  onBackToSignIn?: () => void;
}

export function ForgotPassword({ subtitle = "Reset your password", onSuccess, onBackToSignIn }: ForgotPasswordProps) {
  const { forgotPassword, resetPassword } = useSash();

  // State
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Step 1: Request Reset Code ────────────────────────────────────────────
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await forgotPassword(email);
      setStep("reset");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to request reset code.");
      } else {
        setError("Failed to request reset code.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2: OTP & New Password ────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
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

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
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
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to reset password. Please check the code.");
      } else {
        setError("Failed to reset password. Please check the code.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Renders ───────────────────────────────────────────────────────────────

  if (step === "reset") {
    return (
      <div className="sash-card">
        <div className="sash-card-header">
          <h2 className="sash-card-title">Check your email</h2>
          <p className="sash-card-subtitle">
            We sent a 6-digit reset code to <strong>{email}</strong>
          </p>
        </div>

        {error && <div className="sash-error">{error}</div>}

        <form onSubmit={handleResetSubmit}>
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

          <div className="sash-form-group">
            <label className="sash-label" htmlFor="sash-new-password">New Password</label>
            <input
              id="sash-new-password"
              type="password"
              className="sash-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
              required
              autoComplete="new-password"
              placeholder="Must be at least 8 characters"
            />
          </div>

          <button type="submit" className="sash-button" disabled={isLoading || otp.join("").length !== 6}>
            {isLoading ? "Saving..." : "Save New Password"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="sash-card">
      <div className="sash-card-header">
        <h2 className="sash-card-title">Reset password</h2>
        <p className="sash-card-subtitle">{subtitle}</p>
      </div>

      {error && <div className="sash-error">{error}</div>}

      <form onSubmit={handleEmailSubmit}>
        <div className="sash-form-group">
          <label className="sash-label" htmlFor="sash-forgot-email">Email address</label>
          <input
            id="sash-forgot-email"
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

        <button type="submit" className="sash-button" disabled={isLoading}>
          {isLoading ? "Sending code..." : "Send Reset Code"}
        </button>
      </form>

      {onBackToSignIn && (
        <div className="sash-footer">
          <button className="sash-link" onClick={onBackToSignIn} style={{ background: "none", border: "none", fontSize: "13px" }}>
            &larr; Back to sign in
          </button>
        </div>
      )}
    </div>
  );
}
