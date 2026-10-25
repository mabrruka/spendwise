
import Link from "next/link";
import { Suspense } from "react";
import { signup } from "./actions";

type SignupPageProps = {
    searchParams: Promise<{
        error?: string | string[];
    }>;
};

async function SignupForm({
                              searchParams,
                          }: SignupPageProps) {
    const params = await searchParams;

    const error =
        typeof params.error === "string"
            ? params.error
            : null;

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-5 py-12">
            <div className="w-full max-w-md">
                <div className="text-center">
                    <Link
                        href="/"
                        className="text-3xl font-extrabold tracking-tight text-emerald-700"
                    >
                        Spendwise
                    </Link>

                    <h1 className="mt-7 text-2xl font-bold text-slate-900">
                        Create your account
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Start managing your money with confidence.
                    </p>
                </div>

                <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
                    {error && (
                        <div
                            role="alert"
                            className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
                        >
                            {error}
                        </div>
                    )}

                    <form action={signup} className="space-y-5">
                        <div>
                            <label
                                htmlFor="name"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Full name
                            </label>

                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                minLength={2}
                                maxLength={100}
                                autoComplete="name"
                                placeholder="Enter your full name"
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="email"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Email address
                            </label>

                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                autoComplete="email"
                                placeholder="you@example.com"
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Password
                            </label>

                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                minLength={8}
                                maxLength={72}
                                autoComplete="new-password"
                                placeholder="At least 8 characters"
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Confirm password
                            </label>

                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                minLength={8}
                                autoComplete="new-password"
                                placeholder="Re-enter your password"
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
                        >
                            Create account
                        </button>
                    </form>

                    <p className="mt-7 text-center text-sm text-slate-500">
                        Already have an account?{" "}
                        <Link
                            href="/signin"
                            className="font-semibold text-emerald-700 hover:text-emerald-800"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>

                <p className="mt-6 text-center text-xs text-slate-400">
                    Your financial data deserves privacy and security.
                </p>
            </div>
        </main>
    );
}

export default function SignupPage({
                                       searchParams,
                                   }: SignupPageProps) {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
                    Loading registration form...
                </div>
            }
        >
            <SignupForm searchParams={searchParams} />
        </Suspense>
    );
}
