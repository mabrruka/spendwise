
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_PERIODS = [3, 6, 12, 24];

function monthKey(date: Date) {
    return date.toISOString().slice(0, 7);
}

function csvCell(value: string | number) {
    const text = String(value);

    // Protect spreadsheet applications from CSV formula injection.
    const safeText = /^[=+\-@\t\r]/.test(text)
        ? `'${text}`
        : text;

    return `"${safeText.replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest) {
    // Read the reporting period from the URL.
    // Example: /reports/export?period=6

    const requestedPeriod = Number(
        request.nextUrl.searchParams.get("period") ?? "12",
    );

    const period = ALLOWED_PERIODS.includes(requestedPeriod)
        ? requestedPeriod
        : 12;

    // Calculate the reporting date range.
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

    // Retrieve income and expense transactions.
    // Transfers are intentionally excluded.
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
        select: {
            date: true,
            type: true,
            amount: true,
        },
        orderBy: {
            date: "asc",
        },
    });

    // Initialize every month, including empty months.
    const monthlyData = new Map<
        string,
        {
            income: number;
            expenses: number;
        }
    >();

    for (let offset = period - 1; offset >= 0; offset--) {
        const date = new Date(
            Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth() - offset,
                1,
            ),
        );

        monthlyData.set(monthKey(date), {
            income: 0,
            expenses: 0,
        });
    }

    // Calculate monthly income and expenses.
    for (const transaction of transactions) {
        const month = monthKey(transaction.date);
        const row = monthlyData.get(month);

        if (!row) {
            continue;
        }

        const amount = Number(transaction.amount);

        if (transaction.type === "INCOME") {
            row.income += amount;
        } else if (transaction.type === "EXPENSE") {
            row.expenses += amount;
        }
    }

    // Prepare the CSV header and monthly rows.
    const rows = [
        [
            "Month",
            "Income (USD)",
            "Expenses (USD)",
            "Net Cash Flow (USD)",
        ],
        ...Array.from(monthlyData.entries()).map(
            ([month, values]) => [
                month,
                values.income.toFixed(2),
                values.expenses.toFixed(2),
                (values.income - values.expenses).toFixed(2),
            ],
        ),
    ];

    // Convert rows into valid CSV text.
    const csv = rows
        .map((row) => row.map(csvCell).join(","))
        .join("\r\n");

    // Generate a filename based on the selected period.
    const filename = `spendwise-report-${period}-months.csv`;

    // Return the CSV as a downloadable file.
    return new NextResponse("\uFEFF" + csv, {
        status: 200,
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Cache-Control": "private, no-store",
        },
    });
}
