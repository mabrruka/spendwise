
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function deleteBudget(
    budgetId: string,
    formData: FormData,
) {
    const confirmation = String(
        formData.get("confirmation") ?? "",
    ).trim();

    if (confirmation !== "DELETE") {
        throw new Error(
            'Type "DELETE" to confirm budget deletion.',
        );
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

    const month = budget.month.toISOString().slice(0, 7);

    await prisma.budget.deleteMany({
        where: {
            id: budgetId,
            userId: user.id,
        },
    });

    revalidatePath("/budgets");

    redirect(`/budgets?month=${month}`);
}
