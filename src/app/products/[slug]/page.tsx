import Link from "next/link";
import { notFound } from "next/navigation";
import { PriceHistoryChart } from "@/components/chart/price-history-chart";
import { OfferTable } from "@/components/product/offer-table";
import { formatLkr } from "@/lib/format/currency";
import { formatColomboDate } from "@/lib/format/date";
import {
  getBestOfferForProduct,
  getRuntimeCatalogData,
} from "@/services/products/catalog.service";

interface ProductDetailProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailProps) {
  const { slug } = await params;
  const { products, stores } = await getRuntimeCatalogData();
  const product = products.find((item) => item.slug === slug);

  if (!product) {
    notFound();
  }

  const storeNameById = stores.reduce<Record<string, string>>((acc, store) => {
    acc[store.id] = store.name;
    return acc;
  }, {});

  const bestOffer = getBestOfferForProduct(product);

  return (
    <div className="space-y-6">
      <Link href="/products" className="text-sm font-semibold text-accent hover:underline">
        Back to products
      </Link>

      <section className="surface-card p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">{product.category}</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink">{product.title}</h1>
        <p className="mt-2 text-sm text-ink-soft">{product.specsSummary.join(" · ")}</p>
        <div className="mt-4 flex flex-wrap items-center gap-6">
          <div>
            <p className="text-xs text-ink-soft">Best current price</p>
            <p className="text-2xl font-bold text-accent">{bestOffer ? formatLkr(bestOffer.currentPriceLkr) : "N/A"}</p>
          </div>
          <div>
            <p className="text-xs text-ink-soft">Last updated</p>
            <p className="text-sm font-semibold text-ink">{formatColomboDate(product.updatedAt)}</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold text-ink">All matched offers</h2>
        <OfferTable offers={product.offers} storeNameById={storeNameById} />
      </section>

      <PriceHistoryChart offers={product.offers} />
    </div>
  );
}
