"use client";

import { useState } from "react";
import { suspendUserAction, deleteUserAction } from "./actions";
import { MoreVertical, Ban, Trash2, CheckCircle2 } from "lucide-react";

export default function UserActionsDropdown({
  userId,
  projectId,
  isActive,
}: {
  userId: string;
  projectId: string;
  isActive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSuspend = async () => {
    if (!confirm(isActive ? "Suspend this user? They will be logged out immediately." : "Reactivate this user?")) return;
    setLoading(true);
    try {
      await suspendUserAction(userId, projectId);
    } catch (err) {
      alert("Action failed.");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Permanently delete this user? This cannot be undone.")) return;
    setLoading(true);
    try {
      await deleteUserAction(userId, projectId);
    } catch (err) {
      alert("Action failed.");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="p-1.5 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-bg-subtle)] rounded-md transition-colors"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 w-48 bg-[color:var(--color-bg-elevated)] border border-[color:var(--color-border-subtle)] rounded-xl shadow-lg z-20 overflow-hidden py-1">
            <button
              onClick={handleSuspend}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-[color:var(--color-bg-subtle)] transition-colors text-[color:var(--color-text-primary)]"
            >
              {isActive ? (
                <>
                  <Ban size={14} className="text-amber-500" /> Suspend User
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} className="text-emerald-500" /> Reactivate User
                </>
              )}
            </button>
            <div className="h-px bg-[color:var(--color-border-subtle)] my-1" />
            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-red-500/10 text-red-500 transition-colors"
            >
              <Trash2 size={14} /> Delete User
            </button>
          </div>
        </>
      )}
    </div>
  );
}
