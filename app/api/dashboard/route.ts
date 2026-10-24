
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const [accounts, transactions] = await Promise.all([
            prisma.account.findMany({
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    type: true,
                    currency: true,
                    balance: true,
                },
            }),

            prisma.transaction.findMany({
                orderBy: { date: "desc" },
                take: 10,
                select: {
                    id: true,
                    title: true,
                    amount: true,
                    type: true,
                    category: true,
                    description: true,
                    date: true,
                    account: {
                        select: {
                            name: true,
                            currency: true,
                        },
                    },
                },
            }),
        ]);

        const totals = await prisma.transaction.groupBy({
            by: ["type"],
            _sum: { amount: true },
        });

        const income = totals.find((item) => item.type === "INCOME")?._sum
            .amount;

        const expenses = totals.find((item) => item.type === "EXPENSE")?._sum
            .amount;

        return NextResponse.json({
            accounts: accounts.map((account) => ({
                ...account,
                balance: account.balance.toString(),
            })),
            transactions: transactions.map((transaction) => ({
                ...transaction,
                amount: transaction.amount.toString(),
            })),
            summary: {
                income: income?.toString() ?? "0",
                expenses: expenses?.toString() ?? "0",
                accountCount: accounts.length,
                transactionCount: await prisma.transaction.count(),
            },
        });
    } catch (error) {
        console.error("Dashboard API error:", error);

        return NextResponse.json(
            { error: "Unable to load dashboard data." },
            { status: 500 },
        );
    }
}
