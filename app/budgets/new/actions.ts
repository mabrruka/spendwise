
"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

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

export async function createBudget(formData: FormData) {
    const category = String(
        formData.get("category") ?? "",
    ).trim();

    const amountInput = String(
        formData.get("amount") ?? "",
    ).trim();

    const monthInput = String(
        formData.get("month") ?? "",
    ).trim();

    if (!EXPENSE_CATEGORIES.includes(category)) {
        throw new Error("Please select a valid expense category.");
    }

    if (!/^\d+(\.\d{1,2})?$/.test(amountInput)) {
        throw new Error(
            "Enter a valid budget amount with up to two decimal places.",
        );
    }

    const amount = new Prisma.Decimal(amountInput);

    if (
        amount.lessThanOrEqualTo(0) ||
        amount.greaterThan("999999999999.99")
    ) {
        throw new Error(
            "Budget amount must be greater than zero and within the supported range.",
        );
    }

    const monthMatch = /^(\d{4})-(\d{2})$/.exec(monthInput);

    if (!monthMatch) {
        throw new Error("Please select a valid month.");
    }

    const year = Number(monthMatch[1]);
    const monthNumber = Number(monthMatch[2]);

    if (
        year < 2000 ||
        year > 2100 ||
        monthNumber < 1 ||
        monthNumber > 12
    ) {
        throw new Error("Please select a valid month.");
    }

    const month = new Date(
        Date.UTC(year, monthNumber - 1, 1),
    );

    const user = await prisma.user.findUnique({
        where: {
            email: "demo@spendwise.local",
        },
        select: {
            id: true,
        },
    });

    if (!user) {
        throw new Error("Demo user not found.");
    }

    const existingBudget = await prisma.budget.findUnique({
        where: {
            userId_category_month: {
                userId: user.id,
                category,
                month,
            },
        },
        select: {
            id: true,
        },
    });

    if (existingBudget) {
        throw new Error(
            "A budget already exists for this category and month.",
        );
    }

    try {
        await prisma.budget.create({
            data: {
                category,
                amount,
                month,
                userId: user.id,
            },
        });
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            throw new Error(
                "A budget already exists for this category and month.",
            );
        }

        throw error;
    }

    revalidatePath("/budgets");

    redirect(`/budgets?month=${monthInput}`);
}
