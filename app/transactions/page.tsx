
import Link from "next/link";
import { Suspense } from "react";
import { Prisma, TransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type FilterParams = {
    search?: string;
    type?: string;
    account?: string;
};

type PageProps = {
    searchParams: Promise<FilterParams>;
};

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

async function TransactionsContent({
                                       filters,
                                   }: {
    filters: FilterParams;
}) {
    const search = (filters.search ?? "").trim();
    const type = filters.type ?? "ALL";
    const accountId = filters.account ?? "ALL";

    const validType =
        type === "INCOME" ||
        type === "EXPENSE" ||
        type === "TRANSFER"
            ? (type as TransactionType)
            : undefined;

    const where: Prisma.TransactionWhereInput = {
        user: {
            email: "demo@spendwise.local",
        },

        ...(search
            ? {
                OR: [
                    {
                        title: {
                            contains: search,
                            mode: Prisma.QueryMode.insensitive,
                        },
                    },
                    {
                        category: {
                            contains: search,
                            mode: Prisma.QueryMode.insensitive,
                        },
                    },
                ],
            }
            : {}),

        ...(validType ? { type: validType } : {}),

        ...(accountId !== "ALL" ? { accountId } : {}),
    };

    const [accounts, transactions] = await Promise.all([
        prisma.account.findMany({
            where: {
                user: {
                    email: "demo@spendwise.local",
                },
            },
            orderBy: {
                name: "asc",
            },
            select: {
                id: true,
                name: true,
            },
        }),

        prisma.transaction.findMany({
            where,
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
        }),
    ]);

    const income = transactions
        .filter((transaction) => transaction.type === "INCOME")
        .reduce(
            (sum, transaction) => sum + Number(transaction.amount),
            0,
        );

    const expenses = transactions
        .filter((transaction) => transaction.type === "EXPENSE")
        .reduce(
            (sum, transaction) => sum + Number(transaction.amount),
            0,
        );

    return (
        <>
            {/* Search and filters */}
            <form
                action="/transactions"
                method="GET"
                className="mt-8 grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4"
            >
                <div>
                    <label
                        htmlFor="search"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                        Search
                    </label>

                    <input
                        id="search"
                        name="search"
                        type="search"
                        defaultValue={search}
                        placeholder="Title or category"
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                    />
                </div>

                <div>
                    <label
                        htmlFor="type"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                        Type
                    </label>

                    <select
                        id="type"
                        name="type"
                        defaultValue={validType ?? "ALL"}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500"
                    >
                        <option value="ALL">All types</option>
                        <option value="INCOME">Income</option>
                        <option value="EXPENSE">Expense</option>
                        <option value="TRANSFER">Transfer</option>
                    </select>
                </div>

                <div>
                    <label
                        htmlFor="account"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                        Account
                    </label>

                    <select
                        id="account"
                        name="account"
                        defaultValue={
                            accounts.some((account) => account.id === accountId)
                                ? accountId
                                : "ALL"
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500"
                    >
                        <option value="ALL">All accounts</option>

                        {accounts.map((account) => (
                            <option key={account.id} value={account.id}>
                                {account.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-end gap-2">
                    <button
                        type="submit"
                        className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                        Apply filters
                    </button>

                    <Link
                        href="/transactions"
                        className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                        Clear
                    </Link>
                </div>
            </form>

            {/* Summary cards */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-sm text-slate-500">
                        Matching transactions
                    </p>

                    <p className="mt-2 text-2xl font-bold">
                        {transactions.length}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-sm text-slate-500">
                        Filtered income
                    </p>

                    <p className="mt-2 text-2xl font-bold text-emerald-700">
                        {formatMoney(income)}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-sm text-slate-500">
                        Filtered expenses
                    </p>

                    <p className="mt-2 text-2xl font-bold">
                        {formatMoney(expenses)}
                    </p>
                </div>
            </div>

            {/* Transactions table */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-5">
                    <h2 className="font-bold">
                        All transactions
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Your transaction history, based on the selected filters
                    </p>
                </div>

                {transactions.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <p className="font-semibold">
                            No matching transactions
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                            Try changing your search or clearing the filters.
                        </p>

                        <Link
                            href="/transactions"
                            className="mt-5 inline-block text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                        >
                            Clear all filters
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-left">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-6 py-4 font-semibold">
                                    Transaction
                                </th>

                                <th className="px-6 py-4 font-semibold">
                                    Date
                                </th>

                                <th className="px-6 py-4 font-semibold">
                                    Category
                                </th>

                                <th className="px-6 py-4 font-semibold">
                                    Account
                                </th>

                                <th className="px-6 py-4 text-right font-semibold">
                                    Amount
                                </th>

                                <th className="px-6 py-4 text-right font-semibold">
                                    Actions
                                </th>
                            </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                            {transactions.map((transaction) => {
                                const isIncome =
                                    transaction.type === "INCOME";

                                const isTransfer =
                                    transaction.type === "TRANSFER";

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
                                                    {isIncome
                                                        ? "IN"
                                                        : isTransfer
                                                            ? "TR"
                                                            : "EX"}
                                                </div>

                                                <div>
                                                    <p className="text-sm font-semibold">
                                                        {transaction.title}
                                                    </p>

                                                    <p className="mt-1 text-xs capitalize text-slate-500">
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
                                            {isIncome
                                                ? "+"
                                                : isTransfer
                                                    ? ""
                                                    : "-"}

                                            {formatMoney(
                                                transaction.amount.toString(),
                                                transaction.account.currency,
                                            )}
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            {isTransfer ? (
                                                <span className="text-xs text-slate-400">
                            Not editable
                          </span>
                                            ) : (
                                                <Link
                                                    href={`/transactions/${transaction.id}/edit`}
                                                    className="inline-flex rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50"
                                                >
                                                    Edit
                                                </Link>
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

async function FilteredTransactions({
                                        searchParams,
                                    }: PageProps) {
    const filters = await searchParams;

    return <TransactionsContent filters={filters} />;
}

export default function TransactionsPage({
                                             searchParams,
                                         }: PageProps) {
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
                            Search, filter, and manage your financial activity.
                        </p>
                    </div>

                    <Link
                        href="/transactions/new"
                        className="w-fit rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
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
                    <FilteredTransactions searchParams={searchParams} />
                </Suspense>
            </div>
        </main>
    );
}
