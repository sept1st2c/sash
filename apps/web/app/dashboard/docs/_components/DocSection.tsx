"use client";
import { motion } from "motion/react";

interface DocSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  badge?: string;
}

export function DocSection({ title, description, children, badge }: DocSectionProps) {
  return (
    <motion.section
      className="mb-10"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-1.5">
          <h2
            className="text-[19px] tracking-tight"
            style={{ fontFamily: "var(--font-wise-display)", fontWeight: 900, color: "var(--wise-ink)" }}
          >
            {title}
          </h2>
          {badge && (
            <span
              className="px-2 py-0.5 rounded-[var(--wise-radius-pill)] text-[10px] font-semibold uppercase tracking-wider"
              style={{ backgroundColor: "rgba(159,232,112,0.12)", color: "var(--wise-primary)" }}
            >
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="max-w-[640px] text-[14px] leading-relaxed" style={{ color: "var(--wise-body)" }}>
            {description}
          </p>
        )}
      </div>
      <div>{children}</div>
    </motion.section>
  );
}

interface PropRowProps {
  name: string;
  type: string;
  required?: boolean;
  description: string;
  defaultValue?: string;
}

export function PropRow({ name, type, required, description, defaultValue }: PropRowProps) {
  return (
    <tr className="border-b last:border-0" style={{ borderColor: "var(--wise-border)" }}>
      <td className="py-3 pr-4 align-top">
        <code className="text-[13px] font-mono" style={{ color: "var(--wise-primary)" }}>{name}</code>
        {required && (
          <span className="ml-1.5 text-[10px] font-semibold" style={{ color: "var(--wise-negative)" }}>
            required
          </span>
        )}
      </td>
      <td className="py-3 pr-4 align-top">
        <code className="text-[12px] font-mono" style={{ color: "var(--wise-accent-orange)" }}>{type}</code>
      </td>
      <td className="py-3 pr-4 align-top text-[13px] leading-relaxed" style={{ color: "var(--wise-body)" }}>
        {description}
        {defaultValue && (
          <span className="ml-1" style={{ color: "var(--wise-mute)" }}>
            Default: <code className="font-mono">{defaultValue}</code>
          </span>
        )}
      </td>
    </tr>
  );
}

export function PropsTable({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-[var(--wise-radius-lg)] overflow-hidden my-4"
      style={{ border: "1px solid var(--wise-border)" }}
    >
      <table className="w-full text-left">
        <thead>
          <tr style={{ backgroundColor: "var(--wise-surface-alt)", borderBottom: "1px solid var(--wise-border)" }}>
            <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--wise-mute)" }}>Prop</th>
            <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--wise-mute)" }}>Type</th>
            <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--wise-mute)" }}>Description</th>
          </tr>
        </thead>
        <tbody
          className="divide-y divide-[color:var(--wise-border)]"
          style={{ backgroundColor: "var(--wise-canvas-soft)" }}
        >
          {children}
        </tbody>
      </table>
    </div>
  );
}
