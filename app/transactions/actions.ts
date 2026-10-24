
"use server";

import { Prisma, TransactionType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function deleteTransaction(
    transactionId: string,
    formData: FormData,
) {
    const confirmation = String(
        formData.get("confirmation") ?? "",
    );

    if (confirmation !== "DELETE") {
        throw new Error("Deletion was not confirmed.");
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

            const transaction = await tx.transaction.findFirst({
                where: {
                    id: transactionId,
                    userId: demoUser.id,
                },
            });

            if (!transaction) {
                throw new Error("Transaction not found.");
            }

            if (transaction.type === TransactionType.TRANSFER) {
                throw new Error(
                    "Transfer transactions cannot be deleted here.",
                );
            }

            const amount = new Prisma.Decimal(transaction.amount);

            const balanceAdjustment =
                transaction.type === TransactionType.INCOME
                    ? amount.negated()
                    : amount;

            await tx.account.update({
                where: {
                    id: transaction.accountId,
                },
                data: {
                    balance: {
                        increment: balanceAdjustment,
                    },
                },
            });

            await tx.transaction.delete({
                where: {
                    id: transaction.id,
                },
            });
        },
        {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
    );

    revalidatePath("/");
    revalidatePath("/transactions");

    redirect("/transactions");
}
