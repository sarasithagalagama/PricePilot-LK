import Link from "next/link";
import { redirect } from "next/navigation";
import { signOutAction } from "@/app/auth/actions";
import {
  addWishlistAction,
  createPriceAlertAction,
  deletePriceAlertAction,
  removeWishlistAction,
} from "@/app/dashboard/actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { formatLkr } from "@/lib/format/currency";
import {
  createServerSupabaseAuthClient,
  isSupabaseAuthConfigured,
} from "@/lib/supabase/server-auth";

interface DashboardPageProps {
  searchParams: Promise<{
    message?: string;
    error?: string;
  }>;
}

type DashboardProduct = {
  id: string;
  slug: string;
  title: string;
};

type WishlistRow = {
  id: string;
  product_id: string;
  created_at: string;
};

type AlertRow = {
  id: string;
  product_id: string;
  target_price_lkr: number | string;
  is_active: boolean;
  created_at: string;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { message, error } = await searchParams;

  if (!isSupabaseAuthConfigured()) {
    return (
      <section className="surface-card p-6">
        <h1 className="font-display text-2xl font-semibold text-ink">Your dashboard</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Supabase auth is not configured yet. Add env keys to enable protected wishlist and alerts.
        </p>
      </section>
    );
  }

  const supabase = await createServerSupabaseAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in?next=/dashboard");
  }

  const { data: wishlistRowsData } = await supabase
    .from("wishlists")
    .select("id, product_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: alertRowsData } = await supabase
    .from("price_alerts")
    .select("id, product_id, target_price_lkr, is_active, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const wishlistRows = (wishlistRowsData ?? []) as WishlistRow[];
  const alertRows = (alertRowsData ?? []) as AlertRow[];

  const productIds = Array.from(
    new Set([...wishlistRows.map((item) => item.product_id), ...alertRows.map((item) => item.product_id)]),
  );

  let productsById = new Map<string, DashboardProduct>();
  if (productIds.length > 0) {
    const { data: productsData } = await supabase
      .from("products")
      .select("id, slug, title")
      .in("id", productIds);

    productsById = new Map(
      ((productsData ?? []) as DashboardProduct[]).map((product) => [product.id, product]),
    );
  }

  return (
    <section className="surface-card p-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Your dashboard</h1>
      <p className="mt-2 text-sm text-ink-soft">Signed in as {user.email ?? "unknown user"}.</p>

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

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-black/5 bg-white p-4">
          <h2 className="font-display text-lg font-semibold text-ink">Saved products</h2>
          <p className="mt-2 text-sm text-ink-soft">Add by product slug (for example: lenovo-legion-5-15arp8).</p>

          <form action={addWishlistAction} className="mt-4 flex gap-2">
            <input
              required
              name="product_slug"
              type="text"
              placeholder="product-slug"
              className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none ring-accent/30 transition focus:ring-2"
            />
            <PendingSubmitButton
              idleText="Add"
              pendingText="Adding..."
              className="rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            />
          </form>

          <ul className="mt-4 space-y-2">
            {wishlistRows.length === 0 ? (
              <li className="text-sm text-ink-soft">No saved products yet.</li>
            ) : (
              wishlistRows.map((item) => {
                const product = productsById.get(item.product_id);

                return (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-black/5 bg-surface px-3 py-2"
                  >
                    <div>
                      {product ? (
                        <Link href={`/products/${product.slug}`} className="text-sm font-semibold text-accent hover:underline">
                          {product.title}
                        </Link>
                      ) : (
                        <p className="text-sm font-semibold text-ink">Unknown product</p>
                      )}
                    </div>

                    <form action={removeWishlistAction}>
                      <input type="hidden" name="wishlist_id" value={item.id} />
                      <PendingSubmitButton
                        idleText="Remove"
                        pendingText="Removing..."
                        className="text-sm font-semibold text-danger hover:underline disabled:opacity-60"
                      />
                    </form>
                  </li>
                );
              })
            )}
          </ul>
        </article>

        <article className="rounded-xl border border-black/5 bg-white p-4">
          <h2 className="font-display text-lg font-semibold text-ink">Price alerts</h2>
          <p className="mt-2 text-sm text-ink-soft">Create a target price for a product slug.</p>

          <form action={createPriceAlertAction} className="mt-4 space-y-2">
            <input
              required
              name="product_slug"
              type="text"
              placeholder="product-slug"
              className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none ring-accent/30 transition focus:ring-2"
            />
            <div className="flex gap-2">
              <input
                required
                name="target_price_lkr"
                type="number"
                min={1}
                step={1}
                placeholder="Target price (LKR)"
                className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none ring-accent/30 transition focus:ring-2"
              />
              <PendingSubmitButton
                idleText="Create"
                pendingText="Creating..."
                className="rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              />
            </div>
          </form>

          <ul className="mt-4 space-y-2">
            {alertRows.length === 0 ? (
              <li className="text-sm text-ink-soft">No alerts configured.</li>
            ) : (
              alertRows.map((item) => {
                const product = productsById.get(item.product_id);
                const targetPrice = typeof item.target_price_lkr === "number"
                  ? item.target_price_lkr
                  : Number(item.target_price_lkr);

                return (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-black/5 bg-surface px-3 py-2"
                  >
                    <div>
                      {product ? (
                        <Link href={`/products/${product.slug}`} className="text-sm font-semibold text-accent hover:underline">
                          {product.title}
                        </Link>
                      ) : (
                        <p className="text-sm font-semibold text-ink">Unknown product</p>
                      )}
                      <p className="text-xs text-ink-soft">Target: {formatLkr(targetPrice)}</p>
                    </div>

                    <form action={deletePriceAlertAction}>
                      <input type="hidden" name="alert_id" value={item.id} />
                      <PendingSubmitButton
                        idleText="Delete"
                        pendingText="Deleting..."
                        className="text-sm font-semibold text-danger hover:underline disabled:opacity-60"
                      />
                    </form>
                  </li>
                );
              })
            )}
          </ul>
        </article>
      </div>

      <form action={signOutAction} className="mt-6">
        <PendingSubmitButton
          idleText="Sign out"
          pendingText="Signing out..."
          className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-surface-2"
        />
      </form>
    </section>
  );
}
