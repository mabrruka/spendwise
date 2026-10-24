
import Link from "next/link";
import { createAccount } from "./actions";

export default function NewAccountPage() {
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
                        Add Account
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Create a new financial account and start tracking
                        its balance in Spendwise.
                    </p>
                </div>

                <div className="mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <form action={createAccount} className="space-y-6">
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
                                placeholder="e.g. Travel Savings"
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                            />

                            <p className="mt-2 text-xs text-slate-500">
                                Choose a name that helps you recognize this account.
                            </p>
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
                                defaultValue=""
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                            >
                                <option value="" disabled>
                                    Select an account type
                                </option>
                                <option value="Checking">Checking</option>
                                <option value="Savings">Savings</option>
                                <option value="Cash">Cash</option>
                                <option value="Credit Card">Credit Card</option>
                                <option value="Investment">Investment</option>
                            </select>
                        </div>

                        {/* Currency */}
                        <div>
                            <label
                                htmlFor="currency"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Currency
                            </label>

                            <select
                                id="currency"
                                name="currency"
                                required
                                defaultValue="USD"
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                            >
                                <option value="USD">USD — US Dollar</option>
                                <option value="EUR">EUR — Euro</option>
                                <option value="GBP">GBP — British Pound</option>
                                <option value="TRY">TRY — Turkish Lira</option>
                            </select>

                            <p className="mt-2 text-xs text-slate-500">
                                Transactions in this account will use the selected currency.
                            </p>
                        </div>

                        {/* Opening balance */}
                        <div>
                            <label
                                htmlFor="openingBalance"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Opening balance
                            </label>

                            <input
                                id="openingBalance"
                                name="openingBalance"
                                type="number"
                                step="0.01"
                                min="-999999999999.99"
                                max="999999999999.99"
                                required
                                defaultValue="0.00"
                                placeholder="0.00"
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                            />

                            <p className="mt-2 text-xs text-slate-500">
                                Enter the account&apos;s current balance.
                                Use a negative amount if the account has an outstanding balance.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-6">
                            <button
                                type="submit"
                                className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                            >
                                Create account
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

                <div className="mt-6 max-w-2xl rounded-2xl border border-slate-200 bg-white p-5">
                    <h2 className="text-sm font-bold text-slate-900">
                        About opening balances
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        Your opening balance establishes the starting amount
                        for this account. Future income and expense transactions
                        will automatically adjust it.
                    </p>
                </div>
            </div>
        </main>
    );
}
