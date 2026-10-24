
"use server";

import { Prisma, TransactionType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function updateTransaction(
    transactionId: string,
    formData: FormData,
) {
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

    await prisma.$transaction(
        async (tx) => {
            const demoUser = await tx.user.findUnique({
                where: {
                    email: "demo@spendwise.local",
                },
                select: {
                    id: true,
                },
            });

            if (!demoUser) {
                throw new Error("Demo user not found.");
            }

            const existing = await tx.transaction.findFirst({
                where: {
                    id: transactionId,
                    userId: demoUser.id,
                },
            });

            if (!existing) {
                throw new Error("Transaction not found.");
            }

            if (existing.type === TransactionType.TRANSFER) {
                throw new Error(
                    "Transfer transactions cannot be edited here.",
                );
            }

            const newAccount = await tx.account.findFirst({
                where: {
                    id: accountId,
                    userId: demoUser.id,
                },
            });

            if (!newAccount) {
                throw new Error("Selected account not found.");
            }

            const oldAmount = new Prisma.Decimal(existing.amount);

            const reverseOldEffect =
                existing.type === TransactionType.INCOME
                    ? oldAmount.negated()
                    : oldAmount;

            const applyNewEffect =
                typeInput === TransactionType.INCOME
                    ? amount
                    : amount.negated();

            if (existing.accountId === accountId) {
                const balanceAdjustment =
                    reverseOldEffect.plus(applyNewEffect);

                await tx.account.update({
                    where: {
                        id: accountId,
                    },
                    data: {
                        balance: {
                            increment: balanceAdjustment,
                        },
                    },
                });
            } else {
                await tx.account.update({
                    where: {
                        id: existing.accountId,
                    },
                    data: {
                        balance: {
                            increment: reverseOldEffect,
                        },
                    },
                });

                await tx.account.update({
                    where: {
                        id: accountId,
                    },
                    data: {
                        balance: {
                            increment: applyNewEffect,
                        },
                    },
                });
            }

            await tx.transaction.update({
                where: {
                    id: existing.id,
                },
                data: {
                    title,
                    amount,
                    type: typeInput,
                    category,
                    date,
                    accountId,
                },
            });
        },
        {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
    );

    revalidatePath("/");
    revalidatePath("/transactions");
    revalidatePath(`/transactions/${transactionId}/edit`);

    redirect("/transactions");
}
