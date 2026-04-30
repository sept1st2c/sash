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
    <div className="relative group rounded-xl overflow-hidden border border-[color:var(--color-border-subtle)] my-4">
      {/* Header */}
      {filename && (
        <div className="flex items-center justify-between px-4 py-2 bg-[color:var(--color-bg-page)] border-b border-[color:var(--color-border-subtle)]">
          <span className="text-[12px] text-[color:var(--color-text-muted)] font-mono">{filename}</span>
          <span className="text-[11px] text-[color:var(--color-text-muted)] uppercase tracking-wider">{language}</span>
        </div>
      )}
      {/* Code */}
      <div className="relative bg-[#0d1117] p-5 overflow-x-auto">
        <pre className="text-[13px] text-[#e6edf3] font-mono leading-relaxed whitespace-pre">
          <code>{code}</code>
        </pre>
        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/5 border border-white/10 text-[color:var(--color-text-muted)] hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
          title="Copy to clipboard"
        >
          {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
        </button>
      </div>
    </div>
  );
}
