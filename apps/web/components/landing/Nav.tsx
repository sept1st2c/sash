import Link from "next/link";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Architecture", href: "#architecture" },
  { label: "Demo", href: "#demo" },
  { label: "Docs", href: "#api" },
];

export default function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--wise-canvas-soft)] bg-[color:var(--wise-canvas)]">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-6 px-6 py-3 md:px-8">
        <Link
          href="/"
          className="text-[20px] font-[900] tracking-tight text-[color:var(--wise-ink)] [font-family:var(--font-wise-display)]"
        >
          S<span className="text-[color:var(--wise-primary)]">ash</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[14px] font-semibold leading-5 text-[color:var(--wise-ink)] transition-colors hover:text-[color:var(--wise-body)]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden items-center justify-center rounded-[var(--wise-radius-xl)] bg-[color:var(--wise-canvas-soft)] px-5 py-2.5 text-[16px] font-semibold leading-6 text-[color:var(--wise-ink)] transition-colors hover:bg-[color:var(--wise-surface-alt)] sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-[var(--wise-radius-xl)] bg-[color:var(--wise-primary)] px-5 py-2.5 text-[16px] font-semibold leading-6 text-[color:var(--wise-on-primary)] transition-colors hover:bg-[color:var(--wise-primary-active)]"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
