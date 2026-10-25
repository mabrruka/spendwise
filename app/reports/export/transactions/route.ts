
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_PERIODS = [3, 6, 12, 24];

function csvCell(value: string | number | null | undefined) {
    const text = String(value ?? "");

    // Prevent spreadsheet formula injection.
    const safeText = /^[=+\-@\t\r]/.test(text)
        ? `'${text}`
        : text;

    return `"${safeText.replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest) {
    const requestedPeriod = Number(
        request.nextUrl.searchParams.get("period") ?? "12",
    );

    const period = ALLOWED_PERIODS.includes(requestedPeriod)
        ? requestedPeriod
        : 12;

    const now = new Date();

    const firstMonthStart = new Date(
        Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth() - period + 1,
            1,
        ),
    );

    const nextMonthStart = new Date(
        Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth() + 1,
            1,
        ),
    );

    const transactions = await prisma.transaction.findMany({
        where: {
            user: {
                email: "demo@spendwise.local",
            },
            type: {
                in: ["INCOME", "EXPENSE"],
            },
            date: {
                gte: firstMonthStart,
                lt: nextMonthStart,
            },
            account: {
                currency: "USD",
            },
        },
        include: {
            account: true,
        },
        orderBy: [
            {
                date: "desc",
            },
            {
                createdAt: "desc",
            },
        ],
    });

    const rows = [
        [
            "Date",
            "Title",
            "Type",
            "Category",
            "Account",
            "Amount (USD)",
            "Description",
        ],
        ...transactions.map((transaction) => [
            transaction.date.toISOString().slice(0, 10),
            transaction.title,
            transaction.type,
            transaction.category,
            transaction.account.name,
            transaction.amount.toFixed(2),
            transaction.description ?? "",
        ]),
    ];

    const csv = rows
        .map((row) => row.map(csvCell).join(","))
        .join("\r\n");

    const filename =
        `spendwise-transactions-${period}-months.csv`;

    return new NextResponse("\uFEFF" + csv, {
        status: 200,
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Cache-Control": "private, no-store",
        },
    });
}
