import { StoreCard } from "@/components/store/store-card";
import { getRuntimeCatalogData } from "@/services/products/catalog.service";

export default async function StoresPage() {
  const { stores, products } = await getRuntimeCatalogData();

  const countByStoreId = products.reduce<Record<string, number>>((acc, product) => {
    product.offers.forEach((offer) => {
      acc[offer.storeId] = (acc[offer.storeId] ?? 0) + 1;
    });
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-semibold text-ink">Tracked stores</h1>
      <p className="text-sm text-ink-soft">Browse shops and check when each store was last synced.</p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stores.map((store) => (
          <StoreCard
            key={store.id}
            store={store}
            offerCount={countByStoreId[store.id] ?? 0}
          />
        ))}
      </div>
    </div>
  );
}
