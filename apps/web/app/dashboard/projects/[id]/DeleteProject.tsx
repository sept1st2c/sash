/**
 * app/dashboard/projects/[id]/DeleteProject.tsx
 *
 * Client component — delete project with a confirmation modal.
 * Requires the user to type the project name before deleting (safety gate).
 * DELETEs to /api/dashboard/projects/[id] and redirects to /dashboard/projects.
 *
 * PROPS:
 *   projectId   — the project to delete
 *   projectName — shown in the modal and used for confirmation input
 */
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X } from "lucide-react";

interface Props {
  projectId: string;
  projectName: string;
}

export default function DeleteProject({ projectId, projectName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (confirm !== projectName) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/dashboard/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to delete project.");
        setLoading(false);
        return;
      }

      router.push("/dashboard/projects");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        id={`delete-project-btn-${projectId}`}
        className="btn btn-danger"
        onClick={() => setOpen(true)}
      >
        <Trash2 size={15} /> Delete Project
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => !loading && setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 className="modal-title" style={{ margin: 0, color: "var(--danger)" }}>Delete Project</h2>
              <button
                id="delete-modal-close"
                onClick={() => setOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}
                disabled={loading}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20, lineHeight: 1.6 }}>
              This will permanently delete <strong style={{ color: "var(--text-primary)" }}>{projectName}</strong> and
              all its users. This action <strong style={{ color: "var(--danger)" }}>cannot be undone</strong>.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label className="form-label" htmlFor="delete-confirm-input">
                Type <strong style={{ color: "var(--text-primary)" }}>{projectName}</strong> to confirm
              </label>
              <input
                id="delete-confirm-input"
                type="text"
                className="form-input"
                placeholder={projectName}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoFocus
              />
            </div>

            {error && (
              <div className="toast toast-error" style={{ marginBottom: 16, animation: "none" }}>{error}</div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                id="delete-modal-cancel"
                className="btn btn-ghost"
                onClick={() => { setOpen(false); setConfirm(""); }}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                id="delete-modal-confirm"
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={confirm !== projectName || loading}
              >
                <Trash2 size={15} /> {loading ? "Deleting…" : "Delete Forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
