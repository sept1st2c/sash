"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
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
          ? "Suspend this user? They'll be logged out right away and can't sign back in until you lift it."
          : "Let this user back in? They'll be able to log in again right away."
      )
    ) {
      return;
    }

    setIsPending(true);
    try {
      await suspendUser(projectId, userId, isActive);
    } catch {
      alert("Couldn't update this user. Try again.");
    } finally {
      setIsPending(false);
      setIsOpen(false);
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        "Delete this user for good? There's no undo, and every session they have open gets killed with it."
      )
    ) {
      return;
    }

    setIsPending(true);
    try {
      await deleteUser(projectId, userId);
    } catch {
      alert("Couldn't delete this user. Try again.");
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
        className="p-1.5 rounded-[var(--wise-radius-sm)] transition-colors disabled:opacity-50 hover:bg-[color:var(--wise-surface-alt)]"
        style={{ color: "var(--wise-mute)" }}
      >
        <MoreHorizontal size={16} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute right-0 top-full mt-1 w-52 rounded-[var(--wise-radius-md)] py-1 z-20 overflow-hidden shadow-lg"
              style={{ backgroundColor: "var(--wise-canvas-soft)", border: "1px solid var(--wise-border)" }}
            >
              <button
                onClick={handleSuspendToggle}
                className="w-full flex items-center gap-2 px-3 py-2 text-[13px] transition-colors text-left hover:bg-[color:var(--wise-surface-alt)]"
                style={{ color: "var(--wise-ink)" }}
              >
                {isActive ? (
                  <>
                    <Ban size={14} style={{ color: "var(--wise-warning)" }} />
                    Suspend account
                  </>
                ) : (
                  <>
                    <CheckCircle size={14} style={{ color: "var(--wise-primary)" }} />
                    Reinstate account
                  </>
                )}
              </button>
              <div className="h-[1px] my-1" style={{ backgroundColor: "var(--wise-border)" }} />
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-medium transition-colors text-left"
                style={{ color: "var(--wise-negative)" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--wise-negative-bg)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <Trash2 size={14} />
                Delete account
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
