import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import { formatLkr } from "@/lib/format/currency";
import {
  getBestOfferForProduct,
  getFeaturedDealsRuntime,
  getRecentlyUpdatedRuntime,
} from "@/services/products/catalog.service";

export default async function Home() {
  const featuredDeals = await getFeaturedDealsRuntime();
  const recentlyUpdated = await getRecentlyUpdatedRuntime();

  return (
    <div className="space-y-10">
      <section className="surface-card overflow-hidden p-8 md:p-10">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Sri Lanka price intelligence</p>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink md:text-5xl">
              Compare laptop and PC part prices across local stores.
            </h1>
            <p className="mt-4 max-w-xl text-base text-ink-soft">
              PricePilot LK helps you find the best current offers with clean product pages, stock signals, and price trends.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/products" className="rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90">
                Browse products
              </Link>
              <Link href="/stores" className="rounded-lg border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-surface-2">
                Explore stores
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-black/5 bg-surface-2 p-6">
            <h2 className="font-display text-xl font-semibold text-ink">Featured deals</h2>
            <ul className="mt-4 space-y-3">
              {featuredDeals.map((product) => {
                const bestOffer = getBestOfferForProduct(product);
                return (
                  <li key={product.id} className="rounded-xl bg-white/70 p-3">
                    <p className="text-sm font-semibold text-ink">{product.title}</p>
                    <p className="mt-1 text-sm text-accent">{bestOffer ? formatLkr(bestOffer.currentPriceLkr) : "No offer"}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold text-ink">Recently updated products</h2>
          <Link href="/products?sort=latest" className="text-sm font-semibold text-accent hover:underline">
            View all
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recentlyUpdated.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
