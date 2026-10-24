
"use server";

import { Prisma, TransactionType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function createTransaction(formData: FormData) {
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

    if (!/^\d+(\.\d{1,2})?$/.test(amountInput)) {
        throw new Error("Enter a valid amount with up to two decimal places.");
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
        const account = await tx.account.findUnique({
            where: { id: accountId },
        });

        if (!account) {
            throw new Error("The selected account does not exist.");
        }

        // Until authentication is added, this demo form is restricted
        // to the dedicated demo user's accounts.
        const demoUser = await tx.user.findUnique({
            where: { email: "demo@spendwise.local" },
            select: { id: true },
        });

        if (!demoUser || account.userId !== demoUser.id) {
            throw new Error("This account is not available.");
        }

        await tx.transaction.create({
            data: {
                title,
                amount,
                type: typeInput,
                category,
                date,
                accountId: account.id,
                userId: demoUser.id,
            },
        });

        await tx.account.update({
            where: { id: account.id },
            data: {
                balance:
                    typeInput === TransactionType.INCOME
                        ? { increment: amount }
                        : { decrement: amount },
            },
        });
    });

    revalidatePath("/");
    revalidatePath("/transactions");
    revalidatePath("/transactions/new");

    redirect("/");
}
