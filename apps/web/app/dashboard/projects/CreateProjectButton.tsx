"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
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
        setError(data.error ?? "Couldn't create the project. Try again.");
        setLoading(false);
        return;
      }

      setOpen(false);
      setName("");
      // Navigate to the new project's detail page
      router.push(`/dashboard/projects/${data.project.id}`);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
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
        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[color:var(--wise-primary)] text-[color:var(--wise-on-primary)] rounded-[var(--wise-radius-md)] text-[14px] font-semibold shadow-[0_0_20px_rgba(159,232,112,0.25)] hover:bg-[color:var(--wise-primary-active)] hover:-translate-y-[1px] transition-all"
      >
        <Plus size={15} /> New project
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 bg-[rgba(5,7,4,0.7)] backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
          >
            <motion.div
              className="w-full max-w-[440px] bg-[color:var(--wise-canvas-soft)] border border-[color:var(--wise-border)] rounded-[var(--wise-radius-xl)] p-8"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[18px] font-bold text-[color:var(--wise-ink)] m-0">New project</h2>
                <button
                  onClick={handleClose}
                  className="p-1 text-[color:var(--wise-mute)] hover:text-[color:var(--wise-ink)] hover:bg-[color:var(--wise-surface-alt)] rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg text-sm font-medium bg-[color:var(--wise-negative-bg)] border border-[rgba(255,122,122,0.3)] text-[color:var(--wise-negative)]">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-[color:var(--wise-body)] mb-1.5" htmlFor="project-name">
                    Project name
                  </label>
                  <input
                    id="project-name"
                    type="text"
                    className="w-full px-3.5 py-2.5 bg-[color:var(--wise-canvas)] border border-[color:var(--wise-border)] rounded-[var(--wise-radius-md)] text-[14px] text-[color:var(--wise-ink)] transition-all focus:outline-none focus:border-[color:var(--wise-primary)] focus:ring-4 focus:ring-[rgba(159,232,112,0.2)] placeholder:text-[color:var(--wise-mute)]"
                    placeholder="e.g. My App, Startup Dashboard"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={2}
                    autoFocus
                  />
                  <p className="text-[12px] text-[color:var(--wise-mute)] mt-1.5">
                    We&apos;ll generate a unique API key for it right away.
                  </p>
                </div>

                <div className="flex justify-end gap-2.5 mt-2">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-[var(--wise-radius-md)] text-[14px] font-medium text-[color:var(--wise-body)] hover:bg-[color:var(--wise-surface-alt)] hover:text-[color:var(--wise-ink)] transition-colors disabled:opacity-50"
                    onClick={handleClose}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[color:var(--wise-primary)] text-[color:var(--wise-on-primary)] rounded-[var(--wise-radius-md)] text-[14px] font-semibold hover:bg-[color:var(--wise-primary-active)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading || name.trim().length < 2}
                  >
                    {loading ? "Creating…" : "Create project"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
