import Link from "next/link";

const links = [
  { href: "/products", label: "Products" },
  { href: "/stores", label: "Stores" },
  { href: "/dashboard", label: "Dashboard" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 mt-3 rounded-2xl border border-black/5 bg-surface/90 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="font-display text-xl font-semibold tracking-tight text-ink">
          PricePilot LK
        </Link>
        <nav className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 transition hover:bg-surface-2 hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/sign-in"
            className="rounded-lg bg-accent px-3 py-2 text-white transition hover:opacity-90"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}
