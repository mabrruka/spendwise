
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";
import OnboardingForm from "./onboarding-form";

export default async function OnboardingPage() {
    await connection();

    const userId = await requireUser();

    const profile = await prisma.financialProfile.findUnique({
        where: { userId },
    });

    if (profile?.onboardingCompleted) {
        redirect("/dashboard");
    }

    return (
        <main className="min-h-screen bg-[#f7f8fa] px-5 py-10 text-slate-900">
            <div className="mx-auto max-w-2xl">
                <div className="mb-8 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-xl font-bold text-white">
                        S
                    </span>
                    <span className="text-xl font-bold tracking-tight">
                        spendwise
                    </span>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
                    <p className="text-sm font-semibold text-emerald-700">
                        YOUR FINANCIAL PROFILE
                    </p>

                    <h1 className="mt-3 text-3xl font-bold tracking-tight">
                        Let&apos;s make a plan for your money.
                    </h1>

                    <p className="mt-3 text-sm leading-6 text-slate-500">
                        Tell us a little about your finances. We&apos;ll use
                        your answers to help you set a realistic monthly
                        savings target.
                    </p>

                    <OnboardingForm
                        initialGoal={profile?.primaryGoal ?? ""}
                        initialOtherGoal={profile?.otherGoal ?? ""}
                        initialIncome={profile?.monthlyIncome.toString() ?? ""}
                        initialCurrency={profile?.currency ?? "USD"}
                        initialPercentage={
                            profile?.savingsPercentage.toString() ?? "20"
                        }
                    />
                </div>

                <p className="mt-6 text-center text-xs text-slate-400">
                    Your financial information is used to personalize your
                    Spendwise experience.
                </p>
            </div>
        </main>
    );
}
