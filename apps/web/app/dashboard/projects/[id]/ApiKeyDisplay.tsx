"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
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
    <div className="flex items-center gap-2.5 min-w-0">
      <div
        className={`flex-1 min-w-0 font-mono text-[13px] bg-[color:var(--wise-canvas)] px-3.5 py-2.5 rounded-[var(--wise-radius-md)] border border-[color:var(--wise-border)] text-[color:var(--wise-primary)] cursor-text overflow-hidden text-ellipsis whitespace-nowrap transition-all ${visible ? 'tracking-normal' : 'tracking-widest'}`}
      >
        {displayKey}
      </div>

      <button
        onClick={() => setVisible((v) => !v)}
        title={visible ? "Hide API key" : "Reveal API key"}
        className="shrink-0 p-2.5 rounded-[var(--wise-radius-md)] border border-[color:var(--wise-border)] text-[color:var(--wise-body)] hover:bg-[color:var(--wise-surface-alt)] hover:text-[color:var(--wise-ink)] transition-colors"
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>

      <button
        onClick={handleCopy}
        title="Copy API key"
        className="shrink-0 min-w-[90px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-[var(--wise-radius-md)] border border-[color:var(--wise-border)] text-[13px] font-medium text-[color:var(--wise-body)] hover:bg-[color:var(--wise-surface-alt)] hover:text-[color:var(--wise-ink)] transition-colors overflow-hidden"
      >
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.span
              key="copied"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2"
            >
              <Check size={14} className="text-[color:var(--wise-positive)]" /> Copied
            </motion.span>
          ) : (
            <motion.span
              key="copy"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2"
            >
              <Copy size={14} /> Copy
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}
