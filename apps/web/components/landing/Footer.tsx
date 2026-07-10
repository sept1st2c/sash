import Link from "next/link";
import { footerContent } from "./content";

export default function Footer() {
  return (
    <footer className="bg-[color:var(--wise-ink)] px-6 py-12 text-[color:var(--wise-canvas-soft)] md:px-8 md:py-16">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[20px] font-[900] tracking-tight [font-family:var(--font-wise-display)]">
            S<span className="text-[color:var(--wise-primary)]">ash</span>
          </div>
          <p className="mt-2 max-w-[380px] text-[14px] leading-5">{footerContent.tagline}</p>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-3">
          {footerContent.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[14px] leading-5 transition-colors hover:text-[color:var(--wise-primary)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mx-auto mt-10 max-w-[1200px] border-t border-[color:var(--wise-canvas-soft)]/20 pt-6 text-[12px] leading-4 text-[color:var(--wise-mute)]">
        © {new Date().getFullYear()} Sash. A learning project, not affiliated with Clerk or Auth0.
      </div>
    </footer>
  );
}
