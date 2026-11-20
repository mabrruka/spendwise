
"use client";

import { useMemo, useState } from "react";
import { saveFinancialProfile } from "./actions";

type OnboardingFormProps = {
    initialGoal: string;
    initialOtherGoal: string;
    initialIncome: string;
    initialCurrency: string;
    initialPercentage: string;
};

const percentagePresets = [10, 15, 20, 30];

export default function OnboardingForm({
                                           initialGoal,
                                           initialOtherGoal,
                                           initialIncome,
                                           initialCurrency,
                                           initialPercentage,
                                       }: OnboardingFormProps) {
    const [goal, setGoal] = useState(initialGoal);
    const [otherGoal, setOtherGoal] = useState(initialOtherGoal);
    const [monthlyIncome, setMonthlyIncome] = useState(initialIncome);
    const [currency, setCurrency] = useState(initialCurrency);
    const [percentage, setPercentage] = useState(initialPercentage);

    const savingsTarget = useMemo(() => {
        const income = Number(monthlyIncome);
        const savingsPercentage = Number(percentage);

        if (
            !Number.isFinite(income) ||
            !Number.isFinite(savingsPercentage) ||
            income <= 0 ||
            savingsPercentage <= 0 ||
            savingsPercentage > 100
        ) {
            return null;
        }

        return (income * savingsPercentage) / 100;
    }, [monthlyIncome, percentage]);

    const formattedTarget = useMemo(() => {
        if (savingsTarget === null) return null;

        try {
            return new Intl.NumberFormat(undefined, {
                style: "currency",
                currency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(savingsTarget);
        } catch {
            return `${savingsTarget.toFixed(2)} ${currency}`;
        }
    }, [savingsTarget, currency]);

    return (
        <form action={saveFinancialProfile} className="mt-8 space-y-7">
            <div>
                <label
                    htmlFor="primaryGoal"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                >
                    1. What is your main financial goal?
                </label>

                <select
                    id="primaryGoal"
                    name="primaryGoal"
                    required
                    value={goal}
                    onChange={(event) => setGoal(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                >
                    <option value="" disabled>
                        Select your main goal
                    </option>
                    <option value="EMERGENCY_FUND">
                        Build an emergency fund
                    </option>
                    <option value="HOME">Save for a home</option>
                    <option value="TRAVEL">Save for travel</option>
                    <option value="PAY_OFF_DEBT">Pay off debt</option>
                    <option value="INVEST">Start investing</option>
                    <option value="BUILD_WEALTH">
                        Build long-term wealth
                    </option>
                    <option value="OTHER">Something else</option>
                </select>

                {goal === "OTHER" && (
                    <div className="mt-4">
                        <label
                            htmlFor="otherGoal"
                            className="mb-2 block text-sm font-medium text-slate-600"
                        >
                            Tell us about your financial goal
                        </label>

                        <input
                            id="otherGoal"
                            name="otherGoal"
                            type="text"
                            required
                            minLength={2}
                            maxLength={150}
                            value={otherGoal}
                            onChange={(event) =>
                                setOtherGoal(event.target.value)
                            }
                            placeholder="Describe your financial goal"
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                        />
                    </div>
                )}
            </div>

            <div className="border-t border-slate-100 pt-7">
                <label
                    htmlFor="monthlyIncome"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                >
                    2. What is your typical monthly income?
                </label>

                <p className="mb-3 text-sm text-slate-500">
                    Enter your approximate income after tax.
                </p>

                <input
                    id="monthlyIncome"
                    name="monthlyIncome"
                    type="number"
                    required
                    min="0.01"
                    max="999999999999.99"
                    step="0.01"
                    value={monthlyIncome}
                    onChange={(event) =>
                        setMonthlyIncome(event.target.value)
                    }
                    placeholder="e.g. 3000"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                />
            </div>

            <div>
                <label
                    htmlFor="currency"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                >
                    Income currency
                </label>

                <select
                    id="currency"
                    name="currency"
                    required
                    value={currency}
                    onChange={(event) => setCurrency(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                >
                    <option value="USD">USD — US Dollar</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="GBP">GBP — British Pound</option>
                    <option value="TRY">TRY — Turkish Lira</option>
                </select>
            </div>

            <div className="border-t border-slate-100 pt-7">
                <label
                    htmlFor="savingsPercentage"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                >
                    3. What percentage of your income would you like to save?
                </label>

                <p className="mb-3 text-sm text-slate-500">
                    Choose a target that feels realistic for you.
                </p>

                <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {percentagePresets.map((preset) => {
                        const selected = Number(percentage) === preset;

                        return (
                            <button
                                key={preset}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => setPercentage(String(preset))}
                                className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                                    selected
                                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                                        : "border-slate-200 bg-white text-slate-600 hover:border-emerald-400"
                                }`}
                            >
                                {preset}%
                            </button>
                        );
                    })}
                </div>

                <label
                    htmlFor="savingsPercentage"
                    className="mb-2 block text-sm font-medium text-slate-600"
                >
                    Or enter your own percentage
                </label>

                <div className="relative">
                    <input
                        id="savingsPercentage"
                        name="savingsPercentage"
                        type="number"
                        required
                        min="1"
                        max="100"
                        step="0.01"
                        value={percentage}
                        onChange={(event) =>
                            setPercentage(event.target.value)
                        }
                        placeholder="Enter a percentage"
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-10 text-sm outline-none transition focus:border-emerald-500"
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                        %
                    </span>
                </div>

                <div className="mt-5 rounded-2xl bg-emerald-50 p-4">
                    <p className="text-sm font-medium text-emerald-800">
                        Your monthly savings target
                    </p>
                    <p className="mt-1 text-2xl font-bold text-emerald-900">
                        {formattedTarget ?? "—"}
                    </p>
                    <p className="mt-1 text-xs text-emerald-700">
                        {formattedTarget
                            ? `${percentage}% of your monthly income`
                            : "Enter your monthly income and a percentage between 1 and 100 to see your target."}
                    </p>
                </div>
            </div>

            <button
                type="submit"
                className="w-full rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
                Save my financial profile
            </button>
        </form>
    );
}
