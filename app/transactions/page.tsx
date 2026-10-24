
import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";

function formatMoney(amount: number | string, currency = "USD") {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
    }).format(Number(amount));
}

function formatDate(date: Date) {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
    }).format(date);
}

async function TransactionsTable() {
    const transactions = await prisma.transaction.findMany({
        where: {
            user: {
                email: "demo@spendwise.local",
            },
        },
        orderBy: [
            { date: "desc" },
            { createdAt: "desc" },
        ],
        include: {
            account: {
                select: {
                    name: true,
                    currency: true,
                },
            },
        },
    });

    const income = transactions
        .filter((transaction) => transaction.type === "INCOME")
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    const expenses = transactions
        .filter((transaction) => transaction.type === "EXPENSE")
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    return (
        <>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-sm text-slate-500">Total transactions</p>
                    <p className="mt-2 text-2xl font-bold">
                        {transactions.length}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-sm text-slate-500">Total income</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-700">
                        {formatMoney(income)}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-sm text-slate-500">Total expenses</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                        {formatMoney(expenses)}
                    </p>
                </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-5">
                    <h2 className="font-bold">All transactions</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Your complete transaction history
                    </p>
                </div>

                {transactions.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <p className="font-semibold">No transactions yet</p>
                        <p className="mt-2 text-sm text-slate-500">
                            Add your first transaction to start tracking your money.
                        </p>
                        <Link
                            href="/transactions/new"
                            className="mt-5 inline-block rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                            Add transaction
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Transaction</th>
                                <th className="px-6 py-4 font-semibold">Date</th>
                                <th className="px-6 py-4 font-semibold">Category</th>
                                <th className="px-6 py-4 font-semibold">Account</th>
                                <th className="px-6 py-4 text-right font-semibold">
                                    Amount
                                </th>
                            </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                            {transactions.map((transaction) => {
                                const isIncome = transaction.type === "INCOME";
                                const isTransfer = transaction.type === "TRANSFER";

                                return (
                                    <tr
                                        key={transaction.id}
                                        className="transition hover:bg-slate-50"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                                                        isIncome
                                                            ? "bg-emerald-50 text-emerald-700"
                                                            : "bg-slate-100 text-slate-600"
                                                    }`}
                                                >
                                                    {isIncome ? "IN" : isTransfer ? "TR" : "EX"}
                                                </div>

                                                <div>
                                                    <p className="text-sm font-semibold">
                                                        {transaction.title}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {transaction.type.toLowerCase()}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {formatDate(transaction.date)}
                                        </td>

                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {transaction.category}
                                        </td>

                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {transaction.account.name}
                                        </td>

                                        <td
                                            className={`px-6 py-4 text-right text-sm font-semibold ${
                                                isIncome
                                                    ? "text-emerald-700"
                                                    : "text-slate-900"
                                            }`}
                                        >
                                            {isIncome ? "+" : isTransfer ? "" : "-"}
                                            {formatMoney(
                                                transaction.amount.toString(),
                                                transaction.account.currency,
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}

export default function TransactionsPage() {
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
                            Transactions
                        </h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Track every dollar coming in and going out.
                        </p>
                    </div>

                    <Link
                        href="/transactions/new"
                        className="w-fit rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                        + Add transaction
                    </Link>
                </div>

                <Suspense
                    fallback={
                        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                            Loading transactions...
                        </div>
                    }
                >
                    <TransactionsTable />
                </Suspense>
            </div>
        </main>
    );
}
