/**
 * app/dashboard/projects/[id]/WebhookEditor.tsx
 *
 * Client component — inline editor for the project's webhook URL.
 * PATCHes to /api/dashboard/projects/[id] on save.
 *
 * PROPS:
 *   projectId  — the project's ID
 *   currentUrl — current value of webhookUrl (empty string if none)
 */
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
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            id={`webhook-display-${projectId}`}
            className="mono"
            style={{ flex: 1, color: url ? "var(--brand-light)" : "var(--text-muted)" }}
          >
            {url || "No webhook URL configured"}
          </div>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              id={`webhook-link-${projectId}`}
              className="btn btn-ghost btn-sm"
              title="Open URL"
            >
              <ExternalLink size={14} />
            </a>
          )}
          <button
            id={`webhook-edit-${projectId}`}
            className="btn btn-ghost btn-sm"
            onClick={() => { setEditing(true); setDraft(url); }}
          >
            <Pencil size={14} /> Edit
          </button>
          {success && (
            <span style={{ fontSize: 13, color: "var(--success)", display: "flex", alignItems: "center", gap: 4 }}>
              <Check size={14} /> Saved
            </span>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              id={`webhook-input-${projectId}`}
              type="url"
              className="form-input"
              placeholder="https://yourapp.com/api/webhooks/sash"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
            />
            <button
              id={`webhook-save-${projectId}`}
              className="btn btn-primary btn-sm"
              onClick={handleSave}
              disabled={loading}
              style={{ flexShrink: 0 }}
            >
              <Check size={14} /> {loading ? "Saving…" : "Save"}
            </button>
            <button
              id={`webhook-cancel-${projectId}`}
              className="btn btn-ghost btn-sm"
              onClick={handleCancel}
              disabled={loading}
              style={{ flexShrink: 0 }}
            >
              <X size={14} />
            </button>
          </div>
          {error && (
            <p style={{ fontSize: 13, color: "var(--danger)" }}>{error}</p>
          )}
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Sash will send <code style={{ fontSize: 11 }}>X-Sash-Signature</code> HMAC headers with each request.
            Leave empty to disable.
          </p>
        </div>
      )}
    </div>
  );
}
