import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { CategoryKey, Offer, Product, Store } from "@/types/domain";

interface DbCategory {
  slug: string;
}

interface DbBrand {
  name: string;
}

interface DbOfferHistory {
  captured_at: string;
  price_lkr: number;
}

interface DbOffer {
  id: string;
  store_id: string;
  offer_url: string;
  current_price_lkr: number;
  availability_status: Offer["availability"];
  updated_at: string;
  offer_price_history?: DbOfferHistory[] | null;
}

interface DbProduct {
  id: string;
  slug: string;
  title: string;
  model_number: string | null;
  updated_at: string;
  categories: DbCategory | DbCategory[] | null;
  brands: DbBrand | DbBrand[] | null;
  offers: DbOffer[] | null;
}

interface DbStore {
  id: string;
  name: string;
  slug: string;
  website_url: string | null;
  district: string | null;
  last_sync_at: string | null;
}

export interface CatalogSnapshot {
  products: Product[];
  stores: Store[];
}

export interface ProductDetailSnapshot {
  product: Product | null;
  stores: Store[];
}

export interface StoreDetailSnapshot {
  store: Store | null;
  products: Product[];
}

function asObject<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function toCategoryKey(value: string | undefined): CategoryKey {
  if (value === "laptops" || value === "gpu" || value === "cpu" || value === "ram" || value === "ssd") {
    return value;
  }
  return "laptops";
}

function normalizeAvailability(value: string): Offer["availability"] {
  if (value === "in_stock" || value === "limited") {
    return value;
  }
  return "out_of_stock";
}

function mapStore(row: DbStore): Store {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    websiteUrl: row.website_url ?? "",
    district: row.district ?? "Unknown",
    lastSyncAt: row.last_sync_at ?? new Date().toISOString(),
  };
}

function mapProduct(row: DbProduct, includeHistory = false): Product {
  const category = asObject(row.categories);
  const brand = asObject(row.brands);

  const offers: Offer[] = (row.offers ?? []).map((offer) => ({
    id: offer.id,
    storeId: offer.store_id,
    offerUrl: offer.offer_url,
    currentPriceLkr: Number(offer.current_price_lkr),
    availability: normalizeAvailability(offer.availability_status),
    updatedAt: offer.updated_at,
    history: (offer.offer_price_history ?? [])
      .filter(() => includeHistory)
      .map((item) => ({ capturedAt: item.captured_at, priceLkr: Number(item.price_lkr) }))
      .sort((a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime()),
  }));

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    brand: brand?.name ?? "Unknown",
    model: row.model_number ?? "N/A",
    category: toCategoryKey(category?.slug),
    specsSummary: [],
    updatedAt: row.updated_at,
    offers,
  };
}

export async function loadCatalogFromSupabase(): Promise<CatalogSnapshot | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = createServerSupabaseClient();

  const [storesResult, productsResult] = await Promise.all([
    supabase
      .from("stores")
      .select("id, name, slug, website_url, district, last_sync_at")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("products")
      .select(
        "id, slug, title, model_number, updated_at, categories(slug), brands(name), offers(id, store_id, offer_url, current_price_lkr, availability_status, updated_at)",
      )
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(300),
  ]);

  if (storesResult.error || productsResult.error || !storesResult.data || !productsResult.data) {
    return null;
  }

  return {
    stores: (storesResult.data as DbStore[]).map(mapStore),
    products: (productsResult.data as DbProduct[]).map((row) => mapProduct(row, false)),
  };
}

export async function loadProductDetailFromSupabase(slug: string): Promise<ProductDetailSnapshot | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = createServerSupabaseClient();

  const { data: productData, error: productError } = await supabase
    .from("products")
    .select(
      "id, slug, title, model_number, updated_at, categories(slug), brands(name), offers(id, store_id, offer_url, current_price_lkr, availability_status, updated_at, offer_price_history(captured_at, price_lkr))",
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (productError) {
    return null;
  }

  if (!productData) {
    return {
      product: null,
      stores: [],
    };
  }

  const product = mapProduct(productData as DbProduct, true);
  const storeIds = Array.from(new Set(product.offers.map((offer) => offer.storeId)));

  if (storeIds.length === 0) {
    return {
      product,
      stores: [],
    };
  }

  const { data: storesData, error: storesError } = await supabase
    .from("stores")
    .select("id, name, slug, website_url, district, last_sync_at")
    .eq("is_active", true)
    .in("id", storeIds);

  if (storesError || !storesData) {
    return {
      product,
      stores: [],
    };
  }

  return {
    product,
    stores: (storesData as DbStore[]).map(mapStore),
  };
}

export async function loadStoreDetailFromSupabase(slug: string): Promise<StoreDetailSnapshot | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = createServerSupabaseClient();

  const { data: storeData, error: storeError } = await supabase
    .from("stores")
    .select("id, name, slug, website_url, district, last_sync_at")
    .eq("slug", slug)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (storeError) {
    return null;
  }

  if (!storeData) {
    return {
      store: null,
      products: [],
    };
  }

  const store = mapStore(storeData as DbStore);

  const { data: productsData, error: productsError } = await supabase
    .from("products")
    .select(
      "id, slug, title, model_number, updated_at, categories(slug), brands(name), offers!inner(id, store_id, offer_url, current_price_lkr, availability_status, updated_at)",
    )
    .eq("is_active", true)
    .eq("offers.store_id", store.id)
    .order("updated_at", { ascending: false })
    .limit(300);

  if (productsError || !productsData) {
    return {
      store,
      products: [],
    };
  }

  return {
    store,
    products: (productsData as DbProduct[]).map((row) => mapProduct(row, false)),
  };
}
