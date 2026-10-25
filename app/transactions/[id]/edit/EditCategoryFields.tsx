
"use client";

import { useState } from "react";

type TransactionType = "INCOME" | "EXPENSE";

type EditCategoryFieldsProps = {
    initialType: TransactionType;
    initialCategory: string;
};

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

export default function EditCategoryFields({
                                               initialType,
                                               initialCategory,
                                           }: EditCategoryFieldsProps) {
    const [type, setType] = useState<TransactionType>(
        initialType,
    );

    const [category, setCategory] = useState(initialCategory);

    const categories =
        type === "EXPENSE"
            ? EXPENSE_CATEGORIES
            : INCOME_CATEGORIES;

    // Preserve categories from older transactions,
    // even when they aren't in the predefined list.
    const availableCategories =
        category && !categories.includes(category)
            ? [category, ...categories]
            : categories;

    function handleTypeChange(nextType: TransactionType) {
        setType(nextType);

        // Reset the category when changing transaction type.
        setCategory("");
    }

    return (
        <>
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
                    value={type}
                    onChange={(event) =>
                        handleTypeChange(
                            event.target.value as TransactionType,
                        )
                    }
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500"
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
                    id="category"
                    name="category"
                    value={category}
                    onChange={(event) =>
                        setCategory(event.target.value)
                    }
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500"
                >
                    <option value="" disabled>
                        Select a category
                    </option>

                    {availableCategories.map((item) => (
                        <option key={item} value={item}>
                            {item}
                        </option>
                    ))}
                </select>

                <p className="mt-2 text-xs text-slate-500">
                    Categories are based on the selected transaction type.
                    Existing custom categories are preserved.
                </p>
            </div>
        </>
    );
}
