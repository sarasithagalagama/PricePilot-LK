import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/product-card";
import { formatColomboDate } from "@/lib/format/date";
import { getStorePageRuntimeData } from "@/services/products/catalog.service";

interface StoreDetailProps {
  params: Promise<{ slug: string }>;
}

export default async function StoreDetailPage({ params }: StoreDetailProps) {
  const { slug } = await params;
  const { store, products } = await getStorePageRuntimeData(slug);

  if (!store) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <h1 className="font-display text-3xl font-semibold text-ink">{store.name}</h1>
        <p className="mt-2 text-sm text-ink-soft">
          {store.district} · Last sync {formatColomboDate(store.lastSyncAt)}
        </p>
        <a href={store.websiteUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">
          Visit store website
        </a>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold text-ink">Tracked offers from this store</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
