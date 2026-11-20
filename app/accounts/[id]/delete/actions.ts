
"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";

export async function deleteAccount(
    accountId: string,
    formData: FormData
) {
    const userId = await requireUser();

    const confirmation = String(
        formData.get("confirmation") ?? ""
    );

    if (confirmation !== "DELETE") {
        throw new Error("Account deletion was not confirmed.");
    }

    if (!accountId || typeof accountId !== "string") {
        throw new Error("Invalid account ID.");
    }

    await prisma.$transaction(
        async (tx) => {
            const account = await tx.account.findFirst({
                where: {
                    id: accountId,
                    userId,
                },
                select: {
                    id: true,
                },
            });

            if (!account) {
                throw new Error("Account not found.");
            }

            const transactionCount = await tx.transaction.count({
                where: {
                    userId,
                    OR: [
                        { accountId: account.id },
                        { toAccountId: account.id },
                    ],
                },
            });

            if (transactionCount > 0) {
                throw new Error(
                    "This account has existing transactions or transfers and cannot be deleted."
                );
            }

            const result = await tx.account.deleteMany({
                where: {
                    id: account.id,
                    userId,
                },
            });

            if (result.count !== 1) {
                throw new Error("Account could not be deleted.");
            }
        },
        {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        }
    );

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/accounts");
    revalidatePath("/transactions");
    revalidatePath("/transfers/new");

    redirect("/accounts");
}
