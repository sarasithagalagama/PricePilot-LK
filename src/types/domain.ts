export type CategoryKey = "laptops" | "gpu" | "cpu" | "ram" | "ssd";

export interface Store {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string;
  district: string;
  lastSyncAt: string;
}

export interface OfferHistoryPoint {
  capturedAt: string;
  priceLkr: number;
}

export interface Offer {
  id: string;
  storeId: string;
  offerUrl: string;
  currentPriceLkr: number;
  availability: "in_stock" | "limited" | "out_of_stock";
  updatedAt: string;
  history: OfferHistoryPoint[];
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  brand: string;
  model: string;
  category: CategoryKey;
  specsSummary: string[];
  updatedAt: string;
  offers: Offer[];
}

export interface ProductFilters {
  q?: string;
  category?: string;
  brand?: string;
  store?: string;
  availability?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "cheapest" | "latest";
  page?: number;
}
