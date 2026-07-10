"use client";
import { motion, type Variants } from "motion/react";
import { DocSection } from "../_components/DocSection";
import { CodeBlock } from "../_components/CodeBlock";
import { Terminal, Package, Code2, CheckCircle2 } from "lucide-react";

const steps = [
  { icon: Package, label: "Install the SDK", color: "var(--wise-warning)" },
  { icon: Code2, label: "Add the Provider", color: "var(--wise-primary)" },
  { icon: Terminal, label: "Use the Hook", color: "var(--wise-accent-cyan)" },
  { icon: CheckCircle2, label: "You're live", color: "var(--wise-positive)" },
];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const rise: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export default function QuickStartPage() {
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
          Getting Started
        </p>
        <h1
          className="text-[26px] md:text-[30px] tracking-tight mb-2"
          style={{ fontFamily: "var(--font-wise-display)", fontWeight: 900, color: "var(--wise-ink)" }}
        >
          Quick Start
        </h1>
        <p className="max-w-xl text-[14px] leading-relaxed" style={{ color: "var(--wise-body)" }}>
          Add Sash authentication to your React app in under 5 minutes.
        </p>
      </motion.div>

      {/* Steps progress bar */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex items-center gap-3 mb-10 flex-wrap"
      >
        {steps.map((s, i) => (
          <motion.div key={s.label} variants={rise} className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-[var(--wise-radius-sm)] flex items-center justify-center shrink-0"
              style={{ backgroundColor: "rgba(159,232,112,0.12)" }}
            >
              <s.icon size={14} style={{ color: s.color }} />
            </div>
            <span className="text-[13px] font-medium" style={{ color: "var(--wise-body)" }}>{s.label}</span>
            {i < steps.length - 1 && <span className="mx-1" style={{ color: "var(--wise-border)" }}>›</span>}
          </motion.div>
        ))}
      </motion.div>

      {/* Step 1 */}
      <DocSection
        title="Step 1: Get your API key"
        description="Every Sash project has a unique API key. Open your project in the dashboard, copy the key, and add it to your environment variables. Never commit it to source control."
      >
        <CodeBlock
          filename=".env.local"
          language="env"
          code={`NEXT_PUBLIC_SASH_API_KEY=sash_live_xxxxxxxxxxxxxxxxxxxx`}
        />
        <div
          className="flex items-start gap-2.5 p-4 rounded-[var(--wise-radius-lg)] mt-2"
          style={{ backgroundColor: "rgba(255,209,26,0.06)", border: "1px solid rgba(255,209,26,0.2)" }}
        >
          <span className="text-[13px] mt-0.5" style={{ color: "var(--wise-warning)" }}>⚠</span>
          <p className="text-[13px] leading-relaxed" style={{ color: "var(--wise-body)" }}>
            Only use the <code className="font-mono text-[12px]" style={{ color: "var(--wise-warning)" }}>NEXT_PUBLIC_</code> prefix
            for keys you intentionally expose to the browser. If you&apos;re calling the SDK client-side, this prefix is required,
            so don&apos;t keep it server-only.
          </p>
        </div>
      </DocSection>

      {/* Step 2 */}
      <DocSection
        title="Step 2: Install the SDK"
        description="Install the @septic/sdk package from npm."
      >
        <CodeBlock
          language="bash"
          code={`npm install @septic/sdk`}
        />
      </DocSection>

      {/* Step 3 */}
      <DocSection
        title="Step 3: Wrap your app with SashProvider"
        description="Place SashProvider at the root of your component tree. In Next.js App Router, that's your root layout. In Vite or CRA, that's main.tsx."
      >
        <CodeBlock
          filename="app/layout.tsx (Next.js App Router)"
          language="tsx"
          code={`import { SashProvider } from "@septic/sdk";

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
          code={`import { SashProvider } from "@septic/sdk";
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
        title="Step 4: Add drop-in UI components"
        description="The fastest way to get started is with our pre-built, styled UI components. No Tailwind or extra CSS needed, styles are injected automatically."
      >
        <CodeBlock
          filename="components/AuthPage.tsx"
          language="tsx"
          code={`import { SignIn, SignUp } from "@septic/sdk";

export function AuthPage() {
  return (
    <div style={{ display: "flex", gap: "2rem" }}>
      <SignIn subtitle="Sign in to your account" />
      <SignUp subtitle="Create a new account" />
    </div>
  );
}`}
        />
        <div className="mt-4">
          <p className="text-[13px] leading-relaxed" style={{ color: "var(--wise-body)" }}>
            <strong style={{ color: "var(--wise-ink)" }}>Prefer headless?</strong> Use the{" "}
            <code className="font-mono text-[12px]" style={{ color: "var(--wise-primary)" }}>useSash()</code> hook to
            access raw state (<code className="font-mono text-[12px]">user</code>,{" "}
            <code className="font-mono text-[12px]">loading</code>) and methods (
            <code className="font-mono text-[12px]">login</code>,{" "}
            <code className="font-mono text-[12px]">signup</code>) and build your own UI on top.
          </p>
        </div>
      </DocSection>

      {/* Done */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4 }}
        className="rounded-[var(--wise-radius-lg)] p-6 flex items-start gap-4"
        style={{ backgroundColor: "rgba(159,232,112,0.06)", border: "1px solid var(--wise-border)" }}
      >
        <CheckCircle2 size={20} className="shrink-0 mt-0.5" style={{ color: "var(--wise-positive)" }} />
        <div>
          <p className="text-[14px] font-semibold mb-1" style={{ color: "var(--wise-ink)" }}>You&apos;re all set</p>
          <p className="text-[13px] leading-relaxed" style={{ color: "var(--wise-body)" }}>
            Your app now has full authentication powered by Sash. Check the <strong style={{ color: "var(--wise-ink)" }}>SDK Reference</strong> for
            the complete list of functions, or the <strong style={{ color: "var(--wise-ink)" }}>API Reference</strong> if you&apos;re
            integrating without React.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
