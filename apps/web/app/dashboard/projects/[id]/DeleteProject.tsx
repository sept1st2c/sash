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
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 border border-red-500/30 text-red-500 rounded-xl text-[14px] font-medium hover:bg-red-500/10 transition-colors"
      >
        <Trash2 size={15} /> Delete Project
      </button>

      {open && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => !loading && setOpen(false)}
        >
          <div 
            className="w-full max-w-[440px] bg-[color:var(--color-bg-elevated)] border border-[color:var(--color-border-bright)] rounded-3xl p-8 shadow-2xl animate-in slide-in-from-bottom-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-bold text-red-500 m-0">Delete Project</h2>
              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                className="p-1 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-bg-subtle)] rounded-lg transition-colors disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-[14px] text-[color:var(--color-text-secondary)] mb-5 leading-relaxed">
              This will permanently delete <strong className="text-[color:var(--color-text-primary)] font-semibold">{projectName}</strong> and
              all its users. This action <strong className="text-red-500 font-semibold">cannot be undone</strong>.
            </p>

            <div className="mb-5">
              <label className="block text-[13px] font-medium text-[color:var(--color-text-secondary)] mb-1.5" htmlFor="delete-confirm-input">
                Type <strong className="text-[color:var(--color-text-primary)] font-semibold">{projectName}</strong> to confirm
              </label>
              <input
                id="delete-confirm-input"
                type="text"
                className="w-full px-3.5 py-2.5 bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-border-subtle)] rounded-xl text-[14px] text-[color:var(--color-text-primary)] transition-all focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 placeholder:text-[color:var(--color-text-muted)]"
                placeholder={projectName}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoFocus
              />
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg text-sm font-medium bg-red-500/10 border border-red-500/20 text-red-500">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2.5 mt-2">
              <button
                className="px-4 py-2 rounded-xl text-[14px] font-medium text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-bg-subtle)] hover:text-[color:var(--color-text-primary)] transition-colors disabled:opacity-50"
                onClick={() => { setOpen(false); setConfirm(""); }}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl text-[14px] font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
