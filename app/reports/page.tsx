
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";

type ReportsPageProps = {
    searchParams: Promise<{
        period?: string | string[];
    }>;
};

type MonthlyReport = {
    month: string;
    label: string;
    income: number;
    expenses: number;
    net: number;
};

const PERIOD_OPTIONS = [3, 6, 12, 24] as const;

function formatMoney(amount: number) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(amount);
}

function monthKey(date: Date) {
    return date.toISOString().slice(0, 7);
}

function monthLabel(date: Date) {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    }).format(date);
}

function getPeriod(value: string | string[] | undefined) {
    const parsed =
        typeof value === "string"
            ? Number(value)
            : 12;

    return PERIOD_OPTIONS.some(
        (option) => option === parsed,
    )
        ? parsed
        : 12;
}

async function ReportsContent({
                                  searchParams,
                              }: ReportsPageProps) {
    // Required by Next.js 16 when using the current date.
    await connection();

    const params = await searchParams;
    const period = getPeriod(params.period);

    const now = new Date();

    const currentMonthStart = new Date(
        Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            1,
        ),
    );

    const firstMonthStart = new Date(
        Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth() - (period - 1),
            1,
        ),
    );

    const nextMonthStart = new Date(
        Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth() + 1,
            1,
        ),
    );

    const transactions = await prisma.transaction.findMany({
        where: {
            user: {
                email: "demo@spendwise.local",
            },
            type: {
                in: ["INCOME", "EXPENSE"],
            },
            date: {
                gte: firstMonthStart,
                lt: nextMonthStart,
            },
            account: {
                currency: "USD",
            },
        },
        select: {
            date: true,
            type: true,
            amount: true,
            category: true,
        },
        orderBy: {
            date: "asc",
        },
    });

    // Build all months, including months with no transactions.
    const reports: MonthlyReport[] = [];

    for (let offset = period - 1; offset >= 0; offset--) {
        const date = new Date(
            Date.UTC(
                currentMonthStart.getUTCFullYear(),
                currentMonthStart.getUTCMonth() - offset,
                1,
            ),
        );

        reports.push({
            month: monthKey(date),
            label: monthLabel(date),
            income: 0,
            expenses: 0,
            net: 0,
        });
    }

    const reportByMonth = new Map(
        reports.map((report) => [
            report.month,
            report,
        ]),
    );

    const categoryTotals = new Map<string, number>();

    for (const transaction of transactions) {
        const month = monthKey(transaction.date);
        const report = reportByMonth.get(month);

        if (!report) {
            continue;
        }

        const amount = Number(transaction.amount);

        if (transaction.type === "INCOME") {
            report.income += amount;
        }

        if (transaction.type === "EXPENSE") {
            report.expenses += amount;

            categoryTotals.set(
                transaction.category,
                (categoryTotals.get(transaction.category) ?? 0) +
                amount,
            );
        }
    }

    for (const report of reports) {
        report.net = report.income - report.expenses;
    }

    const totalIncome = reports.reduce(
        (sum, report) => sum + report.income,
        0,
    );

    const totalExpenses = reports.reduce(
        (sum, report) => sum + report.expenses,
        0,
    );

    const netCashFlow = totalIncome - totalExpenses;

    const averageMonthlyExpenses =
        totalExpenses / period;

    const maxMonthlyValue = Math.max(
        1,
        ...reports.flatMap((report) => [
            report.income,
            report.expenses,
        ]),
    );

    const topCategories = Array.from(
        categoryTotals.entries(),
    )
        .map(([name, amount]) => ({
            name,
            amount,
            percentage:
                totalExpenses > 0
                    ? (amount / totalExpenses) * 100
                    : 0,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

    return (
        <>
            {/* REPORTING PERIOD AND FILTERS */}
            <div className="mt-8 flex flex-wrap items-end justify-between gap-5">
                <div>
                    <p className="text-sm font-medium text-slate-500">
                        Reporting period
                    </p>

                    <h2 className="mt-1 text-2xl font-bold">
                        Last {period} months
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                        {reports[0].label} –{" "}
                        {reports[reports.length - 1].label}
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <a
                        href={`/reports/export?period=${period}`}
                        download
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                        ↓ Export CSV
                    </a>

                    <Link
                        href="/analytics"
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        View monthly analytics →
                    </Link>
                </div>
            </div>

            {/* NEW: PERIOD FILTER BUTTONS */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-700">
                    Select reporting period
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                    {PERIOD_OPTIONS.map((option) => {
                        const isActive = period === option;

                        return (
                            <Link
                                key={option}
                                href={`/reports?period=${option}`}
                                aria-current={
                                    isActive ? "page" : undefined
                                }
                                className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                                    isActive
                                        ? "bg-emerald-600 text-white shadow-sm"
                                        : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                            >
                                {option} months
                            </Link>
                        );
                    })}
                </div>

                <p className="mt-4 text-xs text-slate-500">
                    All figures, charts, and category totals
                    reflect the selected reporting period.
                    The current month is included.
                </p>
            </div>

            {/* SUMMARY CARDS */}
            <div className="mt-6 grid gap-5 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">
                        Total income
                    </p>

                    <p className="mt-3 text-2xl font-bold text-emerald-700">
                        {formatMoney(totalIncome)}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                        Last {period} months
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">
                        Total expenses
                    </p>

                    <p className="mt-3 text-2xl font-bold text-rose-600">
                        {formatMoney(totalExpenses)}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                        Last {period} months
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">
                        Net cash flow
                    </p>

                    <p
                        className={`mt-3 text-2xl font-bold ${
                            netCashFlow >= 0
                                ? "text-emerald-700"
                                : "text-rose-600"
                        }`}
                    >
                        {formatMoney(netCashFlow)}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                        Income minus expenses
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">
                        Average monthly expenses
                    </p>

                    <p className="mt-3 text-2xl font-bold">
                        {formatMoney(averageMonthlyExpenses)}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                        Average across {period} months
                    </p>
                </div>
            </div>

            {/* INCOME VS EXPENSES CHART */}
            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div>
                    <h3 className="text-xl font-bold">
                        Income vs. Expenses
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                        Compare monthly income and spending
                        over the last {period} months.
                    </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-5 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded bg-emerald-500" />
                        <span className="text-slate-600">
              Income
            </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded bg-rose-500" />
                        <span className="text-slate-600">
              Expenses
            </span>
                    </div>
                </div>

                <div className="mt-8 overflow-x-auto">
                    <div
                        style={{
                            minWidth:
                                period === 24
                                    ? "1200px"
                                    : period === 12
                                        ? "720px"
                                        : "100%",
                        }}
                    >
                        <div className="flex h-64 items-end gap-3 border-b border-slate-200 pb-2">
                            {reports.map((report) => (
                                <div
                                    key={report.month}
                                    className="flex h-full min-w-0 flex-1 items-end justify-center gap-1"
                                >
                                    <div
                                        title={`${report.label} income: ${formatMoney(report.income)}`}
                                        className="w-1/2 rounded-t-md bg-emerald-500"
                                        style={{
                                            height: `${
                                                (report.income / maxMonthlyValue) *
                                                100
                                            }%`,
                                            minHeight:
                                                report.income > 0
                                                    ? "3px"
                                                    : "0px",
                                        }}
                                    />

                                    <div
                                        title={`${report.label} expenses: ${formatMoney(report.expenses)}`}
                                        className="w-1/2 rounded-t-md bg-rose-500"
                                        style={{
                                            height: `${
                                                (report.expenses / maxMonthlyValue) *
                                                100
                                            }%`,
                                            minHeight:
                                                report.expenses > 0
                                                    ? "3px"
                                                    : "0px",
                                        }}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="mt-3 flex gap-3">
                            {reports.map((report) => (
                                <div
                                    key={report.month}
                                    className="min-w-0 flex-1 text-center text-xs text-slate-500"
                                >
                  <span className="block">
                    {report.label.split(" ")[0]}
                  </span>

                                    {period === 24 && (
                                        <span className="mt-1 block text-[10px] text-slate-400">
                      {report.label.split(" ")[1]}
                    </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <p className="mt-5 text-xs text-slate-500">
                    Bar heights are relative to the largest monthly
                    income or expense amount. Hover over a bar
                    to see its value.
                </p>
            </section>

            {/* MONTHLY BREAKDOWN */}
            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <h3 className="text-xl font-bold">
                    Monthly breakdown
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                    A detailed view of income, expenses, and net
                    cash flow for each month.
                </p>

                <div className="mt-6 overflow-x-auto">
                    <table className="w-full min-w-[600px] text-left text-sm">
                        <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                            <th className="pb-4 font-semibold">
                                Month
                            </th>

                            <th className="pb-4 text-right font-semibold">
                                Income
                            </th>

                            <th className="pb-4 text-right font-semibold">
                                Expenses
                            </th>

                            <th className="pb-4 text-right font-semibold">
                                Net cash flow
                            </th>
                        </tr>
                        </thead>

                        <tbody>
                        {[...reports].reverse().map((report) => (
                            <tr
                                key={report.month}
                                className="border-b border-slate-100 last:border-0"
                            >
                                <td className="py-4 font-medium">
                                    <Link
                                        href={`/analytics?month=${report.month}`}
                                        className="hover:text-emerald-700"
                                    >
                                        {report.label}
                                    </Link>
                                </td>

                                <td className="py-4 text-right text-emerald-700">
                                    {formatMoney(report.income)}
                                </td>

                                <td className="py-4 text-right text-rose-600">
                                    {formatMoney(report.expenses)}
                                </td>

                                <td
                                    className={`py-4 text-right font-semibold ${
                                        report.net >= 0
                                            ? "text-slate-900"
                                            : "text-rose-600"
                                    }`}
                                >
                                    {formatMoney(report.net)}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* TOP SPENDING CATEGORIES */}
            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <h3 className="text-xl font-bold">
                    Top spending categories
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                    Your five largest expense categories
                    over the last {period} months.
                </p>

                {topCategories.length === 0 ? (
                    <p className="mt-6 rounded-xl bg-slate-50 p-6 text-sm text-slate-500">
                        No expense transactions found for
                        this period.
                    </p>
                ) : (
                    <div className="mt-7 space-y-6">
                        {topCategories.map((category) => (
                            <div key={category.name}>
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <p className="font-semibold">
                                            {category.name}
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                            {category.percentage.toFixed(1)}%
                                            of total expenses
                                        </p>
                                    </div>

                                    <p className="font-bold">
                                        {formatMoney(category.amount)}
                                    </p>
                                </div>

                                <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        className="h-full rounded-full bg-emerald-500"
                                        style={{
                                            width: `${Math.min(
                                                Math.max(
                                                    category.percentage,
                                                    0,
                                                ),
                                                100,
                                            )}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* REPORT NOTES */}
            <p className="mt-6 text-sm text-slate-500">
                Reports include USD income and expense
                transactions from the last {period} calendar
                months, including the current month. Transfers
                are excluded to avoid counting movements
                between your accounts as income or spending.
            </p>
        </>
    );
}

export default function ReportsPage({
                                        searchParams,
                                    }: ReportsPageProps) {
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
                        Financial Reports
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Explore your financial trends, compare
                        income and expenses, and understand
                        where your money goes.
                    </p>
                </div>

                <Suspense
                    fallback={
                        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                            Loading financial reports...
                        </div>
                    }
                >
                    <ReportsContent searchParams={searchParams} />
                </Suspense>
            </div>
        </main>
    );
}
