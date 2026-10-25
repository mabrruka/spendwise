
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";

type BudgetsPageProps = {
    searchParams: Promise<{
        month?: string | string[];
    }>;
};

function formatMoney(amount: number) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(amount);
}

function parseMonth(value: string): Date | null {
    const match = /^(\d{4})-(\d{2})$/.exec(value);

    if (!match) {
        return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);

    if (
        year < 2000 ||
        year > 2100 ||
        month < 1 ||
        month > 12
    ) {
        return null;
    }

    return new Date(Date.UTC(year, month - 1, 1));
}

function monthValue(date: Date) {
    return date.toISOString().slice(0, 7);
}

function shiftMonth(date: Date, offset: number) {
    return new Date(
        Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth() + offset,
            1,
        ),
    );
}

function formatMonth(date: Date) {
    return new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    }).format(date);
}

async function BudgetsContent({
                                  searchParams,
                              }: BudgetsPageProps) {
    // Wait for the incoming request before calculating
    // the current month. Required for Next.js 16.
    await connection();

    const params = await searchParams;

    const currentMonth = new Date()
        .toISOString()
        .slice(0, 7);

    const requestedMonth =
        typeof params.month === "string"
            ? params.month
            : currentMonth;

    const selectedMonth =
        parseMonth(requestedMonth) ??
        parseMonth(currentMonth)!;

    const nextMonth = shiftMonth(selectedMonth, 1);

    const [user, budgets, expenses] = await Promise.all([
        prisma.user.findUnique({
            where: {
                email: "demo@spendwise.local",
            },
            select: {
                id: true,
            },
        }),

        prisma.budget.findMany({
            where: {
                user: {
                    email: "demo@spendwise.local",
                },
                month: selectedMonth,
            },
            orderBy: {
                category: "asc",
            },
        }),

        prisma.transaction.groupBy({
            by: ["category"],
            where: {
                user: {
                    email: "demo@spendwise.local",
                },
                type: "EXPENSE",
                date: {
                    gte: selectedMonth,
                    lt: nextMonth,
                },
                account: {
                    currency: "USD",
                },
            },
            _sum: {
                amount: true,
            },
            _count: {
                _all: true,
            },
        }),
    ]);

    if (!user) {
        return (
            <p className="mt-8 text-sm text-rose-600">
                Demo user not found.
            </p>
        );
    }

    const spendingByCategory = new Map(
        expenses.map((item) => [
            item.category,
            Number(item._sum.amount ?? 0),
        ]),
    );

    const budgetItems = budgets.map((budget) => {
        const limit = Number(budget.amount);

        const spent =
            spendingByCategory.get(budget.category) ?? 0;

        const remaining = limit - spent;

        const percentage =
            limit > 0 ? (spent / limit) * 100 : 0;

        return {
            id: budget.id,
            category: budget.category,
            limit,
            spent,
            remaining,
            percentage,
        };
    });

    const totalBudget = budgetItems.reduce(
        (sum, item) => sum + item.limit,
        0,
    );

    const totalSpent = budgetItems.reduce(
        (sum, item) => sum + item.spent,
        0,
    );

    const totalRemaining = totalBudget - totalSpent;

    const previousMonthValue = monthValue(
        shiftMonth(selectedMonth, -1),
    );

    const nextMonthValue = monthValue(nextMonth);

    return (
        <>
            {/* MONTH NAVIGATION */}
            <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-slate-500">
                        Budget period
                    </p>

                    <h2 className="mt-1 text-2xl font-bold">
                        {formatMonth(selectedMonth)}
                    </h2>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Link
                        href={`/budgets?month=${previousMonthValue}`}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        ← Previous
                    </Link>

                    <Link
                        href={`/budgets?month=${nextMonthValue}`}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Next →
                    </Link>

                    <Link
                        href="/budgets"
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                        Current month
                    </Link>
                </div>
            </div>

            {/* SUMMARY CARDS */}
            <div className="mt-6 grid gap-5 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">
                        Total budget
                    </p>

                    <p className="mt-3 text-3xl font-bold">
                        {formatMoney(totalBudget)}
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                        Across {budgets.length} categories
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">
                        Budgeted spending
                    </p>

                    <p className="mt-3 text-3xl font-bold text-rose-600">
                        {formatMoney(totalSpent)}
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                        Expenses in budgeted categories
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">
                        Remaining budget
                    </p>

                    <p
                        className={`mt-3 text-3xl font-bold ${
                            totalRemaining >= 0
                                ? "text-emerald-700"
                                : "text-rose-600"
                        }`}
                    >
                        {formatMoney(totalRemaining)}
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                        Budget minus recorded spending
                    </p>
                </div>
            </div>

            {/* CATEGORY BUDGETS */}
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-bold">
                            Category budgets
                        </h3>

                        <p className="mt-2 text-sm text-slate-500">
                            Track your spending against monthly limits.
                        </p>
                    </div>

                    <Link
                        href={`/budgets/new?month=${monthValue(selectedMonth)}`}
                        className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                        + Add budget
                    </Link>
                </div>

                {budgetItems.length === 0 ? (
                    <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                        <p className="font-semibold text-slate-700">
                            No budgets for this month
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                            Create a budget to start tracking your
                            spending limits.
                        </p>

                        <Link
                            href={`/budgets/new?month=${monthValue(selectedMonth)}`}
                            className="mt-5 inline-block rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                            Create your first budget
                        </Link>
                    </div>
                ) : (
                    <div className="mt-8 space-y-7">
                        {budgetItems.map((item) => {
                            const isOverBudget =
                                item.percentage > 100;

                            const isNearLimit =
                                item.percentage >= 80;

                            const progressColor = isOverBudget
                                ? "bg-rose-500"
                                : isNearLimit
                                    ? "bg-amber-500"
                                    : "bg-emerald-500";

                            return (
                                <div
                                    key={item.id}
                                    className="rounded-xl border border-slate-100 p-5"
                                >
                                    {/* CATEGORY HEADER */}
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div>
                                            <h4 className="text-lg font-bold">
                                                {item.category}
                                            </h4>

                                            <p className="mt-1 text-sm text-slate-500">
                                                Monthly limit:{" "}
                                                {formatMoney(item.limit)}
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-lg font-bold">
                                                {formatMoney(item.spent)}
                                            </p>

                                            <p className="mt-1 text-sm text-slate-500">
                                                Spent this month
                                            </p>
                                        </div>
                                    </div>

                                    {/* PROGRESS BAR */}
                                    <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className={`h-full rounded-full ${progressColor}`}
                                            style={{
                                                width: `${Math.min(
                                                    Math.max(item.percentage, 0),
                                                    100,
                                                )}%`,
                                            }}
                                        />
                                    </div>

                                    {/* SPENDING STATUS */}
                                    <div className="mt-3 flex flex-wrap justify-between gap-3 text-sm">
                                        <p className="font-medium text-slate-600">
                                            {item.percentage.toFixed(1)}% used
                                        </p>

                                        <p
                                            className={
                                                item.remaining >= 0
                                                    ? "font-semibold text-emerald-700"
                                                    : "font-semibold text-rose-600"
                                            }
                                        >
                                            {item.remaining >= 0
                                                ? `${formatMoney(item.remaining)} remaining`
                                                : `${formatMoney(
                                                    Math.abs(item.remaining),
                                                )} over budget`}
                                        </p>
                                    </div>

                                    {/* OVER-BUDGET WARNING */}
                                    {isOverBudget && (
                                        <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                                            You've exceeded this category's
                                            monthly budget.
                                        </p>
                                    )}

                                    {/* NEW: EDIT AND DELETE ACTIONS */}
                                    <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
                                        <Link
                                            href={`/budgets/${item.id}/edit`}
                                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                        >
                                            Edit budget
                                        </Link>

                                        <Link
                                            href={`/budgets/${item.id}/delete`}
                                            className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                                        >
                                            Delete budget
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* FOOTNOTE */}
            <p className="mt-6 text-sm text-slate-500">
                Budgets track USD expenses for the selected month.
                Income and transfers are excluded. Spending in
                categories without a budget is not included in
                the summary totals.
            </p>
        </>
    );
}

export default function BudgetsPage({
                                        searchParams,
                                    }: BudgetsPageProps) {
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
                        Monthly Budgets
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Plan your spending and stay on track
                        with category-based monthly budgets.
                    </p>
                </div>

                <Suspense
                    fallback={
                        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                            Loading budgets...
                        </div>
                    }
                >
                    <BudgetsContent searchParams={searchParams} />
                </Suspense>
            </div>
        </main>
    );
}
