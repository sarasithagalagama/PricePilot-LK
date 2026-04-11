import { products, stores } from "@/mock/seed-data/catalog";
import { loadCatalogFromSupabase } from "@/services/products/catalog.supabase";
import type { Offer, Product, ProductFilters } from "@/types/domain";

const PAGE_SIZE = 9;

interface CatalogData {
  products: Product[];
  stores: (typeof stores)[number][];
}

const RUNTIME_CACHE_TTL_MS = 30_000;
let runtimeCache: { data: CatalogData; loadedAt: number } | null = null;

function baseCatalogData(): CatalogData {
  return { products, stores };
}

function getBestOffer(offers: Offer[]): Offer | undefined {
  return [...offers].sort((a, b) => a.currentPriceLkr - b.currentPriceLkr)[0];
}

function listProductsFromSource(sourceProducts: Product[], filters: ProductFilters) {
  const filtered = sourceProducts.filter((product) => {
    const bestOffer = getBestOffer(product.offers);
    const searchable = `${product.title} ${product.brand} ${product.model}`.toLowerCase();

    if (filters.q && !searchable.includes(filters.q.toLowerCase())) {
      return false;
    }
    if (filters.category && product.category !== filters.category) {
      return false;
    }
    if (filters.brand && product.brand !== filters.brand) {
      return false;
    }
    if (filters.store && !product.offers.some((offer) => offer.storeId === filters.store)) {
      return false;
    }
    if (
      filters.availability &&
      !product.offers.some((offer) => offer.availability === filters.availability)
    ) {
      return false;
    }
    if (typeof filters.minPrice === "number" && bestOffer && bestOffer.currentPriceLkr < filters.minPrice) {
      return false;
    }
    if (typeof filters.maxPrice === "number" && bestOffer && bestOffer.currentPriceLkr > filters.maxPrice) {
      return false;
    }

    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (filters.sort === "latest") {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    const aBest = getBestOffer(a.offers)?.currentPriceLkr ?? Number.MAX_SAFE_INTEGER;
    const bBest = getBestOffer(b.offers)?.currentPriceLkr ?? Number.MAX_SAFE_INTEGER;
    return aBest - bBest;
  });

  const page = filters.page ?? 1;
  const start = (page - 1) * PAGE_SIZE;

  return {
    items: sorted.slice(start, start + PAGE_SIZE),
    total: sorted.length,
    totalPages: Math.max(1, Math.ceil(sorted.length / PAGE_SIZE)),
    page,
    pageSize: PAGE_SIZE,
  };
}

export function getProductBySlug(slug: string): Product | undefined {
  return baseCatalogData().products.find((product) => product.slug === slug);
}

export function listStores() {
  return baseCatalogData().stores;
}

export function getStoreBySlug(slug: string) {
  return baseCatalogData().stores.find((store) => store.slug === slug);
}

export function listStoreProducts(storeId: string) {
  return baseCatalogData().products.filter((product) =>
    product.offers.some((offer) => offer.storeId === storeId),
  );
}

export function getStoreName(storeId: string) {
  return baseCatalogData().stores.find((store) => store.id === storeId)?.name ?? "Unknown store";
}

export function getFeaturedDeals() {
  return [...baseCatalogData().products]
    .sort((a, b) => {
      const aBest = getBestOffer(a.offers)?.currentPriceLkr ?? Number.MAX_SAFE_INTEGER;
      const bBest = getBestOffer(b.offers)?.currentPriceLkr ?? Number.MAX_SAFE_INTEGER;
      return aBest - bBest;
    })
    .slice(0, 3);
}

export function getRecentlyUpdated() {
  return [...baseCatalogData().products]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);
}

export function getBestOfferForProduct(product: Product): Offer | undefined {
  return getBestOffer(product.offers);
}

export function listProducts(filters: ProductFilters) {
  return listProductsFromSource(baseCatalogData().products, filters);
}

export async function getRuntimeCatalogData() {
  if (runtimeCache && Date.now() - runtimeCache.loadedAt < RUNTIME_CACHE_TTL_MS) {
    return runtimeCache.data;
  }

  const supabaseData = await loadCatalogFromSupabase();
  const data = supabaseData ?? baseCatalogData();

  runtimeCache = {
    data,
    loadedAt: Date.now(),
  };

  return data;
}

export async function listProductsRuntime(filters: ProductFilters) {
  const data = await getRuntimeCatalogData();
  return listProductsFromSource(data.products, filters);
}

export async function getProductBySlugRuntime(slug: string) {
  const data = await getRuntimeCatalogData();
  return data.products.find((product) => product.slug === slug);
}

export async function listStoresRuntime() {
  const data = await getRuntimeCatalogData();
  return data.stores;
}

export async function getStoreBySlugRuntime(slug: string) {
  const data = await getRuntimeCatalogData();
  return data.stores.find((store) => store.slug === slug);
}

export async function listStoreProductsRuntime(storeId: string) {
  const data = await getRuntimeCatalogData();
  return data.products.filter((product) =>
    product.offers.some((offer) => offer.storeId === storeId),
  );
}

export async function getFeaturedDealsRuntime() {
  const data = await getRuntimeCatalogData();
  return [...data.products]
    .sort((a, b) => {
      const aBest = getBestOffer(a.offers)?.currentPriceLkr ?? Number.MAX_SAFE_INTEGER;
      const bBest = getBestOffer(b.offers)?.currentPriceLkr ?? Number.MAX_SAFE_INTEGER;
      return aBest - bBest;
    })
    .slice(0, 3);
}

export async function getRecentlyUpdatedRuntime() {
  const data = await getRuntimeCatalogData();
  return [...data.products]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);
}
