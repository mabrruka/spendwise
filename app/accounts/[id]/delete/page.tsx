
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deleteAccount } from "./actions";

type DeleteAccountPageProps = {
    params: Promise<{
        id: string;
    }>;
};

function formatMoney(
    amount: string,
    currency: string,
) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
    }).format(Number(amount));
}

async function DeleteAccountConfirmation({
                                             params,
                                         }: DeleteAccountPageProps) {
    const { id } = await params;

    const account = await prisma.account.findFirst({
        where: {
            id,
            user: {
                email: "demo@spendwise.local",
            },
        },
    });

    if (!account) {
        notFound();
    }

    // Count every transaction involving this account.
    // This includes outgoing transactions and incoming transfers.
    const transactionCount = await prisma.transaction.count({
        where: {
            userId: account.userId,
            OR: [
                {
                    accountId: account.id,
                },
                {
                    toAccountId: account.id,
                },
            ],
        },
    });

    const hasTransactions = transactionCount > 0;

    const deleteAction = deleteAccount.bind(
        null,
        account.id,
    );

    return (
        <div className="mt-8 max-w-2xl">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-xl font-bold text-slate-900">
                    Delete {account.name}?
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                    Deleting an account permanently removes it from
                    Spendwise. This action cannot be undone.
                </p>

                {/* Account details */}
                <div className="mt-6 space-y-4 rounded-xl bg-slate-50 p-5">
                    <div className="flex justify-between gap-4">
            <span className="text-sm text-slate-500">
              Account
            </span>

                        <span className="text-right text-sm font-semibold">
              {account.name}
            </span>
                    </div>

                    <div className="flex justify-between gap-4">
            <span className="text-sm text-slate-500">
              Type
            </span>

                        <span className="text-sm font-semibold">
              {account.type}
            </span>
                    </div>

                    <div className="flex justify-between gap-4">
            <span className="text-sm text-slate-500">
              Currency
            </span>

                        <span className="text-sm font-semibold">
              {account.currency}
            </span>
                    </div>

                    <div className="flex justify-between gap-4">
            <span className="text-sm text-slate-500">
              Current balance
            </span>

                        <span className="text-sm font-semibold">
              {formatMoney(
                  account.balance.toString(),
                  account.currency,
              )}
            </span>
                    </div>

                    <div className="flex justify-between gap-4 border-t border-slate-200 pt-4">
            <span className="text-sm text-slate-500">
              Transactions and transfers
            </span>

                        <span className="text-sm font-semibold">
              {transactionCount}
            </span>
                    </div>
                </div>

                {hasTransactions ? (
                    <>
                        {/* Deletion blocked */}
                        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
                            <h3 className="text-sm font-bold text-amber-900">
                                This account cannot be deleted
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-amber-800">
                                This account is involved in{" "}
                                <strong>
                                    {transactionCount}
                                </strong>{" "}
                                transaction
                                {transactionCount === 1 ? "" : "s"} or
                                transfer
                                {transactionCount === 1 ? "" : "s"}.
                                To protect your financial history,
                                Spendwise does not allow deleting
                                accounts with existing financial activity.
                            </p>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <Link
                                href={`/transactions?account=${encodeURIComponent(
                                    account.id,
                                )}`}
                                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                            >
                                View transactions
                            </Link>

                            <Link
                                href="/accounts"
                                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Back to accounts
                            </Link>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Deletion permitted */}
                        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
                            <h3 className="text-sm font-bold text-red-900">
                                Permanent deletion
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-red-800">
                                This account has no transactions or
                                transfers and can be deleted. Its current
                                balance of{" "}
                                <strong>
                                    {formatMoney(
                                        account.balance.toString(),
                                        account.currency,
                                    )}
                                </strong>{" "}
                                will be removed from your account totals.
                            </p>
                        </div>

                        <form
                            action={deleteAction}
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
                                    required
                                    pattern="DELETE"
                                    autoComplete="off"
                                    placeholder="DELETE"
                                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-red-500"
                                />

                                <p className="mt-2 text-xs text-slate-500">
                                    Confirmation is case-sensitive.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-6">
                                <button
                                    type="submit"
                                    className="rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                                >
                                    Permanently delete account
                                </button>

                                <Link
                                    href="/accounts"
                                    className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Cancel
                                </Link>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

export default function DeleteAccountPage({
                                              params,
                                          }: DeleteAccountPageProps) {
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
                        Delete Account
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Review the account before permanently
                        deleting it.
                    </p>
                </div>

                <Suspense
                    fallback={
                        <div className="mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                            Loading account details...
                        </div>
                    }
                >
                    <DeleteAccountConfirmation params={params} />
                </Suspense>
            </div>
        </main>
    );
}
