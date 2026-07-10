"use client";

import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { X, Check, ChevronDown } from "lucide-react";
import { problemSolutionItems } from "./content";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const rise: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function ProblemSolution() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      id="engineering"
      className="px-6 py-12 md:py-24"
      style={{ backgroundColor: "var(--wise-canvas)", color: "var(--wise-ink)" }}
    >
      <div className="mx-auto flex max-w-[1200px] flex-col gap-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
          className="max-w-[720px]"
        >
          <span
            className="text-xs font-semibold tracking-[0.14em] uppercase"
            style={{ color: "var(--wise-positive-deep)" }}
          >
            How it&apos;s actually built
          </span>
          <h2
            className="mt-3 text-3xl md:text-4xl"
            style={{ fontFamily: "var(--font-wise-display)", fontWeight: 900 }}
          >
            Four bugs we hit, and how the code answers them
          </h2>
          <p className="mt-4 text-base leading-relaxed" style={{ color: "var(--wise-body)" }}>
            No hand waving. Every line below points at the real file that solves it. Tap one open to
            read the detail.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 gap-4 lg:grid-cols-2"
        >
          {problemSolutionItems.map((entry, index) => {
            const isOpen = openIndex === index;
            const panelId = `engineering-detail-${index}`;

            return (
              <motion.div
                key={entry.problem}
                variants={rise}
                className="rounded-[var(--wise-radius-xl)] p-6"
                style={{
                  backgroundColor: "var(--wise-canvas-soft)",
                  border: "1px solid var(--wise-border)",
                }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: "var(--wise-negative-bg)", color: "#ffffff" }}
                  >
                    <X size={13} strokeWidth={3} />
                  </span>
                  <p className="text-sm font-semibold leading-relaxed">{entry.problem}</p>
                </div>

                <div className="mt-4 flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: "rgba(159,232,112,0.12)",
                      color: "var(--wise-positive-deep)",
                    }}
                  >
                    <Check size={13} strokeWidth={3} />
                  </span>
                  <p className="text-sm font-semibold leading-relaxed">{entry.solution}</p>
                </div>

                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="mt-4 flex w-full items-center gap-1.5 text-xs font-semibold tracking-[0.02em] uppercase transition-colors duration-200 focus-visible:outline-none"
                  style={{ color: isOpen ? "var(--wise-ink)" : "var(--wise-mute)" }}
                >
                  {isOpen ? "Hide detail" : "Read more"}
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="flex items-center"
                  >
                    <ChevronDown size={14} strokeWidth={2.5} />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={panelId}
                      key="detail"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <p
                        className="pt-4 text-sm leading-relaxed"
                        style={{ color: "var(--wise-body)" }}
                      >
                        {entry.detail}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
