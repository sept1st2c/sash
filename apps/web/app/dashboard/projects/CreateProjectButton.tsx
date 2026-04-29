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
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[color:var(--color-brand)] text-white rounded-xl text-[14px] font-medium shadow-[0_0_20px_rgba(99,102,241,0.25)] hover:bg-[color:var(--color-brand-light)] hover:-translate-y-[1px] transition-all"
      >
        <Plus size={15} /> New Project
      </button>

      {open && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={handleClose}
        >
          <div 
            className="w-full max-w-[440px] bg-[color:var(--color-bg-elevated)] border border-[color:var(--color-border-bright)] rounded-3xl p-8 shadow-2xl animate-in slide-in-from-bottom-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[18px] font-bold text-[color:var(--color-text-primary)] m-0">Create Project</h2>
              <button
                onClick={handleClose}
                className="p-1 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-bg-subtle)] rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg text-sm font-medium bg-red-500/10 border border-red-500/20 text-red-500">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label className="block text-[13px] font-medium text-[color:var(--color-text-secondary)] mb-1.5" htmlFor="project-name">
                  Project Name
                </label>
                <input
                  id="project-name"
                  type="text"
                  className="w-full px-3.5 py-2.5 bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-border-subtle)] rounded-xl text-[14px] text-[color:var(--color-text-primary)] transition-all focus:outline-none focus:border-[color:var(--color-brand)] focus:ring-4 focus:ring-brand/20 placeholder:text-[color:var(--color-text-muted)]"
                  placeholder="e.g. My App, Startup Dashboard..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  autoFocus
                />
                <p className="text-[12px] text-[color:var(--color-text-muted)] mt-1.5">
                  A unique API key will be generated automatically.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 mt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl text-[14px] font-medium text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-bg-subtle)] hover:text-[color:var(--color-text-primary)] transition-colors disabled:opacity-50"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[color:var(--color-brand)] text-white rounded-xl text-[14px] font-medium hover:bg-[color:var(--color-brand-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
