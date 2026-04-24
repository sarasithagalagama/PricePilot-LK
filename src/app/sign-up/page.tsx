import Link from "next/link";
import { signUpAction } from "@/app/auth/actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { isSupabaseAuthConfigured } from "@/lib/supabase/server-auth";

interface SignUpPageProps {
  searchParams: Promise<{
    error?: string;
  }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { error } = await searchParams;

  return (
    <section className="mx-auto max-w-md surface-card p-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Create account</h1>
      <p className="mt-2 text-sm text-ink-soft">Track product prices and set alerts when prices drop.</p>

      {!isSupabaseAuthConfigured() ? (
        <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Supabase auth is not configured. Add env values and restart the dev server.
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <form action={signUpAction} className="mt-6 space-y-4">
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
            minLength={6}
            type="password"
            name="password"
            autoComplete="new-password"
            className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none ring-accent/30 transition focus:ring-2"
            placeholder="At least 6 characters"
          />
        </label>

        <PendingSubmitButton
          idleText="Create account"
          pendingText="Creating..."
          className="inline-flex w-full items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        />
      </form>

      <p className="mt-4 text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-semibold text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </section>
  );
}
