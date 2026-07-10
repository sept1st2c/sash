"use client";

import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { featureGridItems } from "./content";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const rise: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function FeatureGrid() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = featureGridItems[activeIndex];

  return (
    <section id="features" className="bg-[color:var(--wise-canvas)] px-6 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-[1200px]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
          className="max-w-[600px]"
        >
          <span
            className="text-xs font-semibold tracking-[0.14em] uppercase"
            style={{ color: "var(--wise-positive-deep)" }}
          >
            What&apos;s inside
          </span>
          <h2 className="mt-3 text-[32px] font-[900] leading-[38px] tracking-tight text-[color:var(--wise-ink)] [font-family:var(--font-wise-display)] sm:text-[40px] sm:leading-[44px]">
            Everything a real auth system needs
          </h2>
          <p className="mt-4 max-w-[480px] text-[16px] leading-6 text-[color:var(--wise-body)]">
            Pick a piece. See exactly how it works, straight from the source.
          </p>
        </motion.div>

        <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-16">
          {/* ── Left: topic list, no box, no inner scroll ─────────────────── */}
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            className="flex min-w-0 flex-col"
          >
            {featureGridItems.map((feature, i) => {
              const isActive = i === activeIndex;
              return (
                <motion.button
                  key={feature.id}
                  type="button"
                  variants={rise}
                  aria-current={isActive ? "true" : undefined}
                  onMouseEnter={() => setActiveIndex(i)}
                  onFocus={() => setActiveIndex(i)}
                  onClick={() => setActiveIndex(i)}
                  className="group relative flex min-w-0 items-center gap-4 py-5 pl-5 text-left"
                  style={{
                    borderBottom:
                      i === featureGridItems.length - 1 ? "none" : "1px solid var(--wise-border)",
                  }}
                >
                  {isActive && (
                    <motion.span
                      layoutId="feature-indicator"
                      className="absolute inset-y-2 left-0 w-[3px] rounded-full"
                      style={{ backgroundColor: "var(--wise-primary)" }}
                      transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    />
                  )}
                  <span
                    className="shrink-0 font-mono text-xs transition-colors duration-200"
                    style={{ color: isActive ? "var(--wise-positive-deep)" : "var(--wise-mute)" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="min-w-0 flex-1 truncate text-[18px] font-semibold leading-snug transition-colors duration-200 sm:text-[20px]"
                    style={{ color: isActive ? "var(--wise-ink)" : "var(--wise-body)" }}
                  >
                    {feature.title}
                  </span>
                  <motion.span
                    aria-hidden
                    animate={{ x: isActive ? 0 : -6, opacity: isActive ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-auto hidden shrink-0 text-lg sm:block"
                    style={{ color: "var(--wise-primary)" }}
                  >
                    →
                  </motion.span>
                </motion.button>
              );
            })}
          </motion.div>

          {/* ── Right: synced detail panel ────────────────────────────────── */}
          <div className="min-w-0 lg:sticky lg:top-24">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="min-w-0"
              >
                <span
                  className="font-mono text-xs font-semibold"
                  style={{ color: "var(--wise-positive-deep)" }}
                >
                  {String(activeIndex + 1).padStart(2, "0")} / {String(featureGridItems.length).padStart(2, "0")}
                </span>

                <h3
                  className="mt-3 text-[26px] leading-[1.15] sm:text-[32px]"
                  style={{
                    fontFamily: "var(--font-wise-display)",
                    fontWeight: 900,
                    color: "var(--wise-ink)",
                  }}
                >
                  {active.title}
                </h3>

                <p
                  className="mt-4 max-w-[480px] text-[15px] leading-relaxed"
                  style={{ color: "var(--wise-body)" }}
                >
                  {active.description}
                </p>

                <div
                  className="mt-6 min-w-0 overflow-hidden rounded-[var(--wise-radius-lg)]"
                  style={{ backgroundColor: "var(--wise-code-bg)", border: "1px solid var(--wise-border)" }}
                >
                  <div
                    className="flex items-center gap-2 px-4 py-2.5"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#ff5f56" }} />
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#ffbd2e" }} />
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#27c93f" }} />
                    <span
                      className="ml-2 min-w-0 truncate font-mono text-[11px]"
                      style={{ color: "var(--wise-mute)" }}
                    >
                      {active.code.filename}
                    </span>
                  </div>
                  <pre className="wise-scroll overflow-x-auto overflow-y-hidden p-4 font-mono text-[12.5px] leading-relaxed">
                    {active.code.lines.map((line, i) => (
                      <div key={i} style={{ color: "var(--wise-primary)" }}>
                        {line || " "}
                      </div>
                    ))}
                  </pre>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
