import Link from "next/link";
import { redirect } from "next/navigation";
import { signInAction } from "@/app/auth/actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import {
  createServerSupabaseAuthClient,
  isSupabaseAuthConfigured,
} from "@/lib/supabase/server-auth";

interface SignInPageProps {
  searchParams: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
}

function getSafeNextPath(value: string | undefined, fallback = "/dashboard") {
  if (!value) {
    return fallback;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { error, message, next } = await searchParams;
  const nextPath = getSafeNextPath(next);

  if (isSupabaseAuthConfigured()) {
    const supabase = await createServerSupabaseAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect(nextPath);
    }
  }

  return (
    <section className="mx-auto max-w-md surface-card p-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Sign in</h1>
      <p className="mt-2 text-sm text-ink-soft">Use your account to manage wishlist items and price alerts.</p>

      {!isSupabaseAuthConfigured() ? (
        <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Supabase auth is not configured. Add env values and restart the dev server.
        </p>
      ) : null}

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

      <form action={signInAction} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={nextPath} />

        <label className="block">
          <span className="text-sm font-semibold text-ink">Email</span>
          <input
            required
            type="email"
            name="email"
            autoComplete="email"
            className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none ring-accent/30 transition focus:ring-2"
            placeholder="you@example.com"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-ink">Password</span>
          <input
            required
            type="password"
            name="password"
            autoComplete="current-password"
            className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none ring-accent/30 transition focus:ring-2"
            placeholder="••••••••"
          />
        </label>

        <PendingSubmitButton
          idleText="Sign in"
          pendingText="Signing in..."
          className="inline-flex w-full items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        />
      </form>

      <p className="mt-4 text-sm text-ink-soft">
        New here?{" "}
        <Link href="/sign-up" className="font-semibold text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </section>
  );
}
