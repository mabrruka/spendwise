
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";

const navigation = [
  { label: "Overview", icon: "◫", href: "/", active: true },
  { label: "Transactions", icon: "↕", href: "/transactions", active: false },
  { label: "Accounts", icon: "▤", href: "/accounts", active: false },
  { label: "Budgets", icon: "◎", href: "/budgets", active: false },
  { label: "Reports", icon: "▥", href: "/reports", active: false },
];

function money(amount: number | string, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(Number(amount));
}

function dateLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function Sidebar() {
  return (
      <aside className="flex w-full flex-col border-b border-slate-200 bg-white px-5 py-5 md:min-h-screen md:w-64 md:border-b-0 md:border-r md:px-6">
        <a href="/" className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-xl font-bold text-white">
          S
        </span>
          <span className="text-xl font-bold tracking-tight">
          spendwise
        </span>
        </a>

        <p className="mb-3 mt-9 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          Workspace
        </p>

        <nav className="flex gap-2 overflow-x-auto md:flex-col">
          {navigation.map((item) => (
              <a
                  key={item.label}
                  href={item.href}
                  aria-current={item.active ? "page" : undefined}
                  className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                      item.active
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
              >
            <span className="w-5 text-center text-lg">
              {item.icon}
            </span>
                {item.label}
              </a>
          ))}
        </nav>

        <div className="mt-auto hidden rounded-2xl bg-slate-50 p-4 md:block">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
            ✦
          </div>
          <p className="text-sm font-semibold">
            Your money, in focus
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Understand your spending and build healthier financial habits.
          </p>
        </div>

        <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-800">
            DU
          </div>
          <div>
            <p className="text-sm font-semibold">
              Demo workspace
            </p>
            <p className="text-xs text-slate-500">
              Personal account
            </p>
          </div>
        </div>
      </aside>
  );
}

function DashboardSkeleton() {
  return (
      <div
          className="mt-8 space-y-6 animate-pulse"
          aria-label="Loading dashboard"
      >
        <div className="h-60 rounded-3xl bg-slate-200" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="h-80 rounded-2xl bg-slate-200 lg:col-span-2" />
          <div className="h-80 rounded-2xl bg-slate-200" />
        </div>
      </div>
  );
}

async function DashboardData() {
  const [accounts, transactions, totals] = await Promise.all([
    prisma.account.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.transaction.findMany({
      orderBy: { date: "desc" },
      take: 10,
      include: {
        account: true,
      },
    }),
    prisma.transaction.groupBy({
      by: ["type"],
      _sum: {
        amount: true,
      },
    }),
  ]);

  const totalBalance = accounts.reduce(
      (sum, account) => sum + Number(account.balance),
      0,
  );

  const totalIncome = Number(
      totals.find((item) => item.type === "INCOME")?._sum.amount ?? 0,
  );

  const totalExpenses = Number(
      totals.find((item) => item.type === "EXPENSE")?._sum.amount ?? 0,
  );

  return (
      <>
        <section className="mt-8 rounded-3xl bg-slate-900 p-6 text-white shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-300">
                Total balance
              </p>
              <p className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                {money(totalBalance)}
              </p>
              <p className="mt-3 text-sm text-slate-300">
                Across {accounts.length} personal{" "}
                {accounts.length === 1 ? "account" : "accounts"}
              </p>
            </div>

            <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
            Live database data
          </span>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 border-t border-white/10 pt-5 sm:grid-cols-3">
            <div>
              <p className="text-sm text-slate-300">
                Total income
              </p>
              <p className="mt-2 text-xl font-semibold text-emerald-300">
                {money(totalIncome)}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-300">
                Total expenses
              </p>
              <p className="mt-2 text-xl font-semibold">
                {money(totalExpenses)}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-300">
                Net cash flow
              </p>
              <p className="mt-2 text-xl font-semibold">
                {money(totalIncome - totalExpenses)}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold">
                  Recent transactions
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Your latest financial activity
                </p>
              </div>

              <a
                  href="/transactions"
                  className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
              >
                View all
              </a>
            </div>

            {transactions.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-500">
                  No transactions yet. Add your first transaction to get started.
                </p>
            ) : (
                <div className="mt-5 divide-y divide-slate-100">
                  {transactions.map((transaction) => {
                    const isIncome = transaction.type === "INCOME";
                    const isTransfer = transaction.type === "TRANSFER";

                    return (
                        <div
                            key={transaction.id}
                            className="flex items-center gap-3 py-4 first:pt-2 last:pb-1"
                        >
                          <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                                  isIncome
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-slate-100 text-slate-600"
                              }`}
                          >
                            {isIncome ? "IN" : isTransfer ? "TR" : "EX"}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                              {transaction.title}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {transaction.category} ·{" "}
                              {dateLabel(transaction.date)} ·{" "}
                              {transaction.account.name}
                            </p>
                          </div>

                          <p
                              className={`shrink-0 text-sm font-semibold ${
                                  isIncome
                                      ? "text-emerald-700"
                                      : "text-slate-900"
                              }`}
                          >
                            {isIncome ? "+" : isTransfer ? "" : "-"}
                            {money(
                                transaction.amount.toString(),
                                transaction.account.currency,
                            )}
                          </p>
                        </div>
                    );
                  })}
                </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="font-bold">
              Your accounts
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Balances from your database
            </p>

            {accounts.length === 0 ? (
                <p className="py-8 text-sm text-slate-500">
                  No accounts yet.
                </p>
            ) : (
                <div className="mt-5 space-y-3">
                  {accounts.map((account) => (
                      <div
                          key={account.id}
                          className="rounded-xl border border-slate-100 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                            {account.type === "SAVINGS" ? "S" : "C"}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                              {account.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {account.type.replaceAll("_", " ")}
                            </p>
                          </div>
                        </div>

                        <p className="mt-4 text-xl font-bold">
                          {money(
                              account.balance.toString(),
                              account.currency,
                          )}
                        </p>
                      </div>
                  ))}
                </div>
            )}
          </section>
        </div>
      </>
  );
}

export default function Home() {
  return (
      <main className="min-h-screen bg-[#f7f8fa] text-slate-900 md:flex">
        <Sidebar />

        <section className="min-w-0 flex-1 px-5 py-7 sm:px-8 lg:px-10">
          <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm text-slate-500">
                Spendwise dashboard
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                Financial overview
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Here’s what’s happening with your money.
              </p>
            </div>

            <a
                href="/transactions/new"
                className="w-fit rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              + Add transaction
            </a>
          </header>

          <Suspense fallback={<DashboardSkeleton />}>
            <DashboardData />
          </Suspense>

          <p className="mt-6 text-center text-xs text-slate-400">
            Spendwise · Personal finance made clearer
          </p>
        </section>
      </main>
  );
}
