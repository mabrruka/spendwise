
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateTransaction } from "./actions";

type EditTransactionPageProps = {
    params: Promise<{
        id: string;
    }>;
};

function formatDateForInput(date: Date) {
    return date.toISOString().slice(0, 10);
}

async function EditTransactionForm({
                                       params,
                                   }: EditTransactionPageProps) {
    const { id } = await params;

    const [transaction, accounts] = await Promise.all([
        prisma.transaction.findFirst({
            where: {
                id,
                user: {
                    email: "demo@spendwise.local",
                },
            },
            include: {
                account: true,
            },
        }),

        prisma.account.findMany({
            where: {
                user: {
                    email: "demo@spendwise.local",
                },
            },
            orderBy: {
                name: "asc",
            },
        }),
    ]);

    if (!transaction) {
        notFound();
    }

    if (transaction.type === "TRANSFER") {
        return (
            <div className="mt-8 max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
                Transfer transactions cannot be edited using this form.
            </div>
        );
    }

    return (
        <div className="mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-8">
                <h2 className="text-xl font-bold">
                    Transaction details
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                    Update the information below.
                </p>
            </div>

            <form
                action={updateTransaction.bind(null, transaction.id)}
                className="space-y-6"
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
                        required
                        defaultValue={transaction.title}
                        placeholder="e.g. Grocery shopping"
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                    />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                            step="0.01"
                            required
                            defaultValue={transaction.amount.toString()}
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
                            required
                            defaultValue={transaction.type}
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500"
                        >
                            <option value="INCOME">
                                Income
                            </option>

                            <option value="EXPENSE">
                                Expense
                            </option>
                        </select>
                    </div>
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
                        required
                        defaultValue={transaction.category}
                        placeholder="e.g. Food"
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
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
                        required
                        defaultValue={formatDateForInput(transaction.date)}
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
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
                        required
                        defaultValue={transaction.accountId}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500"
                    >
                        {accounts.map((account) => (
                            <option key={account.id} value={account.id}>
                                {account.name} ({account.currency})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-6">
                    <button
                        type="submit"
                        className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                        Save changes
                    </button>

                    <Link
                        href="/transactions"
                        className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
}

export default function EditTransactionPage({
                                                params,
                                            }: EditTransactionPageProps) {
    return (
        <main className="min-h-screen bg-[#f7f8fa] px-5 py-10 text-slate-900">
            <div className="mx-auto max-w-6xl">
                <Link
                    href="/transactions"
                    className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                    ← Back to transactions
                </Link>

                <div className="mt-6">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Edit transaction
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Review and update an existing transaction.
                    </p>
                </div>

                <Suspense
                    fallback={
                        <div className="mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                            Loading transaction...
                        </div>
                    }
                >
                    <EditTransactionForm params={params} />
                </Suspense>
            </div>
        </main>
    );
}
