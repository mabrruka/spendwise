
"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function updateBudget(
    budgetId: string,
    formData: FormData,
) {
    const amountInput = String(
        formData.get("amount") ?? "",
    ).trim();

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
        throw new Error("Invalid budget amount.");
    }

    const user = await prisma.user.findUnique({
        where: { email: "demo@spendwise.local" },
        select: { id: true },
    });

    if (!user) {
        throw new Error("Demo user not found.");
    }

    const budget = await prisma.budget.findFirst({
        where: {
            id: budgetId,
            userId: user.id,
        },
    });

    if (!budget) {
        throw new Error("Budget not found.");
    }

    await prisma.budget.update({
        where: { id: budget.id },
        data: { amount },
    });

    const month = budget.month.toISOString().slice(0, 7);

    revalidatePath("/budgets");
    revalidatePath(`/budgets/${budgetId}/edit`);

    redirect(`/budgets?month=${month}`);
}
