import { DocSection, PropsTable, PropRow } from "../_components/DocSection";
import { CodeBlock } from "../_components/CodeBlock";

export default function SdkReferencePage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-[color:var(--color-border-subtle)]">
        <p className="text-[12px] font-semibold text-[color:var(--color-brand-light)] uppercase tracking-wider mb-2">React SDK</p>
        <h1 className="text-[24px] font-bold tracking-tight text-[color:var(--color-text-primary)] mb-2">
          SashProvider & useSash()
        </h1>
        <p className="text-[14px] text-[color:var(--color-text-secondary)]">
          Full reference for the React SDK — the <code className="font-mono text-[13px] text-[color:var(--color-brand-light)]">SashProvider</code> component and the <code className="font-mono text-[13px] text-[color:var(--color-brand-light)]">useSash()</code> hook.
        </p>
      </div>

      {/* SashProvider */}
      <DocSection
        title="SashProvider"
        description="The context provider that enables Sash authentication in your React tree. Must wrap your entire application (or at minimum, any component that uses useSash())."
      >
        <CodeBlock
          language="tsx"
          code={`import { SashProvider } from "@sash/sdk";

<SashProvider
  apiKey="sash_live_xxxx"
  baseUrl="https://your-sash-deployment.com"
>
  {children}
</SashProvider>`}
        />
        <PropsTable>
          <PropRow name="apiKey" type="string" required description="Your project's Sash API key. Use an environment variable — never hardcode this." />
          <PropRow name="baseUrl" type="string" description="The base URL of your Sash deployment." defaultValue='"http://localhost:3000"' />
          <PropRow name="children" type="React.ReactNode" required description="Your application's component tree." />
        </PropsTable>
      </DocSection>

      {/* useSash */}
      <DocSection
        title="useSash()"
        description="The main hook for accessing authentication state and functions. Must be called inside a component that is wrapped by SashProvider."
      >
        <CodeBlock
          language="tsx"
          code={`import { useSash } from "@sash/sdk";

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
          <PropRow name="user" type="SashUser | null" description="The currently authenticated user object, or null if logged out. Automatically restored from session cookie on page load." />
          <PropRow name="loading" type="boolean" description="True while the SDK is restoring a session on first load. Show a spinner while this is true to prevent a flash of the logged-out state." />
        </PropsTable>
      </DocSection>

      {/* SashUser shape */}
      <DocSection title="SashUser Object" description="The shape of the user object returned by login, signup, and restored by the session.">
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
        <div className="space-y-5">
          {[
            {
              sig: "login(email: string, password: string) → Promise<SashUser>",
              desc: "Authenticates a user with email and password. On success, sets the user state and stores a session cookie. Throws SashApiError on failure (e.g., wrong password, unverified email).",
            },
            {
              sig: "signup(email: string, password: string) → Promise<SashUser>",
              desc: "Creates a new user account. On success, logs them in and sets a session cookie. The returned user will have emailVerified: false — prompt them to verify their email.",
            },
            {
              sig: "logout() → Promise<void>",
              desc: "Invalidates the current session on the server and clears the local user state. The session cookie is removed.",
            },
            {
              sig: "sendVerification(email: string) → Promise<void>",
              desc: "Sends a 6-digit OTP to the user's email address via Resend. The code is valid for 10 minutes and allows 5 attempts before expiring.",
            },
            {
              sig: "verifyEmail(email: string, code: string) → Promise<void>",
              desc: "Verifies the user's email using the OTP. On success, updates user.emailVerified to true in both the database and local state.",
            },
            {
              sig: "forgotPassword(email: string) → Promise<void>",
              desc: "Sends a password-reset OTP to the user's email. Always resolves (even if the email doesn't exist) to prevent user enumeration.",
            },
            {
              sig: "resetPassword(email: string, code: string, newPassword: string) → Promise<void>",
              desc: "Resets the user's password using the OTP code. On success, all existing sessions for that user are invalidated for security.",
            },
          ].map((fn) => (
            <div key={fn.sig} className="p-4 rounded-xl bg-[color:var(--color-bg-surface)] border border-[color:var(--color-border-subtle)]">
              <code className="block text-[12px] font-mono text-[color:var(--color-brand-light)] mb-2 break-all">{fn.sig}</code>
              <p className="text-[13px] text-[color:var(--color-text-secondary)]">{fn.desc}</p>
            </div>
          ))}
        </div>
      </DocSection>

      {/* Error handling */}
      <DocSection
        title="Error Handling"
        description="All functions throw a SashApiError on failure. It has a message string and a status HTTP code."
      >
        <CodeBlock
          language="tsx"
          code={`import { useSash, SashApiError } from "@sash/sdk";

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
    </div>
  );
}
