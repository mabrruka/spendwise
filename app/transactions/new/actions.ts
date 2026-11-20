
"use server";

import { Prisma, TransactionType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";

export async function createTransaction(formData: FormData) {
    const userId = await requireUser();

    const title = String(formData.get("title") ?? "").trim();
    const amountInput = String(formData.get("amount") ?? "").trim();
    const typeInput = String(formData.get("type") ?? "");
    const category = String(formData.get("category") ?? "").trim();
    const dateInput = String(formData.get("date") ?? "");
    const accountId = String(formData.get("accountId") ?? "");

    if (!title || !category || !accountId) {
        throw new Error("Please complete all required fields.");
    }

    if (
        typeInput !== TransactionType.INCOME &&
        typeInput !== TransactionType.EXPENSE
    ) {
        throw new Error("Invalid transaction type.");
    }

    const type = typeInput as TransactionType;

    if (!/^\d+(\.\d{1,2})?$/.test(amountInput)) {
        throw new Error(
            "Enter a valid amount with up to two decimal places.",
        );
    }

    const amount = new Prisma.Decimal(amountInput);

    if (amount.lte(0)) {
        throw new Error("Amount must be greater than zero.");
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        throw new Error("Enter a valid date.");
    }

    const date = new Date(`${dateInput}T12:00:00.000Z`);

    if (
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== dateInput
    ) {
        throw new Error("Enter a valid date.");
    }

    await prisma.$transaction(async (tx) => {
        const account = await tx.account.findFirst({
            where: {
                id: accountId,
                userId,
            },
        });

        if (!account) {
            throw new Error("The selected account does not exist.");
        }

        await tx.transaction.create({
            data: {
                title,
                amount,
                type,
                category,
                date,
                accountId: account.id,
                userId,
            },
        });

        await tx.account.update({
            where: {
                id: account.id,
            },
            data: {
                balance:
                    type === TransactionType.INCOME
                        ? { increment: amount }
                        : { decrement: amount },
            },
        });
    });

    revalidatePath("/dashboard");
    revalidatePath("/accounts");
    revalidatePath("/transactions");
    revalidatePath("/transactions/new");

    redirect("/dashboard");
}
