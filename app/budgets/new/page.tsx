
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { createBudget } from "./actions";

type NewBudgetPageProps = {
    searchParams: Promise<{
        month?: string | string[];
    }>;
};

const EXPENSE_CATEGORIES = [
    "Groceries",
    "Shopping",
    "Food & Dining",
    "Transportation",
    "Bills & Utilities",
    "Entertainment",
    "Healthcare",
    "Housing",
    "Other Expense",
];

async function NewBudgetForm({
                                 searchParams,
                             }: NewBudgetPageProps) {
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
        /^\d{4}-(0[1-9]|1[0-2])$/.test(requestedMonth)
            ? requestedMonth
            : currentMonth;

    return (
        <form
            action={createBudget}
            className="mt-8 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
            <div>
                <label
                    htmlFor="category"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                >
                    Expense category
                </label>

                <select
                    id="category"
                    name="category"
                    defaultValue=""
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-500"
                >
                    <option value="" disabled>
                        Select a category
                    </option>

                    {EXPENSE_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                            {category}
                        </option>
                    ))}
                </select>

                <p className="mt-2 text-xs text-slate-500">
                    Spending in this category will count toward
                    the budget automatically.
                </p>
            </div>

            <div>
                <label
                    htmlFor="amount"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                >
                    Monthly spending limit (USD)
                </label>

                <input
                    id="amount"
                    name="amount"
                    type="number"
                    min="0.01"
                    max="999999999999.99"
                    step="0.01"
                    placeholder="e.g. 500.00"
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
                />
            </div>

            <div>
                <label
                    htmlFor="month"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                >
                    Budget month
                </label>

                <input
                    id="month"
                    name="month"
                    type="month"
                    defaultValue={selectedMonth}
                    min="2000-01"
                    max="2100-12"
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-500"
                />

                <p className="mt-2 text-xs text-slate-500">
                    Each budget applies to one calendar month.
                </p>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-6">
                <button
                    type="submit"
                    className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                    Create budget
                </button>

                <Link
                    href={`/budgets?month=${selectedMonth}`}
                    className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                    Cancel
                </Link>
            </div>
        </form>
    );
}

export default function NewBudgetPage({
                                          searchParams,
                                      }: NewBudgetPageProps) {
    return (
        <main className="min-h-screen bg-[#f7f8fa] px-5 py-10 text-slate-900">
            <div className="mx-auto max-w-2xl">
                <Link
                    href="/budgets"
                    className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                    ← Back to budgets
                </Link>

                <h1 className="mt-6 text-3xl font-bold tracking-tight">
                    Create Monthly Budget
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                    Set a monthly spending limit for an expense category.
                </p>

                <Suspense
                    fallback={
                        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                            Loading budget form...
                        </div>
                    }
                >
                    <NewBudgetForm searchParams={searchParams} />
                </Suspense>
            </div>
        </main>
    );
}
