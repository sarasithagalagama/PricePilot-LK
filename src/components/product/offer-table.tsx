import { formatLkr } from "@/lib/format/currency";
import { formatColomboDate } from "@/lib/format/date";
import type { Offer } from "@/types/domain";

interface OfferTableProps {
  offers: Offer[];
  storeNameById: Record<string, string>;
}

function formatAvailability(value: Offer["availability"]) {
  if (value === "in_stock") return "In stock";
  if (value === "limited") return "Limited";
  return "Out of stock";
}

export function OfferTable({ offers, storeNameById }: OfferTableProps) {
  const sorted = [...offers].sort((a, b) => a.currentPriceLkr - b.currentPriceLkr);

  return (
    <div className="surface-card overflow-hidden">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-surface-2 text-left text-ink-soft">
          <tr>
            <th className="px-4 py-3 font-semibold">Store</th>
            <th className="px-4 py-3 font-semibold">Price</th>
            <th className="px-4 py-3 font-semibold">Availability</th>
            <th className="px-4 py-3 font-semibold">Updated</th>
            <th className="px-4 py-3 font-semibold">Buy</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((offer, index) => (
            <tr key={offer.id} className="border-t border-black/5">
              <td className="px-4 py-3 font-medium text-ink">{storeNameById[offer.storeId] ?? "Unknown store"}</td>
              <td className="px-4 py-3 font-semibold text-accent">
                {formatLkr(offer.currentPriceLkr)}
                {index === 0 ? <span className="ml-2 rounded bg-accent-2/30 px-2 py-1 text-xs text-ink">Best</span> : null}
              </td>
              <td className="px-4 py-3">{formatAvailability(offer.availability)}</td>
              <td className="px-4 py-3 text-ink-soft">{formatColomboDate(offer.updatedAt)}</td>
              <td className="px-4 py-3">
                <a
                  href={offer.offerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-black/10 px-3 py-1.5 font-semibold text-ink transition hover:bg-surface-2"
                >
                  Visit
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
