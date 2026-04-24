import Link from "next/link";
import { notFound } from "next/navigation";
import { PriceHistoryChart } from "@/components/chart/price-history-chart";
import { OfferTable } from "@/components/product/offer-table";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import {
  addWishlistAction,
  createPriceAlertAction,
  deletePriceAlertAction,
  removeWishlistAction,
} from "@/app/dashboard/actions";
import { formatLkr } from "@/lib/format/currency";
import { formatColomboDate } from "@/lib/format/date";
import {
  createServerSupabaseAuthClient,
  isSupabaseAuthConfigured,
} from "@/lib/supabase/server-auth";
import {
  getBestOfferForProduct,
  getProductPageRuntimeData,
} from "@/services/products/catalog.service";

interface ProductDetailProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    message?: string;
    error?: string;
  }>;
}

export default async function ProductDetailPage({ params, searchParams }: ProductDetailProps) {
  const { slug } = await params;
  const { message, error } = await searchParams;
  const { product, stores } = await getProductPageRuntimeData(slug);

  if (!product) {
    notFound();
  }

  const storeNameById = stores.reduce<Record<string, string>>((acc, store) => {
    acc[store.id] = store.name;
    return acc;
  }, {});

  const bestOffer = getBestOfferForProduct(product);
  let isSignedIn = false;
  let isInWishlist = false;
  let wishlistId: string | null = null;
  let activeAlerts: Array<{ id: string; targetPriceLkr: number }> = [];

  if (isSupabaseAuthConfigured()) {
    const supabase = await createServerSupabaseAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      isSignedIn = true;

      const { data: dbProduct } = await supabase
        .from("products")
        .select("id")
        .eq("slug", product.slug)
        .limit(1)
        .maybeSingle();

      if (dbProduct?.id) {
        const [{ data: wishlistEntry }, { data: activeAlertsData }] = await Promise.all([
          supabase
            .from("wishlists")
            .select("id")
            .eq("user_id", user.id)
            .eq("product_id", dbProduct.id)
            .limit(1)
            .maybeSingle(),
          supabase
            .from("price_alerts")
            .select("id, target_price_lkr")
            .eq("user_id", user.id)
            .eq("product_id", dbProduct.id)
            .eq("is_active", true)
            .order("created_at", { ascending: false }),
        ]);

        isInWishlist = Boolean(wishlistEntry);
        wishlistId = wishlistEntry?.id ?? null;
        activeAlerts = (activeAlertsData ?? [])
          .map((entry) => ({
            id: entry.id,
            targetPriceLkr: Number(entry.target_price_lkr),
          }))
          .filter((entry) => Number.isFinite(entry.targetPriceLkr));
      }
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/products" className="text-sm font-semibold text-accent hover:underline">
        Back to products
      </Link>

      <section className="surface-card p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">{product.category}</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink">{product.title}</h1>
        <p className="mt-2 text-sm text-ink-soft">{product.specsSummary.join(" · ")}</p>

        {message ? (
          <p className="mt-4 rounded-lg border border-accent/25 bg-accent/10 px-3 py-2 text-sm text-ink">
            {message}
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

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

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-black/5 bg-white p-3">
            {isInWishlist && wishlistId ? (
              <div className="space-y-2">
                <p className="mb-2 text-xs font-semibold text-ink-soft">Already in your wishlist.</p>
                <form action={removeWishlistAction}>
                  <input type="hidden" name="wishlist_id" value={wishlistId} />
                  <input type="hidden" name="return_to" value={`/products/${product.slug}`} />
                  <PendingSubmitButton
                    idleText="Remove from wishlist"
                    pendingText="Removing..."
                    className="inline-flex w-full items-center justify-center rounded-lg border border-danger/30 bg-white px-3 py-2 text-sm font-semibold text-danger transition hover:bg-danger/5 disabled:opacity-60"
                  />
                </form>
              </div>
            ) : (
              <form action={addWishlistAction}>
                <input type="hidden" name="product_slug" value={product.slug} />
                <input type="hidden" name="return_to" value={`/products/${product.slug}`} />
                <PendingSubmitButton
                  idleText="Save to wishlist"
                  pendingText="Saving..."
                  disabled={!isSignedIn}
                  className="inline-flex w-full items-center justify-center rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </form>
            )}

            {!isSignedIn ? (
              <p className="mt-2 text-xs text-ink-soft">
                <Link href={`/sign-in?next=${encodeURIComponent(`/products/${product.slug}`)}`} className="font-semibold text-accent hover:underline">
                  Sign in
                </Link>{" "}
                to save this product.
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-black/5 bg-white p-3">
            <form action={createPriceAlertAction}>
              <input type="hidden" name="product_slug" value={product.slug} />
              <input type="hidden" name="return_to" value={`/products/${product.slug}`} />
              <label className="text-xs font-semibold text-ink-soft" htmlFor="target-price-lkr">
                Alert me when price drops below (LKR)
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="target-price-lkr"
                  required
                  min={1}
                  step={1}
                  name="target_price_lkr"
                  type="number"
                  placeholder="e.g. 320000"
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none ring-accent/30 transition focus:ring-2"
                />
                <PendingSubmitButton
                  idleText="Create"
                  pendingText="Creating..."
                  disabled={!isSignedIn}
                  className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </form>

            {activeAlerts.length > 0 ? (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-semibold text-ink-soft">Your active alerts</p>
                {activeAlerts.map((alert) => (
                  <form key={alert.id} action={deletePriceAlertAction} className="flex items-center justify-between rounded-lg border border-black/5 bg-surface px-2 py-1.5">
                    <input type="hidden" name="alert_id" value={alert.id} />
                    <input type="hidden" name="return_to" value={`/products/${product.slug}`} />
                    <span className="text-xs text-ink">{formatLkr(alert.targetPriceLkr)}</span>
                    <PendingSubmitButton
                      idleText="Delete"
                      pendingText="Deleting..."
                      className="text-xs font-semibold text-danger hover:underline disabled:opacity-60"
                    />
                  </form>
                ))}
              </div>
            ) : null}

            {!isSignedIn ? (
              <p className="mt-2 text-xs text-ink-soft">
                <Link href={`/sign-in?next=${encodeURIComponent(`/products/${product.slug}`)}`} className="font-semibold text-accent hover:underline">
                  Sign in
                </Link>{" "}
                to create alerts.
              </p>
            ) : null}
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
