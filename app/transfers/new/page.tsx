
import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { createTransfer } from "./actions";

function formatMoney(amount: string, currency: string) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
    }).format(Number(amount));
}

async function TransferForm() {
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
            balance: true,
        },
    });

    const canTransfer = accounts.length >= 2;

    return (
        <div className="mt-8 max-w-2xl">
            {/* Available accounts */}
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold">
                    Available accounts
                </h2>

                <div className="mt-4 space-y-3">
                    {accounts.length === 0 ? (
                        <p className="text-sm text-slate-500">
                            No accounts found.
                        </p>
                    ) : (
                        accounts.map((account) => (
                            <div
                                key={account.id}
                                className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3"
                            >
                                <div>
                                    <p className="text-sm font-semibold">
                                        {account.name}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                        {account.currency}
                                    </p>
                                </div>

                                <p className="text-sm font-bold">
                                    {formatMoney(
                                        account.balance.toString(),
                                        account.currency,
                                    )}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {!canTransfer ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                    <h2 className="font-bold text-amber-900">
                        Two accounts are required
                    </h2>

                    <p className="mt-2 text-sm text-amber-800">
                        Create at least two accounts before making a transfer.
                    </p>

                    <Link
                        href="/accounts/new"
                        className="mt-4 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                        + Add Account
                    </Link>
                </div>
            ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <h2 className="text-xl font-bold">
                        Transfer details
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                        Move money between accounts without recording
                        it as income or an expense.
                    </p>

                    <form
                        action={createTransfer}
                        className="mt-6 space-y-6"
                    >
                        {/* Source account */}
                        <div>
                            <label
                                htmlFor="fromAccountId"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                From account
                            </label>

                            <select
                                id="fromAccountId"
                                name="fromAccountId"
                                required
                                defaultValue=""
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500"
                            >
                                <option value="" disabled>
                                    Select source account
                                </option>

                                {accounts.map((account) => (
                                    <option
                                        key={account.id}
                                        value={account.id}
                                    >
                                        {account.name} (
                                        {formatMoney(
                                            account.balance.toString(),
                                            account.currency,
                                        )}
                                        )
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Destination account */}
                        <div>
                            <label
                                htmlFor="toAccountId"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                To account
                            </label>

                            <select
                                id="toAccountId"
                                name="toAccountId"
                                required
                                defaultValue=""
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500"
                            >
                                <option value="" disabled>
                                    Select destination account
                                </option>

                                {accounts.map((account) => (
                                    <option
                                        key={account.id}
                                        value={account.id}
                                    >
                                        {account.name} ({account.currency})
                                    </option>
                                ))}
                            </select>

                            <p className="mt-2 text-xs text-slate-500">
                                Source and destination must be different
                                accounts using the same currency.
                            </p>
                        </div>

                        {/* Amount */}
                        <div>
                            <label
                                htmlFor="amount"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Transfer amount
                            </label>

                            <input
                                id="amount"
                                name="amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                max="999999999999.99"
                                required
                                placeholder="100.00"
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                            />

                            <p className="mt-2 text-xs text-slate-500">
                                The amount cannot exceed the source account's
                                available balance.
                            </p>
                        </div>

                        {/* Date */}
                        <div>
                            <label
                                htmlFor="date"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Transfer date
                            </label>

                            <input
                                id="date"
                                name="date"
                                type="date"
                                required
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label
                                htmlFor="description"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Description (optional)
                            </label>

                            <textarea
                                id="description"
                                name="description"
                                rows={3}
                                maxLength={500}
                                placeholder="e.g. Monthly savings transfer"
                                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-6">
                            <button
                                type="submit"
                                className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                            >
                                Transfer money
                            </button>

                            <Link
                                href="/accounts"
                                className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Cancel
                            </Link>
                        </div>
                    </form>
                </div>
            )}

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-bold">
                    How transfers work
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                    Spendwise subtracts the transfer amount from the
                    source account and adds it to the destination account.
                    Your combined balance stays the same, and the transfer
                    appears in your transaction history.
                </p>
            </div>
        </div>
    );
}

export default function NewTransferPage() {
    return (
        <main className="min-h-screen bg-[#f7f8fa] px-5 py-10 text-slate-900">
            <div className="mx-auto max-w-6xl">
                <Link
                    href="/accounts"
                    className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                    ← Back to accounts
                </Link>

                <div className="mt-6">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Transfer Money
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Move funds securely between your Spendwise accounts.
                    </p>
                </div>

                <Suspense
                    fallback={
                        <div className="mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                            Loading accounts...
                        </div>
                    }
                >
                    <TransferForm />
                </Suspense>
            </div>
        </main>
    );
}
