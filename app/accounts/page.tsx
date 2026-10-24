
import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";

function formatMoney(
    amount: number | string,
    currency: string,
) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
    }).format(Number(amount));
}

async function AccountsContent() {
    const accounts = await prisma.account.findMany({
        where: {
            user: {
                email: "demo@spendwise.local",
            },
        },
        include: {
            _count: {
                select: {
                    transactions: true,
                },
            },
        },
        orderBy: {
            createdAt: "asc",
        },
    });

    const totalBalance = accounts
        .filter((account) => account.currency === "USD")
        .reduce(
            (sum, account) => sum + Number(account.balance),
            0,
        );

    const allAccountsInUSD = accounts.every(
        (account) => account.currency === "USD",
    );

    return (
        <>
            {/* Summary */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">
                        Total accounts
                    </p>

                    <p className="mt-3 text-3xl font-bold">
                        {accounts.length}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">
                        {allAccountsInUSD
                            ? "Total balance"
                            : "USD accounts balance"}
                    </p>

                    <p className="mt-3 text-3xl font-bold text-emerald-700">
                        {formatMoney(totalBalance, "USD")}
                    </p>

                    {!allAccountsInUSD && (
                        <p className="mt-2 text-xs text-slate-500">
                            Other currencies are excluded from this total.
                        </p>
                    )}
                </div>
            </div>

            {/* Account cards */}
            <div className="mt-8">
                <h2 className="text-lg font-bold">
                    Your accounts
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    View the accounts connected to your Spendwise profile.
                </p>

                {accounts.length === 0 ? (
                    <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-10 text-center">
                        <p className="font-semibold">
                            No accounts found
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                            Your accounts will appear here once they are created.
                        </p>
                    </div>
                ) : (
                    <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                        {accounts.map((account) => (
                            <div
                                key={account.id}
                                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-700">
                                        {account.name
                                            .slice(0, 2)
                                            .toUpperCase()}
                                    </div>

                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {account.type}
                  </span>
                                </div>

                                <h3 className="mt-6 text-lg font-bold">
                                    {account.name}
                                </h3>

                                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Available balance
                                </p>

                                <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                                    {formatMoney(
                                        account.balance.toString(),
                                        account.currency,
                                    )}
                                </p>

                                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                                    <div>
                                        <p className="text-xs text-slate-500">
                                            Currency
                                        </p>

                                        <p className="mt-1 text-sm font-semibold">
                                            {account.currency}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-xs text-slate-500">
                                            Transactions
                                        </p>

                                        <p className="mt-1 text-sm font-semibold">
                                            {account._count.transactions}
                                        </p>
                                    </div>
                                </div>

                                <Link
                                    href={`/transactions?account=${encodeURIComponent(
                                        account.id,
                                    )}`}
                                    className="mt-6 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                                >
                                    View transactions →
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

export default function AccountsPage() {
    return (
        <main className="min-h-screen bg-[#f7f8fa] px-5 py-10 text-slate-900">
            <div className="mx-auto max-w-6xl">
                <Link
                    href="/"
                    className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                    ← Back to dashboard
                </Link>


                <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Accounts
                        </h1>

                        <p className="mt-2 text-sm text-slate-500">
                            Manage your financial accounts and track their balances.
                        </p>
                    </div>

                    <Link
                        href="/accounts/new"
                        className="w-fit rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                        + Add Account
                    </Link>
                </div>


                <Suspense
                    fallback={
                        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                            Loading accounts...
                        </div>
                    }
                >
                    <AccountsContent />
                </Suspense>
            </div>
        </main>
    );
}
