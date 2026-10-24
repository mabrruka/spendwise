
import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { createTransaction } from "./actions";

async function TransactionForm() {
    const accounts = await prisma.account.findMany({
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
            currency: true,
        },
    });

    return (
        <form
            action={createTransaction}
            className="mt-8 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
            <div>
                <label
                    htmlFor="title"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                >
                    Transaction title
                </label>

                <input
                    id="title"
                    name="title"
                    type="text"
                    placeholder="e.g. Grocery shopping"
                    maxLength={120}
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
                />
            </div>

            <div>
                <label
                    htmlFor="amount"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                >
                    Amount
                </label>

                <input
                    id="amount"
                    name="amount"
                    type="number"
                    min="0.01"
                    max="999999999999.99"
                    step="0.01"
                    placeholder="0.00"
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
                />
            </div>

            <div>
                <label
                    htmlFor="type"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                >
                    Transaction type
                </label>

                <select
                    id="type"
                    name="type"
                    defaultValue="EXPENSE"
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-500"
                >
                    <option value="EXPENSE">Expense</option>
                    <option value="INCOME">Income</option>
                </select>
            </div>

            <div>
                <label
                    htmlFor="category"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                >
                    Category
                </label>

                <input
                    id="category"
                    name="category"
                    type="text"
                    placeholder="e.g. Food & groceries"
                    maxLength={80}
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
                />
            </div>

            <div>
                <label
                    htmlFor="date"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                >
                    Date
                </label>

                <input
                    id="date"
                    name="date"
                    type="date"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-500"
                />
            </div>

            <div>
                <label
                    htmlFor="accountId"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                >
                    Account
                </label>

                <select
                    id="accountId"
                    name="accountId"
                    defaultValue=""
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-500"
                >
                    <option value="" disabled>
                        Select an account
                    </option>

                    {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                            {account.name} ({account.currency})
                        </option>
                    ))}
                </select>

                {accounts.length === 0 && (
                    <p className="mt-2 text-sm text-amber-700">
                        No accounts are available. Create an account before adding
                        transactions.
                    </p>
                )}
            </div>

            <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
                <button
                    type="submit"
                    disabled={accounts.length === 0}
                    className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Save transaction
                </button>

                <Link
                    href="/"
                    className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                    Cancel
                </Link>
            </div>

            <p className="text-xs leading-5 text-slate-500">
                Saving an expense decreases your selected account balance.
                Saving income increases it. Your transaction will appear on
                the dashboard automatically.
            </p>
        </form>
    );
}

export default function NewTransactionPage() {
    return (
        <main className="min-h-screen bg-[#f7f8fa] px-5 py-10 text-slate-900">
            <div className="mx-auto max-w-2xl">
                <Link
                    href="/"
                    className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                    ← Back to dashboard
                </Link>

                <h1 className="mt-6 text-3xl font-bold tracking-tight">
                    Add transaction
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                    Record income or an expense in your Spendwise account.
                </p>

                <Suspense
                    fallback={
                        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
                            <p className="text-sm text-slate-500">
                                Loading your accounts...
                            </p>
                        </div>
                    }
                >
                    <TransactionForm />
                </Suspense>
            </div>
        </main>
    );
}
