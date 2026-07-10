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
            className={`flex-1 min-w-0 font-mono text-[13px] bg-[color:var(--wise-canvas)] px-3.5 py-2.5 rounded-[var(--wise-radius-md)] border border-[color:var(--wise-border)] overflow-hidden text-ellipsis whitespace-nowrap ${url ? 'text-[color:var(--wise-primary)]' : 'text-[color:var(--wise-mute)]'}`}
          >
            {url || "No webhook URL set yet"}
          </div>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              title="Open URL"
              className="shrink-0 p-2.5 rounded-[var(--wise-radius-md)] border border-[color:var(--wise-border)] text-[color:var(--wise-body)] hover:bg-[color:var(--wise-surface-alt)] hover:text-[color:var(--wise-ink)] transition-colors"
            >
              <ExternalLink size={16} />
            </a>
          )}
          <button
            onClick={() => { setEditing(true); setDraft(url); }}
            className="shrink-0 flex items-center gap-2 px-3 py-2.5 rounded-[var(--wise-radius-md)] border border-[color:var(--wise-border)] text-[13px] font-medium text-[color:var(--wise-body)] hover:bg-[color:var(--wise-surface-alt)] hover:text-[color:var(--wise-ink)] transition-colors"
          >
            <Pencil size={14} /> Edit
          </button>
          {success && (
            <span className="text-[13px] text-[color:var(--wise-positive)] flex items-center gap-1.5 ml-1">
              <Check size={14} /> Saved
            </span>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5">
            <input
              type="url"
              className="flex-1 min-w-0 px-3.5 py-2.5 bg-[color:var(--wise-canvas)] border border-[color:var(--wise-border)] rounded-[var(--wise-radius-md)] text-[14px] text-[color:var(--wise-ink)] transition-all focus:outline-none focus:border-[color:var(--wise-primary)] focus:ring-4 focus:ring-[rgba(159,232,112,0.2)] placeholder:text-[color:var(--wise-mute)]"
              placeholder="https://yourapp.com/api/webhooks/sash"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
            />
            <button
              onClick={handleSave}
              disabled={loading}
              className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-[color:var(--wise-primary)] text-[color:var(--wise-on-primary)] rounded-[var(--wise-radius-md)] text-[14px] font-semibold hover:bg-[color:var(--wise-primary-active)] transition-colors disabled:opacity-50"
            >
              <Check size={14} /> {loading ? "Saving…" : "Save"}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="shrink-0 p-2.5 rounded-[var(--wise-radius-md)] border border-[color:var(--wise-border)] text-[color:var(--wise-body)] hover:bg-[color:var(--wise-surface-alt)] hover:text-[color:var(--wise-ink)] transition-colors disabled:opacity-50"
            >
              <X size={16} />
            </button>
          </div>
          {error && (
            <p className="text-[13px] text-[color:var(--wise-negative)]">{error}</p>
          )}
          <p className="text-[12px] text-[color:var(--wise-mute)]">
            Sash signs every request with an <code className="font-mono text-[11px] bg-[color:var(--wise-canvas)] px-1 py-0.5 rounded text-[color:var(--wise-primary)]">X-Sash-Signature</code> header.
            Leave this empty to turn webhooks off.
          </p>
        </div>
      )}
    </div>
  );
}
