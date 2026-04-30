interface DocSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  badge?: string;
}

export function DocSection({ title, description, children, badge }: DocSectionProps) {
  return (
    <section className="mb-10">
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-[17px] font-bold text-[color:var(--color-text-primary)] tracking-tight">
            {title}
          </h2>
          {badge && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[color:var(--color-brand-dim)] text-[color:var(--color-brand-light)] uppercase tracking-wider">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-[14px] text-[color:var(--color-text-secondary)] leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <div>{children}</div>
    </section>
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
    <tr className="border-b border-[color:var(--color-border-subtle)] last:border-0">
      <td className="py-3 pr-4 align-top">
        <code className="text-[13px] font-mono text-[color:var(--color-brand-light)]">{name}</code>
        {required && <span className="ml-1.5 text-[10px] text-red-400 font-semibold">required</span>}
      </td>
      <td className="py-3 pr-4 align-top">
        <code className="text-[12px] font-mono text-amber-400">{type}</code>
      </td>
      <td className="py-3 pr-4 align-top text-[13px] text-[color:var(--color-text-secondary)]">
        {description}
        {defaultValue && (
          <span className="ml-1 text-[color:var(--color-text-muted)]">Default: <code className="font-mono">{defaultValue}</code></span>
        )}
      </td>
    </tr>
  );
}

export function PropsTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[color:var(--color-border-subtle)] overflow-hidden my-4">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-[color:var(--color-bg-page)] border-b border-[color:var(--color-border-subtle)]">
            <th className="px-4 py-2.5 text-[11px] font-semibold text-[color:var(--color-text-muted)] uppercase tracking-wider">Prop</th>
            <th className="px-4 py-2.5 text-[11px] font-semibold text-[color:var(--color-text-muted)] uppercase tracking-wider">Type</th>
            <th className="px-4 py-2.5 text-[11px] font-semibold text-[color:var(--color-text-muted)] uppercase tracking-wider">Description</th>
          </tr>
        </thead>
        <tbody className="bg-[color:var(--color-bg-surface)] divide-y divide-[color:var(--color-border-subtle)] px-4">
          {children}
        </tbody>
      </table>
    </div>
  );
}
