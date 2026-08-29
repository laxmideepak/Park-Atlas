import Link from "next/link";

export const metadata = { title: "Off the trail | ParkAtlas" };

export default function NotFound() {
  return (
    <div className="bg-bone text-ink min-h-[70vh] flex items-center">
      <div className="max-w-[1360px] mx-auto px-6 md:px-10 py-24">
        <p className="font-mono text-mono-sm uppercase tracking-wide text-ink-soft mb-2">404</p>
        <h1 className="font-display italic text-display-xl leading-[0.95] mb-4">Off the trail.</h1>
        <p className="text-ink-soft max-w-[55ch] mb-8">
          That page isn&rsquo;t on the map. It may have moved, or the park code doesn&rsquo;t exist yet.
        </p>
        <div className="flex gap-6 font-mono text-mono-sm">
          <Link href="/" className="underline underline-offset-2 hover:text-brass transition-colors">
            Back to ParkAtlas
          </Link>
          <Link href="/parks" className="underline underline-offset-2 hover:text-brass transition-colors">
            All 63 parks
          </Link>
        </div>
      </div>
    </div>
  );
}
