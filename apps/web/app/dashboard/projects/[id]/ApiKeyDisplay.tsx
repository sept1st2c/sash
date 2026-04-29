"use client";
import { useState } from "react";
import { Eye, EyeOff, Copy, Check } from "lucide-react";

interface Props {
  apiKey: string;
  projectId: string;
}

export default function ApiKeyDisplay({ apiKey, projectId }: Props) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for non-HTTPS
      const el = document.createElement("textarea");
      el.value = apiKey;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const displayKey = visible ? apiKey : `${apiKey.slice(0, 12)}${"•".repeat(32)}`;

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`flex-1 font-mono text-[13px] bg-[color:var(--color-bg-subtle)] px-3.5 py-2.5 rounded-xl border border-[color:var(--color-border-subtle)] text-[color:var(--color-brand-light)] cursor-text overflow-hidden text-ellipsis whitespace-nowrap transition-all ${visible ? 'tracking-normal' : 'tracking-widest'}`}
      >
        {displayKey}
      </div>

      <button
        onClick={() => setVisible((v) => !v)}
        title={visible ? "Hide API key" : "Reveal API key"}
        className="shrink-0 p-2.5 rounded-xl border border-[color:var(--color-border-subtle)] text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-bg-subtle)] hover:text-[color:var(--color-text-primary)] transition-colors"
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>

      <button
        onClick={handleCopy}
        title="Copy API key"
        className="shrink-0 min-w-[90px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-[color:var(--color-border-subtle)] text-[13px] font-medium text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-bg-subtle)] hover:text-[color:var(--color-text-primary)] transition-colors"
      >
        {copied ? (
          <><Check size={14} className="text-emerald-500" /> Copied</>
        ) : (
          <><Copy size={14} /> Copy</>
        )}
      </button>
    </div>
  );
}
