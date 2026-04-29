"use client";
import { useState } from "react";
import { Check, Pencil, X, ExternalLink } from "lucide-react";

interface Props {
  projectId: string;
  currentUrl: string;
}

export default function WebhookEditor({ projectId, currentUrl }: Props) {
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(currentUrl);
  const [draft, setDraft] = useState(currentUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/dashboard/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl: draft || null }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to update.");
        setLoading(false);
        return;
      }

      setUrl(data.project.webhookUrl ?? "");
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    setDraft(url);
    setEditing(false);
    setError("");
  }

  return (
    <div>
      {!editing ? (
        <div className="flex items-center gap-2.5">
          <div
            className={`flex-1 font-mono text-[13px] bg-[color:var(--color-bg-subtle)] px-3.5 py-2.5 rounded-xl border border-[color:var(--color-border-subtle)] overflow-hidden text-ellipsis whitespace-nowrap ${url ? 'text-[color:var(--color-brand-light)]' : 'text-[color:var(--color-text-muted)]'}`}
          >
            {url || "No webhook URL configured"}
          </div>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              title="Open URL"
              className="shrink-0 p-2.5 rounded-xl border border-[color:var(--color-border-subtle)] text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-bg-subtle)] hover:text-[color:var(--color-text-primary)] transition-colors"
            >
              <ExternalLink size={16} />
            </a>
          )}
          <button
            onClick={() => { setEditing(true); setDraft(url); }}
            className="shrink-0 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[color:var(--color-border-subtle)] text-[13px] font-medium text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-bg-subtle)] hover:text-[color:var(--color-text-primary)] transition-colors"
          >
            <Pencil size={14} /> Edit
          </button>
          {success && (
            <span className="text-[13px] text-emerald-500 flex items-center gap-1.5 ml-1">
              <Check size={14} /> Saved
            </span>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5">
            <input
              type="url"
              className="flex-1 px-3.5 py-2.5 bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-border-subtle)] rounded-xl text-[14px] text-[color:var(--color-text-primary)] transition-all focus:outline-none focus:border-[color:var(--color-brand)] focus:ring-4 focus:ring-brand/20 placeholder:text-[color:var(--color-text-muted)]"
              placeholder="https://yourapp.com/api/webhooks/sash"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
            />
            <button
              onClick={handleSave}
              disabled={loading}
              className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-[color:var(--color-brand)] text-white rounded-xl text-[14px] font-medium hover:bg-[color:var(--color-brand-light)] transition-colors disabled:opacity-50"
            >
              <Check size={14} /> {loading ? "Saving…" : "Save"}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="shrink-0 p-2.5 rounded-xl border border-[color:var(--color-border-subtle)] text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-bg-subtle)] hover:text-[color:var(--color-text-primary)] transition-colors disabled:opacity-50"
            >
              <X size={16} />
            </button>
          </div>
          {error && (
            <p className="text-[13px] text-red-500">{error}</p>
          )}
          <p className="text-[12px] text-[color:var(--color-text-muted)]">
            Sash will send <code className="font-mono text-[11px] bg-[color:var(--color-bg-subtle)] px-1 py-0.5 rounded">X-Sash-Signature</code> HMAC headers with each request.
            Leave empty to disable.
          </p>
        </div>
      )}
    </div>
  );
}
