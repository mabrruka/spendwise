
"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";

export async function createAccount(formData: FormData) {
    // Require a signed-in user before creating an account.
    const userId = await requireUser();

    const name = String(formData.get("name") ?? "").trim();
    const type = String(formData.get("type") ?? "").trim();

    const currency = String(
        formData.get("currency") ?? "",
    )
        .trim()
        .toUpperCase();

    const openingBalanceInput = String(
        formData.get("openingBalance") ?? "",
    ).trim();

    // Validate account name.
    if (name.length < 2 || name.length > 100) {
        throw new Error(
            "Account name must be between 2 and 100 characters.",
        );
    }

    // Validate account type.
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

    // Validate currency.
    const allowedCurrencies = ["USD", "EUR", "GBP", "TRY"];

    if (!allowedCurrencies.includes(currency)) {
        throw new Error("Please select a valid currency.");
    }

    // Validate the opening balance.
    if (!/^-?\d+(\.\d{1,2})?$/.test(openingBalanceInput)) {
        throw new Error(
            "Opening balance must be a valid amount with up to two decimal places.",
        );
    }

    const openingBalance = new Prisma.Decimal(
        openingBalanceInput,
    );

    if (
        openingBalance.abs().greaterThan(
            new Prisma.Decimal("999999999999.99"),
        )
    ) {
        throw new Error(
            "Opening balance is outside the supported range.",
        );
    }

    // Create the account for the authenticated user.
    await prisma.account.create({
        data: {
            name,
            type,
            currency,
            balance: openingBalance,
            userId,
        },
    });

    // Refresh pages that display account information.
    revalidatePath("/dashboard");
    revalidatePath("/accounts");
    revalidatePath("/transactions");
    revalidatePath("/transactions/new");

    // Return to the Accounts page.
    redirect("/accounts");
}
