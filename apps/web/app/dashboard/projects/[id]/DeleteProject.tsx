"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
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
        setError(data.error ?? "Couldn't delete the project.");
        setLoading(false);
        return;
      }

      router.push("/dashboard/projects");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 border border-[rgba(255,122,122,0.35)] text-[color:var(--wise-negative)] rounded-[var(--wise-radius-md)] text-[14px] font-medium hover:bg-[color:var(--wise-negative-bg)] transition-colors"
      >
        <Trash2 size={15} /> Delete project
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 bg-[rgba(5,7,4,0.7)] backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => !loading && setOpen(false)}
          >
            <motion.div
              className="w-full max-w-[440px] bg-[color:var(--wise-canvas-soft)] border border-[rgba(255,122,122,0.35)] rounded-[var(--wise-radius-xl)] p-8"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[18px] font-bold text-[color:var(--wise-negative)] m-0">Delete project</h2>
                <button
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="p-1 text-[color:var(--wise-mute)] hover:text-[color:var(--wise-ink)] hover:bg-[color:var(--wise-surface-alt)] rounded-lg transition-colors disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-[14px] text-[color:var(--wise-body)] mb-5 leading-relaxed">
                Deleting <strong className="text-[color:var(--wise-ink)] font-semibold">{projectName}</strong> removes
                it and every one of its users for good. There&apos;s{" "}
                <strong className="text-[color:var(--wise-negative)] font-semibold">no undo</strong>.
              </p>

              <div className="mb-5">
                <label className="block text-[13px] font-medium text-[color:var(--wise-body)] mb-1.5" htmlFor="delete-confirm-input">
                  Type <strong className="text-[color:var(--wise-ink)] font-semibold">{projectName}</strong> to confirm
                </label>
                <input
                  id="delete-confirm-input"
                  type="text"
                  className="w-full px-3.5 py-2.5 bg-[color:var(--wise-canvas)] border border-[color:var(--wise-border)] rounded-[var(--wise-radius-md)] text-[14px] text-[color:var(--wise-ink)] transition-all focus:outline-none focus:border-[color:var(--wise-negative)] focus:ring-4 focus:ring-[rgba(255,122,122,0.2)] placeholder:text-[color:var(--wise-mute)]"
                  placeholder={projectName}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoFocus
                />
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg text-sm font-medium bg-[color:var(--wise-negative-bg)] border border-[rgba(255,122,122,0.3)] text-[color:var(--wise-negative)]">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2.5 mt-2">
                <button
                  className="px-4 py-2 rounded-[var(--wise-radius-md)] text-[14px] font-medium text-[color:var(--wise-body)] hover:bg-[color:var(--wise-surface-alt)] hover:text-[color:var(--wise-ink)] transition-colors disabled:opacity-50"
                  onClick={() => { setOpen(false); setConfirm(""); }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-[color:var(--wise-negative)] text-[color:var(--wise-on-primary)] rounded-[var(--wise-radius-md)] text-[14px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleDelete}
                  disabled={confirm !== projectName || loading}
                >
                  <Trash2 size={15} /> {loading ? "Deleting…" : "Delete for good"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
