import Link from "next/link";

export function Nav() {
  return (
    <header className="max-w-[1400px] mx-auto flex items-center justify-between px-6 md:px-10 py-6">
      <Link href="/" className="flex items-center gap-2 font-display text-lg tracking-wide uppercase">
        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" aria-hidden>
          <path d="M2 20 L9 6 L13 14 L16 9 L22 20 Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
        ParkAtlas
      </Link>
      <nav className="hidden md:flex gap-8 text-sm tracking-wide">
        <Link href="/discover/month/oct" className="opacity-75 hover:opacity-100 transition-opacity">Discover</Link>
        <Link href="/rankings" className="opacity-75 hover:opacity-100 transition-opacity">Rankings</Link>
        <Link href="/parks" className="opacity-75 hover:opacity-100 transition-opacity">Parks</Link>
      </nav>
    </header>
  );
}
