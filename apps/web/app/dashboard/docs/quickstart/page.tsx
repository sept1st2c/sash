import { DocSection } from "../_components/DocSection";
import { CodeBlock } from "../_components/CodeBlock";
import { Terminal, Package, Code2, CheckCircle2 } from "lucide-react";

const steps = [
  { icon: Package, label: "Install the SDK", color: "text-amber-400", bg: "bg-amber-400/10" },
  { icon: Code2, label: "Add the Provider", color: "text-[color:var(--color-brand-light)]", bg: "bg-[color:var(--color-brand-dim)]" },
  { icon: Terminal, label: "Use the Hook", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  { icon: CheckCircle2, label: "You're live!", color: "text-rose-400", bg: "bg-rose-400/10" },
];

export default function QuickStartPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-[color:var(--color-border-subtle)]">
        <p className="text-[12px] font-semibold text-[color:var(--color-brand-light)] uppercase tracking-wider mb-2">Getting Started</p>
        <h1 className="text-[24px] font-bold tracking-tight text-[color:var(--color-text-primary)] mb-2">Quick Start</h1>
        <p className="text-[14px] text-[color:var(--color-text-secondary)]">
          Add Sash authentication to your React app in under 5 minutes.
        </p>
      </div>

      {/* Steps progress bar */}
      <div className="flex items-center gap-3 mb-10 flex-wrap">
        {steps.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon size={14} className={s.color} />
            </div>
            <span className="text-[13px] text-[color:var(--color-text-secondary)] font-medium">{s.label}</span>
            {i < steps.length - 1 && <span className="text-[color:var(--color-border-subtle)] mx-1">›</span>}
          </div>
        ))}
      </div>

      {/* Step 1 */}
      <DocSection
        title="Step 1 — Get your API Key"
        description="Every Sash project has a unique API key. Open your project in the dashboard, copy the key, and add it to your environment variables. Never commit it to source control."
      >
        <CodeBlock
          filename=".env.local"
          language="env"
          code={`NEXT_PUBLIC_SASH_API_KEY=sash_live_xxxxxxxxxxxxxxxxxxxx`}
        />
        <div className="flex items-start gap-2.5 p-4 rounded-xl bg-amber-400/5 border border-amber-400/20 mt-2">
          <span className="text-amber-400 text-[13px] mt-0.5">⚠</span>
          <p className="text-[13px] text-[color:var(--color-text-secondary)]">
            Use <code className="font-mono text-[12px] text-amber-400">NEXT_PUBLIC_</code> prefix only for keys you intentionally expose to the browser. If you use the SDK client-side, this is required. Never expose the key server-side only.
          </p>
        </div>
      </DocSection>

      {/* Step 2 */}
      <DocSection
        title="Step 2 — Install the SDK"
        description="Install the @sash/sdk package from npm."
      >
        <CodeBlock
          language="bash"
          code={`npm install @sash/sdk`}
        />
      </DocSection>

      {/* Step 3 */}
      <DocSection
        title="Step 3 — Wrap your app with SashProvider"
        description="Place SashProvider at the root of your component tree. In Next.js App Router, this goes in your root layout. In Vite/CRA, this goes in main.tsx."
      >
        <CodeBlock
          filename="app/layout.tsx (Next.js App Router)"
          language="tsx"
          code={`import { SashProvider } from "@sash/sdk";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SashProvider apiKey={process.env.NEXT_PUBLIC_SASH_API_KEY!}>
          {children}
        </SashProvider>
      </body>
    </html>
  );
}`}
        />
        <CodeBlock
          filename="src/main.tsx (Vite)"
          language="tsx"
          code={`import { SashProvider } from "@sash/sdk";
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <SashProvider apiKey={import.meta.env.VITE_SASH_API_KEY}>
    <App />
  </SashProvider>
);`}
        />
      </DocSection>

      {/* Step 4 */}
      <DocSection
        title="Step 4 — Use the useSash() hook"
        description="In any component inside your SashProvider tree, call useSash() to access the authenticated user and auth functions."
      >
        <CodeBlock
          filename="components/AuthButtons.tsx"
          language="tsx"
          code={`"use client";
import { useSash } from "@sash/sdk";

export function AuthButtons() {
  const { user, loading, login, logout, signup } = useSash();

  if (loading) return <p>Loading...</p>;

  if (user) {
    return (
      <div>
        <p>Welcome, {user.email}!</p>
        <button onClick={logout}>Sign out</button>
      </div>
    );
  }

  return (
    <button onClick={() => login("you@example.com", "password")}>
      Sign in
    </button>
  );
}`}
        />
      </DocSection>

      {/* Done */}
      <div className="rounded-[16px] bg-emerald-400/5 border border-emerald-400/20 p-6 flex items-start gap-4">
        <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-[14px] font-semibold text-[color:var(--color-text-primary)] mb-1">You're all set!</p>
          <p className="text-[13px] text-[color:var(--color-text-secondary)]">
            Your app now has full authentication powered by Sash. Check the <strong>SDK Reference</strong> for the complete list of functions, or the <strong>API Reference</strong> if you're integrating without React.
          </p>
        </div>
      </div>
    </div>
  );
}
