
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateBudget } from "./actions";

type EditBudgetPageProps = {
    params: Promise<{ id: string }>;
};

async function EditBudgetForm({
                                  params,
                              }: EditBudgetPageProps) {
    const { id } = await params;

    const budget = await prisma.budget.findFirst({
        where: {
            id,
            user: {
                email: "demo@spendwise.local",
            },
        },
    });

    if (!budget) {
        notFound();
    }

    const month = budget.month.toISOString().slice(0, 7);

    const updateBudgetAction = updateBudget.bind(
        null,
        budget.id,
    );

    return (
        <main className="min-h-screen bg-[#f7f8fa] px-5 py-10 text-slate-900">
            <div className="mx-auto max-w-2xl">
                <Link
                    href={`/budgets?month=${month}`}
                    className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                    ← Back to budgets
                </Link>

                <h1 className="mt-6 text-3xl font-bold">
                    Edit Budget
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                    Update the spending limit for your monthly budget.
                </p>

                <form
                    action={updateBudgetAction}
                    className="mt-8 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
                >
                    <div>
                        <p className="text-sm font-semibold text-slate-700">
                            Category
                        </p>

                        <p className="mt-2 rounded-xl bg-slate-50 px-4 py-3">
                            {budget.category}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-slate-700">
                            Month
                        </p>

                        <p className="mt-2 rounded-xl bg-slate-50 px-4 py-3">
                            {new Intl.DateTimeFormat("en-US", {
                                month: "long",
                                year: "numeric",
                                timeZone: "UTC",
                            }).format(budget.month)}
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
                            defaultValue={budget.amount.toString()}
                            required
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
                        />
                    </div>

                    <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-6">
                        <button
                            type="submit"
                            className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                            Save changes
                        </button>

                        <Link
                            href={`/budgets?month=${month}`}
                            className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </main>
    );
}

export default function EditBudgetPage({
                                           params,
                                       }: EditBudgetPageProps) {
    return (
        <Suspense
            fallback={
                <main className="p-10 text-sm text-slate-500">
                    Loading budget...
                </main>
            }
        >
            <EditBudgetForm params={params} />
        </Suspense>
    );
}
