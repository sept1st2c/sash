"use client";

import { useState } from "react";
import { MoreHorizontal, Ban, Trash2, CheckCircle } from "lucide-react";
import { suspendUser, deleteUser } from "./actions";

export default function UserActionsDropdown({
  projectId,
  userId,
  isActive,
}: {
  projectId: string;
  userId: string;
  isActive: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleSuspendToggle() {
    if (
      !confirm(
        isActive
          ? "Suspend this user? They will be instantly logged out and blocked from logging in."
          : "Unsuspend this user? They will be able to log in again."
      )
    ) {
      return;
    }

    setIsPending(true);
    try {
      await suspendUser(projectId, userId, isActive);
    } catch (err) {
      alert("Failed to toggle suspension");
    } finally {
      setIsPending(false);
      setIsOpen(false);
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        "Permanently delete this user? This cannot be undone and will destroy all their active sessions."
      )
    ) {
      return;
    }

    setIsPending(true);
    try {
      await deleteUser(projectId, userId);
    } catch (err) {
      alert("Failed to delete user");
    } finally {
      setIsPending(false);
      setIsOpen(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="p-1.5 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-bg-subtle)] rounded-md transition-colors disabled:opacity-50"
      >
        <MoreHorizontal size={16} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 top-full mt-1 w-48 bg-[color:var(--color-bg-elevated)] border border-[color:var(--color-border-subtle)] rounded-[12px] shadow-lg py-1 z-20 overflow-hidden">
            <button
              onClick={handleSuspendToggle}
              className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-bg-subtle)] transition-colors text-left"
            >
              {isActive ? (
                <>
                  <Ban size={14} className="text-amber-500" />
                  Suspend User
                </>
              ) : (
                <>
                  <CheckCircle size={14} className="text-emerald-500" />
                  Unsuspend User
                </>
              )}
            </button>
            <div className="h-[1px] bg-[color:var(--color-border-subtle)] my-1" />
            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-red-500 hover:bg-red-500/10 transition-colors text-left"
            >
              <Trash2 size={14} />
              Delete User
            </button>
          </div>
        </>
      )}
    </div>
  );
}
