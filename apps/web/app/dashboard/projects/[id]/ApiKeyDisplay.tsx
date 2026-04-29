/**
 * app/dashboard/projects/[id]/ApiKeyDisplay.tsx
 *
 * Client component — displays the API key with show/hide toggle and copy button.
 *
 * WHY CLIENT: Clipboard API and hover/click interactions require the browser.
 *
 * PROPS:
 *   apiKey    — the full API key string
 *   projectId — used for unique element IDs
 */
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
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        id={`apikey-display-${projectId}`}
        className="mono"
        style={{ flex: 1, cursor: "text", letterSpacing: visible ? "0.02em" : "0.08em" }}
      >
        {displayKey}
      </div>

      <button
        id={`apikey-toggle-${projectId}`}
        className="btn btn-ghost btn-sm"
        onClick={() => setVisible((v) => !v)}
        title={visible ? "Hide API key" : "Reveal API key"}
        style={{ flexShrink: 0 }}
      >
        {visible ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>

      <button
        id={`apikey-copy-${projectId}`}
        className="btn btn-ghost btn-sm"
        onClick={handleCopy}
        title="Copy API key"
        style={{ flexShrink: 0, minWidth: 90 }}
      >
        {copied ? (
          <><Check size={15} color="var(--success)" /> Copied</>
        ) : (
          <><Copy size={15} /> Copy</>
        )}
      </button>
    </div>
  );
}
