"use server";

import { redirect } from "next/navigation";
import {
  createServerSupabaseAuthClient,
  isSupabaseAuthConfigured,
} from "@/lib/supabase/server-auth";

function getSafeReturnPath(value: FormDataEntryValue | null, fallback = "/dashboard") {
  if (typeof value !== "string") {
    return fallback;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

async function getAuthenticatedContext(nextPath = "/dashboard") {
  if (!isSupabaseAuthConfigured()) {
    redirect(`${nextPath}?error=Supabase%20is%20not%20configured`);
  }

  const supabase = await createServerSupabaseAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`);
  }

  return { supabase, user };
}

async function findProductIdBySlug(slug: string) {
  const { supabase } = await getAuthenticatedContext();

  const { data, error } = await supabase
    .from("products")
    .select("id")
    .eq("slug", slug)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.id;
}

export async function addWishlistAction(formData: FormData) {
  const returnPath = getSafeReturnPath(formData.get("return_to"));
  const slug = String(formData.get("product_slug") ?? "").trim().toLowerCase();

  if (!slug) {
    redirect(`${returnPath}?error=Product%20slug%20is%20required`);
  }

  const productId = await findProductIdBySlug(slug);
  if (!productId) {
    redirect(`${returnPath}?error=Product%20slug%20was%20not%20found`);
  }

  const { supabase, user } = await getAuthenticatedContext(returnPath);
  const { error } = await supabase.from("wishlists").insert({
    user_id: user.id,
    product_id: productId,
  });

  if (error?.code === "23505") {
    redirect(`${returnPath}?error=Product%20is%20already%20in%20your%20wishlist`);
  }

  if (error) {
    redirect(`${returnPath}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`${returnPath}?message=Product%20added%20to%20wishlist`);
}

export async function removeWishlistAction(formData: FormData) {
  const returnPath = getSafeReturnPath(formData.get("return_to"));
  const wishlistId = String(formData.get("wishlist_id") ?? "").trim();

  if (!wishlistId) {
    redirect(`${returnPath}?error=Wishlist%20item%20id%20is%20required`);
  }

  const { supabase, user } = await getAuthenticatedContext(returnPath);
  const { error } = await supabase
    .from("wishlists")
    .delete()
    .eq("id", wishlistId)
    .eq("user_id", user.id);

  if (error) {
    redirect(`${returnPath}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`${returnPath}?message=Wishlist%20item%20removed`);
}

export async function createPriceAlertAction(formData: FormData) {
  const returnPath = getSafeReturnPath(formData.get("return_to"));
  const slug = String(formData.get("product_slug") ?? "").trim().toLowerCase();
  const target = Number(formData.get("target_price_lkr"));

  if (!slug) {
    redirect(`${returnPath}?error=Product%20slug%20is%20required`);
  }

  if (!Number.isFinite(target) || target <= 0) {
    redirect(`${returnPath}?error=Target%20price%20must%20be%20a%20positive%20number`);
  }

  const productId = await findProductIdBySlug(slug);
  if (!productId) {
    redirect(`${returnPath}?error=Product%20slug%20was%20not%20found`);
  }

  const { supabase, user } = await getAuthenticatedContext(returnPath);
  const { error } = await supabase.from("price_alerts").insert({
    user_id: user.id,
    product_id: productId,
    target_price_lkr: target,
    is_active: true,
  });

  if (error) {
    redirect(`${returnPath}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`${returnPath}?message=Price%20alert%20created`);
}

export async function deletePriceAlertAction(formData: FormData) {
  const returnPath = getSafeReturnPath(formData.get("return_to"));
  const alertId = String(formData.get("alert_id") ?? "").trim();

  if (!alertId) {
    redirect(`${returnPath}?error=Alert%20id%20is%20required`);
  }

  const { supabase, user } = await getAuthenticatedContext(returnPath);
  const { error } = await supabase
    .from("price_alerts")
    .delete()
    .eq("id", alertId)
    .eq("user_id", user.id);

  if (error) {
    redirect(`${returnPath}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`${returnPath}?message=Price%20alert%20deleted`);
}
