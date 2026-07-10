"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
}

export function CodeBlock({ code, language = "bash", filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="group relative my-4 overflow-hidden rounded-[var(--wise-radius-lg)]"
      style={{ border: "1px solid var(--wise-border)" }}
    >
      {/* macOS-style chrome */}
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{ backgroundColor: "var(--wise-code-bg)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: "#ff5f56" }} />
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: "#ffbd2e" }} />
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: "#27c93f" }} />
        {filename && (
          <span
            className="ml-2 min-w-0 truncate font-mono text-[11px]"
            style={{ color: "var(--wise-mute)" }}
          >
            {filename}
          </span>
        )}
        <span
          className="ml-auto shrink-0 font-mono text-[10px] uppercase tracking-wider"
          style={{ color: "var(--wise-code-text-muted)" }}
        >
          {language}
        </span>
      </div>

      {/* Code */}
      <div className="relative overflow-x-auto p-5" style={{ backgroundColor: "var(--wise-code-bg)" }}>
        <pre
          className="wise-scroll font-mono text-[13px] leading-relaxed whitespace-pre"
          style={{ color: "var(--wise-primary)" }}
        >
          <code>{code}</code>
        </pre>
        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 p-1.5 rounded-[var(--wise-radius-sm)] opacity-0 transition-all group-hover:opacity-100"
          style={{
            backgroundColor: "rgba(159,232,112,0.12)",
            border: "1px solid var(--wise-border)",
            color: copied ? "var(--wise-positive)" : "var(--wise-code-text-muted)",
          }}
          title="Copy to clipboard"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
        </button>
      </div>
    </div>
  );
}
