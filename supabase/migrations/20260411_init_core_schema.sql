create extension if not exists pgcrypto;

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  parent_category_id uuid references categories(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  website_url text,
  district text,
  is_active boolean not null default true,
  last_sync_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id),
  brand_id uuid not null references brands(id),
  title text not null,
  slug text not null unique,
  normalized_title text not null,
  model_number text,
  specs_jsonb jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists raw_listings (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  source_url text not null,
  external_listing_id text,
  raw_title text not null,
  raw_brand text,
  raw_price_lkr numeric(12,2),
  raw_currency text not null default 'LKR',
  raw_stock_text text,
  payload_jsonb jsonb not null default '{}'::jsonb,
  fingerprint_hash text not null,
  scraped_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists listing_matches (
  id uuid primary key default gen_random_uuid(),
  raw_listing_id uuid not null unique references raw_listings(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  match_status text not null check (match_status in ('auto_matched', 'needs_review', 'manually_matched', 'rejected')),
  confidence_score numeric(5,4) not null default 0,
  matched_by text not null,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists offers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id),
  store_id uuid not null references stores(id),
  listing_match_id uuid references listing_matches(id) on delete set null,
  offer_url text not null,
  current_price_lkr numeric(12,2) not null,
  availability_status text not null check (availability_status in ('in_stock', 'limited', 'out_of_stock')),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (product_id, store_id, offer_url)
);

create table if not exists offer_price_history (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references offers(id) on delete cascade,
  price_lkr numeric(12,2) not null,
  availability_status text not null check (availability_status in ('in_stock', 'limited', 'out_of_stock')),
  captured_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create table if not exists price_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  target_price_lkr numeric(12,2) not null check (target_price_lkr > 0),
  is_active boolean not null default true,
  last_triggered_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists alert_events (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references price_alerts(id) on delete cascade,
  triggered_price_lkr numeric(12,2) not null,
  triggered_at timestamptz not null default now()
);

create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_brand on products(brand_id);
create index if not exists idx_products_updated on products(updated_at desc);
create index if not exists idx_raw_listings_store_scraped on raw_listings(store_id, scraped_at desc);
create index if not exists idx_raw_listings_fingerprint on raw_listings(fingerprint_hash);
create index if not exists idx_listing_matches_product on listing_matches(product_id);
create index if not exists idx_listing_matches_status on listing_matches(match_status);
create index if not exists idx_offers_product_price on offers(product_id, current_price_lkr);
create index if not exists idx_offers_store on offers(store_id);
create index if not exists idx_offer_history_offer_captured on offer_price_history(offer_id, captured_at desc);
create index if not exists idx_wishlists_user on wishlists(user_id);
create index if not exists idx_price_alerts_user_active on price_alerts(user_id, is_active);

alter table profiles enable row level security;
alter table wishlists enable row level security;
alter table price_alerts enable row level security;

create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

create policy "wishlists_select_own" on wishlists for select using (auth.uid() = user_id);
create policy "wishlists_insert_own" on wishlists for insert with check (auth.uid() = user_id);
create policy "wishlists_delete_own" on wishlists for delete using (auth.uid() = user_id);

create policy "alerts_select_own" on price_alerts for select using (auth.uid() = user_id);
create policy "alerts_insert_own" on price_alerts for insert with check (auth.uid() = user_id);
create policy "alerts_update_own" on price_alerts for update using (auth.uid() = user_id);
create policy "alerts_delete_own" on price_alerts for delete using (auth.uid() = user_id);
