"use server";

import { redirect } from "next/navigation";
import {
  createServerSupabaseAuthClient,
  isSupabaseAuthConfigured,
} from "@/lib/supabase/server-auth";

function getSafeRedirectPath(value: FormDataEntryValue | null, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

export async function signInAction(formData: FormData) {
  if (!isSupabaseAuthConfigured()) {
    redirect("/sign-in?error=Supabase%20is%20not%20configured");
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nextPath = getSafeRedirectPath(formData.get("next"), "/dashboard");

  if (!email || !password) {
    redirect(`/sign-in?error=Email%20and%20password%20are%20required&next=${encodeURIComponent(nextPath)}`);
  }

  const supabase = await createServerSupabaseAuthClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/sign-in?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(nextPath)}`);
  }

  redirect(nextPath);
}

export async function signUpAction(formData: FormData) {
  if (!isSupabaseAuthConfigured()) {
    redirect("/sign-up?error=Supabase%20is%20not%20configured");
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/sign-up?error=Email%20and%20password%20are%20required");
  }

  const supabase = await createServerSupabaseAuthClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    redirect(`/sign-up?error=${encodeURIComponent(error.message)}`);
  }

  if (!data.session) {
    redirect("/sign-in?message=Check%20your%20email%20to%20confirm%20your%20account");
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  if (!isSupabaseAuthConfigured()) {
    redirect("/sign-in");
  }

  const supabase = await createServerSupabaseAuthClient();
  await supabase.auth.signOut();
  redirect("/sign-in?message=Signed%20out");
}
