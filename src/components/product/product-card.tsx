import Link from "next/link";
import { formatLkr } from "@/lib/format/currency";
import { formatRelativeHours } from "@/lib/format/date";
import { getBestOfferForProduct } from "@/services/products/catalog.service";
import type { Product } from "@/types/domain";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const bestOffer = getBestOfferForProduct(product);

  return (
    <article className="surface-card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{product.category}</p>
      <h3 className="mt-2 font-display text-lg font-semibold text-ink">{product.title}</h3>
      <p className="mt-2 text-sm text-ink-soft">{product.specsSummary.join(" · ")}</p>
      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-ink-soft">Best price</p>
          <p className="text-xl font-bold text-accent">{bestOffer ? formatLkr(bestOffer.currentPriceLkr) : "N/A"}</p>
        </div>
        <p className="text-xs text-ink-soft">Updated {formatRelativeHours(product.updatedAt)}</p>
      </div>
      <Link
        href={`/products/${product.slug}`}
        className="mt-5 inline-flex rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
      >
        Compare offers
      </Link>
    </article>
  );
}
