import { formatLkr } from "@/lib/format/currency";
import type { Offer } from "@/types/domain";

interface PriceHistoryChartProps {
  offers: Offer[];
}

export function PriceHistoryChart({ offers }: PriceHistoryChartProps) {
  const points = offers.flatMap((offer) => offer.history.map((history) => history.priceLkr));
  const min = Math.min(...points);
  const max = Math.max(...points);
  const spread = Math.max(1, max - min);

  return (
    <section className="surface-card p-5">
      <h2 className="font-display text-lg font-semibold text-ink">Price trend snapshot</h2>
      <p className="mt-1 text-sm text-ink-soft">Simple MVP chart from recent snapshots across offers.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {offers.map((offer) => (
          <div key={offer.id} className="rounded-xl border border-black/5 p-4">
            <p className="text-sm font-semibold text-ink">Offer {offer.id.toUpperCase()}</p>
            <div className="mt-3 flex items-end gap-2">
              {offer.history.map((item) => {
                const height = 28 + ((item.priceLkr - min) / spread) * 80;
                return (
                  <div key={`${offer.id}-${item.capturedAt}`} className="flex-1 text-center">
                    <div className="w-full rounded-t bg-accent/80" style={{ height }} />
                    <p className="mt-1 text-[11px] text-ink-soft">{formatLkr(item.priceLkr)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
