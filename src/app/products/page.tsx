import { ProductCard } from "@/components/product/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { listProductsRuntime, listStoresRuntime } from "@/services/products/catalog.service";

interface ProductsPageProps {
  searchParams?: Promise<{
    q?: string;
    category?: string;
    brand?: string;
    store?: string;
    availability?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: "cheapest" | "latest";
    page?: string;
  }>;
}

const categories = [
  { value: "", label: "All categories" },
  { value: "laptops", label: "Laptops" },
  { value: "gpu", label: "GPU" },
  { value: "cpu", label: "CPU" },
  { value: "ram", label: "RAM" },
  { value: "ssd", label: "SSD" },
];

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = (await searchParams) ?? {};

  const filters = {
    q: params.q,
    category: params.category,
    brand: params.brand,
    store: params.store,
    availability: params.availability,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    sort: params.sort ?? "cheapest",
    page: params.page ? Number(params.page) : 1,
  };

  const [result, stores] = await Promise.all([
    listProductsRuntime(filters),
    listStoresRuntime(),
  ]);

  return (
    <div className="space-y-6">
      <section className="surface-card p-5">
        <h1 className="font-display text-2xl font-semibold text-ink">Product comparison</h1>
        <form className="mt-4 grid gap-3 md:grid-cols-3 lg:grid-cols-6" action="/products" method="get">
          <input
            name="q"
            defaultValue={filters.q}
            placeholder="Search model or brand"
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
          />
          <select name="category" defaultValue={filters.category} className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm">
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
          <select name="store" defaultValue={filters.store} className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm">
            <option value="">All stores</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
          <input name="minPrice" defaultValue={params.minPrice} placeholder="Min LKR" className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm" />
          <input name="maxPrice" defaultValue={params.maxPrice} placeholder="Max LKR" className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm" />
          <select name="sort" defaultValue={filters.sort} className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm">
            <option value="cheapest">Cheapest first</option>
            <option value="latest">Latest update</option>
          </select>
          <button className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 md:col-span-1 lg:col-span-6">
            Apply filters
          </button>
        </form>
      </section>

      {result.items.length ? (
        <>
          <p className="text-sm text-ink-soft">{result.total} products found</p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {result.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title="No products matched your filters"
          description="Try clearing store/category filters or expanding your price range."
        />
      )}
    </div>
  );
}
