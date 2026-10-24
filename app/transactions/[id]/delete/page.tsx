
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deleteTransaction } from "../../actions";

type DeletePageProps = {
    params: Promise<{
        id: string;
    }>;
};

function formatMoney(amount: string, currency: string) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
    }).format(Number(amount));
}

async function DeleteConfirmation({
                                      params,
                                  }: DeletePageProps) {
    const { id } = await params;

    const transaction = await prisma.transaction.findFirst({
        where: {
            id,
            user: {
                email: "demo@spendwise.local",
            },
        },
        include: {
            account: {
                select: {
                    name: true,
                    currency: true,
                },
            },
        },
    });

    if (!transaction) {
        notFound();
    }

    if (transaction.type === "TRANSFER") {
        return (
            <div className="mt-8 max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <p className="font-semibold text-amber-900">
                    Transfers cannot be deleted using this page.
                </p>

                <Link
                    href="/transactions"
                    className="mt-4 inline-block text-sm font-semibold text-amber-900 underline"
                >
                    Back to transactions
                </Link>
            </div>
        );
    }

    const deleteAction = deleteTransaction.bind(null, transaction.id);

    return (
        <div className="mt-8 max-w-xl rounded-2xl border border-red-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold">
                Are you sure you want to delete this transaction?
            </h2>

            <p className="mt-3 text-sm text-slate-600">
                This action cannot be undone. The transaction will be removed
                and its effect on your account balance will be reversed.
            </p>

            <div className="mt-6 space-y-3 rounded-xl bg-slate-50 p-5">
                <div className="flex justify-between gap-4">
          <span className="text-sm text-slate-500">
            Transaction
          </span>
                    <span className="text-sm font-semibold">
            {transaction.title}
          </span>
                </div>

                <div className="flex justify-between gap-4">
          <span className="text-sm text-slate-500">
            Amount
          </span>
                    <span className="text-sm font-semibold">
            {formatMoney(
                transaction.amount.toString(),
                transaction.account.currency,
            )}
          </span>
                </div>

                <div className="flex justify-between gap-4">
          <span className="text-sm text-slate-500">
            Type
          </span>
                    <span className="text-sm font-semibold capitalize">
            {transaction.type.toLowerCase()}
          </span>
                </div>

                <div className="flex justify-between gap-4">
          <span className="text-sm text-slate-500">
            Account
          </span>
                    <span className="text-sm font-semibold">
            {transaction.account.name}
          </span>
                </div>
            </div>

            <form action={deleteAction} className="mt-6">
                <input
                    type="hidden"
                    name="confirmation"
                    value="DELETE"
                />

                <div className="flex flex-wrap gap-3">
                    <button
                        type="submit"
                        className="rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                    >
                        Yes, delete transaction
                    </button>

                    <Link
                        href="/transactions"
                        className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
}

export default function DeleteTransactionPage({
                                                  params,
                                              }: DeletePageProps) {
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
                        Delete transaction
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Review the transaction before permanently deleting it.
                    </p>
                </div>

                <Suspense
                    fallback={
                        <div className="mt-8 max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                            Loading transaction...
                        </div>
                    }
                >
                    <DeleteConfirmation params={params} />
                </Suspense>
            </div>
        </main>
    );
}
