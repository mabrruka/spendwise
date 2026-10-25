
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deleteBudget } from "./actions";

type DeleteBudgetPageProps = {
    params: Promise<{ id: string }>;
};

async function DeleteBudgetContent({
                                       params,
                                   }: DeleteBudgetPageProps) {
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

    const deleteBudgetAction = deleteBudget.bind(
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
                    Delete Budget
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                    Review the budget before deleting it.
                </p>

                <div className="mt-8 rounded-2xl border border-rose-200 bg-white p-6 shadow-sm sm:p-8">
                    <h2 className="text-lg font-bold">
                        {budget.category}
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                        Month:{" "}
                        {new Intl.DateTimeFormat("en-US", {
                            month: "long",
                            year: "numeric",
                            timeZone: "UTC",
                        }).format(budget.month)}
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                        Monthly limit:{" "}
                        <span className="font-semibold text-slate-900">
              {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
              }).format(Number(budget.amount))}
            </span>
                    </p>

                    <div className="mt-6 rounded-xl bg-rose-50 p-4">
                        <p className="text-sm font-semibold text-rose-800">
                            Are you sure?
                        </p>

                        <p className="mt-2 text-sm text-rose-700">
                            This will permanently remove the budget.
                            Your transactions and account balances
                            will not be affected.
                        </p>
                    </div>

                    <form
                        action={deleteBudgetAction}
                        className="mt-6 space-y-5"
                    >
                        <div>
                            <label
                                htmlFor="confirmation"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Type DELETE to confirm
                            </label>

                            <input
                                id="confirmation"
                                name="confirmation"
                                type="text"
                                placeholder="DELETE"
                                required
                                autoComplete="off"
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-rose-500"
                            />
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                type="submit"
                                className="rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white hover:bg-rose-700"
                            >
                                Delete budget
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
            </div>
        </main>
    );
}

export default function DeleteBudgetPage({
                                             params,
                                         }: DeleteBudgetPageProps) {
    return (
        <Suspense
            fallback={
                <main className="p-10 text-sm text-slate-500">
                    Loading budget...
                </main>
            }
        >
            <DeleteBudgetContent params={params} />
        </Suspense>
    );
}
