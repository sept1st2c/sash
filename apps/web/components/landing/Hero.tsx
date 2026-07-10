"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { ArrowRight, Building2, Users } from "lucide-react";
import { heroContent } from "./content";

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  },
};

interface GraphNode {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  top: number;
  left: number;
}

const GRAPH_WIDTH = 420;
const GRAPH_HEIGHT = 340;

const projectNode: GraphNode = {
  id: "project",
  eyebrow: "PROJECT",
  title: "Acme Project",
  subtitle: "sash_live_7f3a9c…",
  top: 139,
  left: 0,
};

const userNodes: GraphNode[] = [
  { id: "user-1", eyebrow: "USER", title: "jane@acme.dev", subtitle: "verified · active", top: 24, left: 250 },
  { id: "user-2", eyebrow: "USER", title: "marcus@acme.dev", subtitle: "session active", top: 143, left: 250 },
  { id: "user-3", eyebrow: "USER", title: "amir@acme.dev", subtitle: "unverified", top: 262, left: 250 },
];

// From the Project node's right edge (150,171) to each User node's left edge.
const connectorPaths = [
  "M150,171 C195,171 195,52 250,52",
  "M150,171 L250,171",
  "M150,171 C195,171 195,290 250,290",
];

function ArchitectureGraphic() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative mx-auto" style={{ width: GRAPH_WIDTH, height: GRAPH_HEIGHT }}>
      <svg
        viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}
        width={GRAPH_WIDTH}
        height={GRAPH_HEIGHT}
        className="absolute inset-0"
        fill="none"
      >
        {connectorPaths.map((d, i) => (
          <motion.path
            key={d}
            d={d}
            stroke={i === 1 ? "var(--wise-primary)" : "var(--wise-border)"}
            strokeWidth={i === 1 ? 1.5 : 1}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.35 + i * 0.15, ease: "easeInOut" }}
          />
        ))}
      </svg>

      <motion.div
        aria-hidden
        className="absolute h-2 w-2 rounded-full"
        style={{
          top: 171 - 4,
          background: "var(--wise-primary)",
          boxShadow: "0 0 12px 3px rgba(159,232,112,0.55)",
        }}
        initial={{ left: 146, opacity: 0 }}
        animate={
          reduceMotion
            ? { left: 146, opacity: 1 }
            : { left: [146, 246, 146], opacity: [0, 1, 1, 0] }
        }
        transition={
          reduceMotion
            ? { duration: 0.4, delay: 1.1 }
            : { duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 1.1 }
        }
      />

      <motion.span
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.3 }}
        className="absolute rounded-[var(--wise-radius-sm)] px-2 py-0.5 font-mono text-[9px]"
        style={{
          top: 171 - 34,
          left: 172,
          backgroundColor: "var(--wise-canvas)",
          border: "1px solid var(--wise-border)",
          color: "var(--wise-mute)",
        }}
      >
        session · 7d TTL
      </motion.span>

      <GraphCard node={projectNode} delay={0.1} accent />
      {userNodes.map((node, i) => (
        <GraphCard key={node.id} node={node} delay={0.5 + i * 0.15} />
      ))}
    </div>
  );
}

function GraphCard({ node, delay, accent }: { node: GraphNode; delay: number; accent?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="absolute flex w-[150px] items-start gap-2 rounded-[var(--wise-radius-md)] p-3"
      style={{
        top: node.top,
        left: node.left,
        backgroundColor: "var(--wise-canvas)",
        border: `1px solid ${accent ? "var(--wise-primary)" : "var(--wise-border)"}`,
      }}
    >
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--wise-radius-sm)]"
        style={{ backgroundColor: "var(--wise-surface-alt)", color: "var(--wise-primary)" }}
      >
        {accent ? <Building2 size={13} strokeWidth={2.25} /> : <Users size={13} strokeWidth={2.25} />}
      </div>
      <div className="min-w-0">
        <span className="text-[9px] font-semibold tracking-[0.1em]" style={{ color: "var(--wise-mute)" }}>
          {node.eyebrow}
        </span>
        <p className="truncate font-mono text-[11px] font-semibold" style={{ color: "var(--wise-ink)" }}>
          {node.title}
        </p>
        <p className="truncate text-[10px]" style={{ color: "var(--wise-body)" }}>
          {node.subtitle}
        </p>
      </div>
    </motion.div>
  );
}

function HeroBackground() {
  const reduceMotion = useReducedMotion();

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(var(--wise-border) 1px, transparent 1px), linear-gradient(90deg, var(--wise-border) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 65% 60% at 65% 30%, black 25%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 65% 60% at 65% 30%, black 25%, transparent 80%)",
        }}
      />
      <motion.div
        className="absolute -top-40 -right-40 h-[560px] w-[560px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(159,232,112,0.22) 0%, rgba(159,232,112,0) 70%)" }}
        animate={reduceMotion ? undefined : { x: [0, 26, 0], y: [0, 18, 0], opacity: [0.55, 0.85, 0.55] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-32 -left-24 h-[380px] w-[380px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(159,232,112,0.12) 0%, rgba(159,232,112,0) 70%)" }}
        animate={reduceMotion ? undefined : { x: [0, -16, 0], y: [0, 12, 0], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
    </div>
  );
}

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-[color:var(--wise-canvas-soft)] px-6 py-16 md:px-8 md:py-24"
    >
      <HeroBackground />

      <div className="relative mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-16 xl:grid-cols-[1.15fr_0.85fr]">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col items-start gap-6 text-left"
        >
          <motion.span
            variants={item}
            className="inline-flex items-center rounded-[var(--wise-radius-pill)] px-4 py-1 text-[12px] font-semibold uppercase tracking-wide"
            style={{
              backgroundColor: "rgba(159,232,112,0.12)",
              color: "var(--wise-primary)",
              border: "1px solid var(--wise-border)",
            }}
          >
            {heroContent.eyebrow}
          </motion.span>

          <motion.h1
            variants={item}
            className="max-w-[900px] text-[40px] font-[900] leading-[1.05] tracking-tight text-[color:var(--wise-ink)] [font-family:var(--font-wise-display)] sm:text-[64px] sm:leading-[54.4px] lg:text-[88px] lg:leading-[76px]"
          >
            {heroContent.headline}
          </motion.h1>

          <motion.p
            variants={item}
            className="max-w-[640px] text-[18px] leading-[28px] text-[color:var(--wise-body)] sm:text-[20px] sm:leading-[30px]"
          >
            {heroContent.subhead}
          </motion.p>

          <motion.div variants={item} className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href={heroContent.primaryCta.href}
              className="inline-flex items-center gap-2 rounded-[var(--wise-radius-xl)] bg-[color:var(--wise-primary)] px-6 py-3 text-[16px] font-semibold leading-6 text-[color:var(--wise-on-primary)] transition-transform hover:-translate-y-0.5 hover:bg-[color:var(--wise-primary-active)]"
            >
              {heroContent.primaryCta.label}
              <ArrowRight size={18} />
            </Link>
            <Link
              href={heroContent.secondaryCta.href}
              className="inline-flex items-center rounded-[var(--wise-radius-xl)] border border-[color:var(--wise-ink)] bg-[color:var(--wise-canvas)] px-6 py-3 text-[16px] font-semibold leading-6 text-[color:var(--wise-ink)] transition-colors hover:bg-[color:var(--wise-canvas-soft)]"
            >
              {heroContent.secondaryCta.label}
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="hidden xl:block"
        >
          <ArchitectureGraphic />
        </motion.div>
      </div>
    </section>
  );
}
