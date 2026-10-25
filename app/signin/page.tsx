
import Link from "next/link";
import { Suspense } from "react";
import { login } from "./actions";

type SigninPageProps = {
    searchParams: Promise<{
        error?: string | string[];
        registered?: string | string[];
    }>;
};

async function SigninForm({
                              searchParams,
                          }: SigninPageProps) {
    const params = await searchParams;

    const error =
        typeof params.error === "string"
            ? params.error
            : null;

    const registered = params.registered === "1";

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
                        Welcome back
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Sign in to your Spendwise account.
                    </p>
                </div>

                <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
                    {registered && (
                        <div
                            role="status"
                            className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
                        >
                            Account created successfully!
                            You can now sign in.
                        </div>
                    )}

                    {error && (
                        <div
                            role="alert"
                            className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
                        >
                            {error === "missing"
                                ? "Please enter your email and password."
                                : "Invalid email or password. Please try again."}
                        </div>
                    )}

                    <form action={login} className="space-y-5">
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
                                autoComplete="current-password"
                                placeholder="Enter your password"
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
                        >
                            Sign in
                        </button>
                    </form>

                    <p className="mt-7 text-center text-sm text-slate-500">
                        Don&apos;t have an account?{" "}
                        <Link
                            href="/signup"
                            className="font-semibold text-emerald-700 hover:text-emerald-800"
                        >
                            Create an account
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}

export default function SigninPage({
                                       searchParams,
                                   }: SigninPageProps) {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
                    Loading sign-in form...
                </div>
            }
        >
            <SigninForm searchParams={searchParams} />
        </Suspense>
    );
}
