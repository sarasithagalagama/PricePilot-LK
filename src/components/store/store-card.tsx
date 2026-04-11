import Link from "next/link";
import { formatColomboDate } from "@/lib/format/date";
import type { Store } from "@/types/domain";

interface StoreCardProps {
  store: Store;
  offerCount: number;
}

export function StoreCard({ store, offerCount }: StoreCardProps) {
  return (
    <article className="surface-card p-5">
      <h3 className="font-display text-lg font-semibold text-ink">{store.name}</h3>
      <p className="mt-1 text-sm text-ink-soft">{store.district} · {offerCount} tracked offers</p>
      <p className="mt-2 text-xs text-ink-soft">Last sync: {formatColomboDate(store.lastSyncAt)}</p>
      <Link
        href={`/stores/${store.slug}`}
        className="mt-4 inline-flex rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
      >
        View store
      </Link>
    </article>
  );
}
