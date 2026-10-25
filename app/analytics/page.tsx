
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";

type AnalyticsPageProps = {
    searchParams: Promise<{
        month?: string | string[];
    }>;
};

type AnalyticsContentProps = {
    searchParams: AnalyticsPageProps["searchParams"];
};

function formatMoney(amount: number) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(amount);
}

function getMonthStart(month: string) {
    const match = /^(\d{4})-(\d{2})$/.exec(month);

    if (!match) {
        return null;
    }

    const year = Number(match[1]);
    const monthNumber = Number(match[2]);

    if (
        year < 2000 ||
        year > 2100 ||
        monthNumber < 1 ||
        monthNumber > 12
    ) {
        return null;
    }

    return new Date(
        Date.UTC(year, monthNumber - 1, 1),
    );
}

function getNextMonth(start: Date) {
    return new Date(
        Date.UTC(
            start.getUTCFullYear(),
            start.getUTCMonth() + 1,
            1,
        ),
    );
}

function formatMonth(start: Date) {
    return new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    }).format(start);
}

async function AnalyticsContent({
                                    searchParams,
                                }: AnalyticsContentProps) {
    // Next.js 16: wait for the incoming request before
    // calculating the current date or month.
    await connection();

    const params = await searchParams;

    const currentMonth = new Date()
        .toISOString()
        .slice(0, 7);

    const requestedMonth =
        typeof params.month === "string"
            ? params.month
            : currentMonth;

    const monthStart =
        getMonthStart(requestedMonth) ??
        getMonthStart(currentMonth)!;

    const nextMonth = getNextMonth(monthStart);

    const transactions = await prisma.transaction.findMany({
        where: {
            user: {
                email: "demo@spendwise.local",
            },
            date: {
                gte: monthStart,
                lt: nextMonth,
            },
            type: {
                in: ["INCOME", "EXPENSE"],
            },
            account: {
                currency: "USD",
            },
        },
        select: {
            id: true,
            amount: true,
            type: true,
            category: true,
        },
    });

    let totalIncome = 0;
    let totalExpenses = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    const categoryTotals = new Map<
        string,
        {
            amount: number;
            count: number;
        }
    >();

    for (const transaction of transactions) {
        const amount = transaction.amount.toNumber();

        if (transaction.type === "INCOME") {
            totalIncome += amount;
            incomeCount += 1;
            continue;
        }

        if (transaction.type === "EXPENSE") {
            totalExpenses += amount;
            expenseCount += 1;

            const category =
                transaction.category.trim() || "Uncategorized";

            const existing = categoryTotals.get(category);

            categoryTotals.set(category, {
                amount: (existing?.amount ?? 0) + amount,
                count: (existing?.count ?? 0) + 1,
            });
        }
    }

    const categories = Array.from(
        categoryTotals.entries(),
    )
        .map(([name, details]) => ({
            name,
            amount: details.amount,
            count: details.count,
            percentage:
                totalExpenses > 0
                    ? (details.amount / totalExpenses) * 100
                    : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

    const netCashFlow = totalIncome - totalExpenses;

    const previousMonth = new Date(
        Date.UTC(
            monthStart.getUTCFullYear(),
            monthStart.getUTCMonth() - 1,
            1,
        ),
    )
        .toISOString()
        .slice(0, 7);

    const followingMonth = nextMonth
        .toISOString()
        .slice(0, 7);

    return (
        <>
            <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-slate-500">
                        Reporting period
                    </p>

                    <h2 className="mt-1 text-2xl font-bold">
                        {formatMonth(monthStart)}
                    </h2>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Link
                        href={`/analytics?month=${previousMonth}`}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        ← Previous
                    </Link>

                    <Link
                        href={`/analytics?month=${followingMonth}`}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Next →
                    </Link>

                    <Link
                        href="/analytics"
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                        Current month
                    </Link>
                </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">
                        Total income
                    </p>

                    <p className="mt-3 text-3xl font-bold text-emerald-700">
                        {formatMoney(totalIncome)}
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                        {incomeCount} income transactions
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">
                        Total expenses
                    </p>

                    <p className="mt-3 text-3xl font-bold text-rose-600">
                        {formatMoney(totalExpenses)}
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                        {expenseCount} expense transactions
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">
                        Net cash flow
                    </p>

                    <p
                        className={`mt-3 text-3xl font-bold ${
                            netCashFlow >= 0
                                ? "text-emerald-700"
                                : "text-rose-600"
                        }`}
                    >
                        {formatMoney(netCashFlow)}
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                        Income minus expenses
                    </p>
                </div>
            </div>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="text-xl font-bold">
                            Spending by category
                        </h3>

                        <p className="mt-2 text-sm text-slate-500">
                            See how your expenses are distributed.
                        </p>
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {categories.length} categories
          </span>
                </div>

                {categories.length === 0 ? (
                    <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                        <p className="font-semibold text-slate-700">
                            No expenses recorded this month
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                            Add an expense transaction to see your
                            spending breakdown.
                        </p>

                        <Link
                            href="/transactions/new"
                            className="mt-5 inline-block rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                            Add transaction
                        </Link>
                    </div>
                ) : (
                    <div className="mt-8 space-y-7">
                        {categories.map((category) => (
                            <div key={category.name}>
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <h4 className="font-semibold text-slate-900">
                                            {category.name}
                                        </h4>

                                        <p className="mt-1 text-xs text-slate-500">
                                            {category.count} transactions
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="font-bold text-slate-900">
                                            {formatMoney(category.amount)}
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                            {category.percentage.toFixed(1)}%
                                            of expenses
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        className="h-full rounded-full bg-emerald-500"
                                        style={{
                                            width: `${Math.min(
                                                category.percentage,
                                                100,
                                            )}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
                <p>
                    Analytics include USD income and expense
                    transactions for the selected month. Transfers
                    between accounts are excluded to avoid counting
                    internal money movements as spending.
                </p>
            </div>
        </>
    );
}

export default function AnalyticsPage({
                                          searchParams,
                                      }: AnalyticsPageProps) {
    return (
        <main className="min-h-screen bg-[#f7f8fa] px-5 py-10 text-slate-900">
            <div className="mx-auto max-w-6xl">
                <Link
                    href="/"
                    className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                    ← Back to dashboard
                </Link>

                <div className="mt-6">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Spending Analytics
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Understand your income, expenses, and
                        spending habits over time.
                    </p>
                </div>

                <Suspense
                    fallback={
                        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                            Loading analytics...
                        </div>
                    }
                >
                    <AnalyticsContent searchParams={searchParams} />
                </Suspense>
            </div>
        </main>
    );
}
