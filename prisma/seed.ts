
import "dotenv/config";
import { PrismaClient, TransactionType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.upsert({
        where: { email: "demo@spendwise.local" },
        update: {},
        create: {
            name: "Demo User",
            email: "demo@spendwise.local",
        },
    });

    const checking = await prisma.account.upsert({
        where: { id: "demo-checking-account" },
        update: {},
        create: {
            id: "demo-checking-account",
            name: "Main Checking",
            type: "CHECKING",
            currency: "USD",
            balance: 12480.75,
            userId: user.id,
        },
    });

    const savings = await prisma.account.upsert({
        where: { id: "demo-savings-account" },
        update: {},
        create: {
            id: "demo-savings-account",
            name: "Savings",
            type: "SAVINGS",
            currency: "USD",
            balance: 5000,
            userId: user.id,
        },
    });

    const transactions = [
        {
            id: "demo-salary",
            title: "Monthly salary",
            amount: 4200,
            type: TransactionType.INCOME,
            category: "Salary",
            accountId: checking.id,
            date: new Date("2026-10-24T09:00:00Z"),
        },
        {
            id: "demo-groceries",
            title: "Grocery shopping",
            amount: 86.4,
            type: TransactionType.EXPENSE,
            category: "Food & groceries",
            accountId: checking.id,
            date: new Date("2026-10-23T12:00:00Z"),
        },
        {
            id: "demo-netflix",
            title: "Netflix subscription",
            amount: 15.99,
            type: TransactionType.EXPENSE,
            category: "Subscriptions",
            accountId: checking.id,
            date: new Date("2026-10-22T12:00:00Z"),
        },
        {
            id: "demo-freelance",
            title: "Freelance project",
            amount: 850,
            type: TransactionType.INCOME,
            category: "Freelance",
            accountId: checking.id,
            date: new Date("2026-10-21T12:00:00Z"),
        },
        {
            id: "demo-coffee",
            title: "Coffee shop",
            amount: 8.5,
            type: TransactionType.EXPENSE,
            category: "Food & drink",
            accountId: checking.id,
            date: new Date("2026-10-20T12:00:00Z"),
        },
    ];

    for (const transaction of transactions) {
        await prisma.transaction.upsert({
            where: { id: transaction.id },
            update: {},
            create: {
                ...transaction,
                userId: user.id,
            },
        });
    }

    console.log("Demo data created successfully.");
    console.log(`User: ${user.email}`);
    console.log(`Accounts: ${checking.name}, ${savings.name}`);
    console.log(`Transactions: ${transactions.length}`);
}

main()
    .catch((error) => {
        console.error("Failed to create demo data:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
