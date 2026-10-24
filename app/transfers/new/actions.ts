
"use server";

import { Prisma, TransactionType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function createTransfer(formData: FormData) {
    const fromAccountId = String(
        formData.get("fromAccountId") ?? "",
    ).trim();

    const toAccountId = String(
        formData.get("toAccountId") ?? "",
    ).trim();

    const amountInput = String(
        formData.get("amount") ?? "",
    ).trim();

    const description = String(
        formData.get("description") ?? "",
    ).trim();

    const dateInput = String(
        formData.get("date") ?? "",
    ).trim();

    // Validate account selection.
    if (!fromAccountId || !toAccountId) {
        throw new Error(
            "Please select both a source and destination account.",
        );
    }

    if (fromAccountId === toAccountId) {
        throw new Error(
            "Source and destination accounts must be different.",
        );
    }

    // Validate the transfer amount.
    if (!/^\d+(\.\d{1,2})?$/.test(amountInput)) {
        throw new Error(
            "Enter a valid amount with up to two decimal places.",
        );
    }

    const amount = new Prisma.Decimal(amountInput);

    if (
        amount.lessThanOrEqualTo(0) ||
        amount.greaterThan("999999999999.99")
    ) {
        throw new Error(
            "Transfer amount must be greater than zero and within the supported range.",
        );
    }

    // Validate the optional description.
    if (description.length > 500) {
        throw new Error(
            "Description must be 500 characters or fewer.",
        );
    }

    // Validate the transfer date.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        throw new Error("Please select a valid transfer date.");
    }

    const transferDate = new Date(
        `${dateInput}T12:00:00.000Z`,
    );

    if (
        Number.isNaN(transferDate.getTime()) ||
        transferDate.toISOString().slice(0, 10) !== dateInput
    ) {
        throw new Error("Please select a valid transfer date.");
    }

    await prisma.$transaction(
        async (tx) => {
            // Find the demo user.
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

            // Both accounts must belong to the demo user.
            const accounts = await tx.account.findMany({
                where: {
                    userId: demoUser.id,
                    id: {
                        in: [fromAccountId, toAccountId],
                    },
                },
                select: {
                    id: true,
                    name: true,
                    currency: true,
                    balance: true,
                },
            });

            if (accounts.length !== 2) {
                throw new Error(
                    "One or both selected accounts were not found.",
                );
            }

            const fromAccount = accounts.find(
                (account) => account.id === fromAccountId,
            );

            const toAccount = accounts.find(
                (account) => account.id === toAccountId,
            );

            if (!fromAccount || !toAccount) {
                throw new Error("Invalid account selection.");
            }

            // Currency conversion is not supported yet.
            if (fromAccount.currency !== toAccount.currency) {
                throw new Error(
                    "Transfers between different currencies are not supported yet.",
                );
            }

            // Prevent overdrawing the source account.
            // The conditional update also protects against
            // concurrent transfers spending the same balance.
            const debitResult = await tx.account.updateMany({
                where: {
                    id: fromAccount.id,
                    userId: demoUser.id,
                    balance: {
                        gte: amount,
                    },
                },
                data: {
                    balance: {
                        decrement: amount,
                    },
                },
            });

            if (debitResult.count !== 1) {
                throw new Error(
                    "Insufficient funds in the source account.",
                );
            }

            // Credit the destination account.
            await tx.account.update({
                where: {
                    id: toAccount.id,
                },
                data: {
                    balance: {
                        increment: amount,
                    },
                },
            });

            // Record the transfer.
            await tx.transaction.create({
                data: {
                    title: `Transfer: ${fromAccount.name} to ${toAccount.name}`,
                    amount,
                    type: TransactionType.TRANSFER,
                    category: "Transfer",
                    description: description || null,
                    date: transferDate,
                    userId: demoUser.id,
                    accountId: fromAccount.id,
                    toAccountId: toAccount.id,
                },
            });
        },
        {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
    );

    // Refresh pages showing balances or transactions.
    revalidatePath("/");
    revalidatePath("/accounts");
    revalidatePath("/transactions");
    revalidatePath("/transfers/new");

    redirect("/transactions");
}
