
"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function deleteAccount(
    accountId: string,
    formData: FormData,
) {
    const confirmation = String(
        formData.get("confirmation") ?? "",
    );

    if (confirmation !== "DELETE") {
        throw new Error(
            "Account deletion was not confirmed.",
        );
    }

    if (!accountId || typeof accountId !== "string") {
        throw new Error("Invalid account ID.");
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

            const account = await tx.account.findFirst({
                where: {
                    id: accountId,
                    userId: demoUser.id,
                },
                select: {
                    id: true,
                    name: true,
                },
            });

            if (!account) {
                throw new Error("Account not found.");
            }

            // Check all transactions involving this account,
            // including transfers received from another account.
            const transactionCount = await tx.transaction.count({
                where: {
                    userId: demoUser.id,
                    OR: [
                        {
                            accountId: account.id,
                        },
                        {
                            toAccountId: account.id,
                        },
                    ],
                },
            });

            if (transactionCount > 0) {
                throw new Error(
                    "This account has existing transactions or transfers and cannot be deleted.",
                );
            }

            // Delete only an account with no transaction history.
            const result = await tx.account.deleteMany({
                where: {
                    id: account.id,
                    userId: demoUser.id,
                },
            });

            if (result.count !== 1) {
                throw new Error("Account could not be deleted.");
            }
        },
        {
            isolationLevel:
            Prisma.TransactionIsolationLevel.Serializable,
        },
    );

    revalidatePath("/");
    revalidatePath("/accounts");
    revalidatePath("/transactions");
    revalidatePath("/transactions/new");
    revalidatePath("/transfers/new");
    revalidatePath("/accounts/new");

    redirect("/accounts");
}
