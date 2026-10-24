
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateAccount } from "./actions";

type EditAccountPageProps = {
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

async function EditAccountForm({
                                   params,
                               }: EditAccountPageProps) {
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

    const updateAction = updateAccount.bind(null, account.id);

    const accountTypes = [
        "Checking",
        "Savings",
        "Cash",
        "Credit Card",
        "Investment",
    ];

    return (
        <div className="mt-8 max-w-2xl">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <form action={updateAction} className="space-y-6">
                    {/* Account name */}
                    <div>
                        <label
                            htmlFor="name"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            Account name
                        </label>

                        <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            minLength={2}
                            maxLength={100}
                            defaultValue={account.name}
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                        />
                    </div>

                    {/* Account type */}
                    <div>
                        <label
                            htmlFor="type"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            Account type
                        </label>

                        <select
                            id="type"
                            name="type"
                            required
                            defaultValue={account.type}
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                        >
                            {!accountTypes.includes(account.type) && (
                                <option value={account.type} disabled>
                                    {account.type} (current type)
                                </option>
                            )}

                            {accountTypes.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Currency - read only */}
                    <div>
                        <label
                            htmlFor="currency"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            Currency
                        </label>

                        <input
                            id="currency"
                            type="text"
                            value={account.currency}
                            readOnly
                            className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
                        />

                        <p className="mt-2 text-xs text-slate-500">
                            Currency cannot be changed after account creation.
                        </p>
                    </div>

                    {/* Current balance - read only */}
                    <div>
                        <label
                            htmlFor="balance"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            Current balance
                        </label>

                        <input
                            id="balance"
                            type="text"
                            value={formatMoney(
                                account.balance.toString(),
                                account.currency,
                            )}
                            readOnly
                            className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600"
                        />

                        <p className="mt-2 text-xs text-slate-500">
                            Your balance is maintained through transactions.
                            Editing account details will not change it.
                        </p>
                    </div>

                    {/* Form actions */}
                    <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-6">
                        <button
                            type="submit"
                            className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                        >
                            Save changes
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

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="text-sm font-bold text-slate-900">
                    Account information
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                    You can safely update your account name and type.
                    Your transaction history, currency, and balance
                    will remain unchanged.
                </p>
            </div>
        </div>
    );
}

export default function EditAccountPage({
                                            params,
                                        }: EditAccountPageProps) {
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
                        Edit Account
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Update your account details without affecting
                        your financial history.
                    </p>
                </div>

                <Suspense
                    fallback={
                        <div className="mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                            Loading account...
                        </div>
                    }
                >
                    <EditAccountForm params={params} />
                </Suspense>
            </div>
        </main>
    );
}
