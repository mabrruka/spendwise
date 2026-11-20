
"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";

export async function saveFinancialProfile(formData: FormData) {
    const userId = await requireUser();

    const primaryGoal = String(
        formData.get("primaryGoal") ?? "",
    ).trim();

    const otherGoal = String(
        formData.get("otherGoal") ?? "",
    ).trim();

    const monthlyIncomeInput = String(
        formData.get("monthlyIncome") ?? "",
    ).trim();

    const currency = String(
        formData.get("currency") ?? "",
    ).trim().toUpperCase();

    const savingsPercentageInput = String(
        formData.get("savingsPercentage") ?? "",
    ).trim();

    const allowedGoals = [
        "EMERGENCY_FUND",
        "HOME",
        "TRAVEL",
        "PAY_OFF_DEBT",
        "INVEST",
        "BUILD_WEALTH",
        "OTHER",
    ];

    const allowedCurrencies = ["USD", "EUR", "GBP", "TRY"];

    if (!allowedGoals.includes(primaryGoal)) {
        throw new Error("Please select a valid financial goal.");
    }

    if (primaryGoal === "OTHER" && otherGoal.length < 2) {
        throw new Error("Please describe your financial goal.");
    }

    if (otherGoal.length > 150) {
        throw new Error("Your goal description is too long.");
    }

    if (!/^\d+(\.\d{1,2})?$/.test(monthlyIncomeInput)) {
        throw new Error("Please enter a valid monthly income.");
    }

    if (!allowedCurrencies.includes(currency)) {
        throw new Error("Please select a valid currency.");
    }

    if (!/^\d+(\.\d{1,2})?$/.test(savingsPercentageInput)) {
        throw new Error("Please enter a valid savings percentage.");
    }

    const monthlyIncome = new Prisma.Decimal(monthlyIncomeInput);
    const savingsPercentage = new Prisma.Decimal(
        savingsPercentageInput,
    );

    if (
        monthlyIncome.lessThanOrEqualTo(0) ||
        monthlyIncome.greaterThan("999999999999.99")
    ) {
        throw new Error("Monthly income is outside the supported range.");
    }

    if (
        savingsPercentage.lessThan(1) ||
        savingsPercentage.greaterThan(100)
    ) {
        throw new Error("Savings percentage must be between 1 and 100.");
    }

    const monthlySavingsTarget = monthlyIncome
        .mul(savingsPercentage)
        .div(100)
        .toDecimalPlaces(2);

    if (monthlySavingsTarget.greaterThan("999999999999.99")) {
        throw new Error("Calculated savings target is too large.");
    }

    await prisma.financialProfile.upsert({
        where: { userId },
        create: {
            userId,
            primaryGoal,
            otherGoal: primaryGoal === "OTHER" ? otherGoal : null,
            monthlyIncome,
            currency,
            savingsPercentage,
            monthlySavingsTarget,
            onboardingCompleted: true,
        },
        update: {
            primaryGoal,
            otherGoal: primaryGoal === "OTHER" ? otherGoal : null,
            monthlyIncome,
            currency,
            savingsPercentage,
            monthlySavingsTarget,
            onboardingCompleted: true,
        },
    });

    revalidatePath("/dashboard");
    revalidatePath("/onboarding");

    redirect("/dashboard");
}
