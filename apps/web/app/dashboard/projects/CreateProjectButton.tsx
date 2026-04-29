/**
 * app/dashboard/projects/CreateProjectButton.tsx
 *
 * Client component — "New Project" button that opens a modal form.
 * On submit, POSTs to /api/dashboard/projects and refreshes the page.
 *
 * Extracted as a separate client component so the parent (projects/page.tsx)
 * can remain a Server Component and benefit from server-side data fetching.
 */
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

export default function CreateProjectButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/dashboard/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to create project.");
        setLoading(false);
        return;
      }

      setOpen(false);
      setName("");
      // Navigate to the new project's detail page
      router.push(`/dashboard/projects/${data.project.id}`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  function handleClose() {
    if (!loading) {
      setOpen(false);
      setName("");
      setError("");
    }
  }

  return (
    <>
      <button
        id="create-project-btn"
        className="btn btn-primary"
        onClick={() => setOpen(true)}
      >
        <Plus size={15} /> New Project
      </button>

      {open && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 className="modal-title" style={{ margin: 0 }}>Create Project</h2>
              <button
                id="modal-close-btn"
                onClick={handleClose}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="toast toast-error" style={{ marginBottom: 16, animation: "none" }}>{error}</div>
            )}

            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label className="form-label" htmlFor="project-name">Project Name</label>
                <input
                  id="project-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. My App, Startup Dashboard..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  autoFocus
                />
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
                  A unique API key will be generated automatically.
                </p>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                <button
                  type="button"
                  id="modal-cancel-btn"
                  className="btn btn-ghost"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="modal-create-btn"
                  className="btn btn-primary"
                  disabled={loading || name.trim().length < 2}
                >
                  {loading ? "Creating…" : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
