
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

    // Require explicit confirmation from the form.
    if (confirmation !== "DELETE") {
        throw new Error("Account deletion was not confirmed.");
    }

    // Validate the account ID.
    if (!accountId || typeof accountId !== "string") {
        throw new Error("Invalid account ID.");
    }

    // Perform all checks and deletion atomically.
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

            // Find the account belonging to the demo user.
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

            // Prevent deleting an account with transactions.
            const transactionCount = await tx.transaction.count({
                where: {
                    accountId: account.id,
                },
            });

            if (transactionCount > 0) {
                throw new Error(
                    "This account has existing transactions and cannot be deleted.",
                );
            }

            // Delete only the verified account.
            await tx.account.delete({
                where: {
                    id: account.id,
                },
            });
        },
        {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
    );

    // Refresh pages displaying account information.
    revalidatePath("/");
    revalidatePath("/accounts");
    revalidatePath("/transactions");
    revalidatePath("/transactions/new");
    revalidatePath("/accounts/new");

    // Return to the Accounts page.
    redirect("/accounts");
}
