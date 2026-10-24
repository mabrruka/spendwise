
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function updateAccount(
    accountId: string,
    formData: FormData,
) {
    const name = String(formData.get("name") ?? "").trim();
    const type = String(formData.get("type") ?? "").trim();

    // Validate the account name.
    if (name.length < 2 || name.length > 100) {
        throw new Error(
            "Account name must be between 2 and 100 characters.",
        );
    }

    // Validate the account type.
    const allowedTypes = [
        "Checking",
        "Savings",
        "Cash",
        "Credit Card",
        "Investment",
    ];

    if (!allowedTypes.includes(type)) {
        throw new Error("Please select a valid account type.");
    }

    // Find the demo user.
    const demoUser = await prisma.user.findUnique({
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

    // Update only an account belonging to the demo user.
    const result = await prisma.account.updateMany({
        where: {
            id: accountId,
            userId: demoUser.id,
        },
        data: {
            name,
            type,
        },
    });

    if (result.count !== 1) {
        throw new Error("Account not found.");
    }

    // Refresh pages displaying account information.
    revalidatePath("/");
    revalidatePath("/accounts");
    revalidatePath("/transactions");
    revalidatePath("/transactions/new");

    // Return to the Accounts page.
    redirect("/accounts");
}
