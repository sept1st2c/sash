"use client";
import { motion, type Variants } from "motion/react";
import { DocSection, PropsTable, PropRow } from "../_components/DocSection";
import { CodeBlock } from "../_components/CodeBlock";

const authFunctions = [
  {
    sig: "login(email: string, password: string) → Promise<SashUser>",
    desc: "Authenticates a user with email and password. On success, sets the user state and stores a session cookie. Throws SashApiError on failure (wrong password, unverified email, etc).",
  },
  {
    sig: "signup(email: string, password: string) → Promise<SashUser>",
    desc: "Creates a new user account. On success, logs them in and sets a session cookie. The returned user has emailVerified: false, so prompt them to verify their email next.",
  },
  {
    sig: "logout() → Promise<void>",
    desc: "Invalidates the current session on the server and clears the local user state. The session cookie is removed.",
  },
  {
    sig: "sendVerification(email: string) → Promise<void>",
    desc: "Sends a 6-digit OTP to the user's email address via Resend. The code is valid for 10 minutes and allows 5 attempts before locking.",
  },
  {
    sig: "verifyEmail(email: string, code: string) → Promise<void>",
    desc: "Verifies the user's email using the OTP. On success, updates user.emailVerified to true in both the database and local state.",
  },
  {
    sig: "forgotPassword(email: string) → Promise<void>",
    desc: "Sends a password-reset OTP to the user's email. Always resolves, even if the email doesn't exist, to prevent user enumeration.",
  },
  {
    sig: "resetPassword(email: string, code: string, newPassword: string) → Promise<void>",
    desc: "Resets the user's password using the OTP code. On success, every existing session for that user is invalidated.",
  },
];

const dropInComponents = [
  {
    sig: "<SignIn subtitle=\"...\" redirectUrl=\"...\" onForgotPassword={() => ...} />",
    desc: "A fully functional login form. Handles the API request, loading state, error surfacing, and an optional redirect.",
  },
  {
    sig: "<SignUp subtitle=\"...\" redirectUrl=\"...\" onSuccess={() => ...} />",
    desc: "A multi-step signup form. Collects email and password, then transitions to a 6-digit OTP verification screen before completing.",
  },
  {
    sig: "<ForgotPassword subtitle=\"...\" onSuccess={() => ...} onBackToSignIn={() => ...} />",
    desc: "A complete password reset flow. Collects the email, requests the OTP, and provides an auto-advancing 6-digit input to set a new password.",
  },
];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const rise: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export default function SdkReferencePage() {
  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 pb-6 border-b"
        style={{ borderColor: "var(--wise-border)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.14em] mb-2" style={{ color: "var(--wise-positive-deep)" }}>
          React SDK
        </p>
        <h1
          className="text-[26px] md:text-[30px] tracking-tight mb-2"
          style={{ fontFamily: "var(--font-wise-display)", fontWeight: 900, color: "var(--wise-ink)" }}
        >
          SashProvider &amp; useSash()
        </h1>
        <p className="max-w-xl text-[14px] leading-relaxed" style={{ color: "var(--wise-body)" }}>
          Full reference for the React SDK: the{" "}
          <code className="font-mono text-[13px]" style={{ color: "var(--wise-primary)" }}>SashProvider</code> component
          and the <code className="font-mono text-[13px]" style={{ color: "var(--wise-primary)" }}>useSash()</code> hook.
        </p>
      </motion.div>

      {/* SashProvider */}
      <DocSection
        title="SashProvider"
        description="The context provider that enables Sash authentication in your React tree. Wrap your entire application with it, or at minimum, any component that calls useSash()."
      >
        <CodeBlock
          language="tsx"
          code={`import { SashProvider } from "@septic/sdk";

<SashProvider
  apiKey="sash_live_xxxx"
  baseUrl="https://your-sash-deployment.com"
>
  {children}
</SashProvider>`}
        />
        <PropsTable>
          <PropRow name="apiKey" type="string" required description="Your project's Sash API key. Use an environment variable, never hardcode this." />
          <PropRow name="baseUrl" type="string" description="The base URL of your Sash deployment." defaultValue='"http://localhost:3000"' />
          <PropRow name="children" type="React.ReactNode" required description="Your application's component tree." />
        </PropsTable>
      </DocSection>

      {/* useSash */}
      <DocSection
        title="useSash()"
        description="The main hook for reading auth state and calling auth functions. It must be used inside a component wrapped by SashProvider."
      >
        <CodeBlock
          language="tsx"
          code={`import { useSash } from "@septic/sdk";

const {
  // State
  user,       // SashUser | null
  loading,    // boolean

  // Auth Actions
  login,
  signup,
  logout,

  // Email Verification
  sendVerification,
  verifyEmail,

  // Password Reset
  forgotPassword,
  resetPassword,
} = useSash();`}
        />
      </DocSection>

      {/* State */}
      <DocSection title="State Properties">
        <PropsTable>
          <PropRow name="user" type="SashUser | null" description="The currently authenticated user, or null if logged out. Restored automatically from the session cookie on page load." />
          <PropRow name="loading" type="boolean" description="True while the SDK is restoring a session on first load. Show a spinner while this is true so you don't flash a logged-out state." />
        </PropsTable>
      </DocSection>

      {/* SashUser shape */}
      <DocSection title="SashUser Object" description="The shape of the user object returned by login and signup, and restored by the session.">
        <CodeBlock
          language="typescript"
          code={`interface SashUser {
  id: string;
  email: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string; // ISO 8601
}`}
        />
      </DocSection>

      {/* Functions */}
      <DocSection title="Auth Functions">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          className="space-y-3"
        >
          {authFunctions.map((fn) => (
            <motion.div
              key={fn.sig}
              variants={rise}
              className="p-4 rounded-[var(--wise-radius-lg)]"
              style={{ backgroundColor: "var(--wise-canvas-soft)", border: "1px solid var(--wise-border)" }}
            >
              <code className="block text-[12px] font-mono mb-2 break-all" style={{ color: "var(--wise-primary)" }}>{fn.sig}</code>
              <p className="text-[13px] leading-relaxed" style={{ color: "var(--wise-body)" }}>{fn.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </DocSection>

      {/* Error handling */}
      <DocSection
        title="Error Handling"
        description="Every function throws a SashApiError on failure. It carries a message string and an HTTP status code."
      >
        <CodeBlock
          language="tsx"
          code={`import { useSash, SashApiError } from "@septic/sdk";

const { login } = useSash();

try {
  await login(email, password);
} catch (err) {
  if (err instanceof SashApiError) {
    console.error(err.message); // "Invalid credentials"
    console.error(err.status);  // 401
  }
}`}
        />
      </DocSection>

      {/* Pre-built Components */}
      <DocSection
        title="Drop-in UI Components"
        description="Sash ships pre-built, styled components so you don't have to write auth forms by hand. They're built with vanilla CSS variables and inject their own styles, so there's no setup required."
      >
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          className="space-y-3"
        >
          {dropInComponents.map((comp) => (
            <motion.div
              key={comp.sig}
              variants={rise}
              className="p-4 rounded-[var(--wise-radius-lg)]"
              style={{ backgroundColor: "var(--wise-canvas-soft)", border: "1px solid var(--wise-border)" }}
            >
              <code className="block text-[12px] font-mono mb-2 break-all" style={{ color: "var(--wise-accent-cyan)" }}>{comp.sig}</code>
              <p className="text-[13px] leading-relaxed" style={{ color: "var(--wise-body)" }}>{comp.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </DocSection>
    </div>
  );
}
