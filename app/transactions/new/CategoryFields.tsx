
"use client";

import { useState } from "react";

type TransactionType = "INCOME" | "EXPENSE";

const EXPENSE_CATEGORIES = [
    "Groceries",
    "Shopping",
    "Food & Dining",
    "Transportation",
    "Bills & Utilities",
    "Entertainment",
    "Healthcare",
    "Housing",
    "Other Expense",
];

const INCOME_CATEGORIES = [
    "Salary",
    "Freelance",
    "Business",
    "Investments",
    "Gifts",
    "Other Income",
];

export default function CategoryFields() {
    const [type, setType] = useState<TransactionType>("EXPENSE");

    const categories =
        type === "EXPENSE"
            ? EXPENSE_CATEGORIES
            : INCOME_CATEGORIES;

    return (
        <>
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
                    value={type}
                    onChange={(event) =>
                        setType(event.target.value as TransactionType)
                    }
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

                <select
                    key={type}
                    id="category"
                    name="category"
                    defaultValue=""
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-500"
                >
                    <option value="" disabled>
                        Select a category
                    </option>

                    {categories.map((category) => (
                        <option key={category} value={category}>
                            {category}
                        </option>
                    ))}
                </select>

                <p className="mt-2 text-xs text-slate-500">
                    Categories are based on the selected transaction type.
                </p>
            </div>
        </>
    );
}

