
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logout } from "@/app/signout/actions";

const navigation = [
  { label: "Overview", icon: "◫", href: "/dashboard" },
  { label: "Transactions", icon: "↕", href: "/transactions" },
  { label: "Accounts", icon: "▤", href: "/accounts" },
  { label: "Analytics", icon: "▥", href: "/analytics" },
  { label: "Budgets", icon: "◎", href: "/budgets" },
  { label: "Reports", icon: "▤", href: "/reports" },
];

function money(value: number | string, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(Number(value));
}

function dateLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function Sidebar({
                   userName,
                   userEmail,
                 }: {
  userName: string;
  userEmail: string;
}) {
  const initials = userName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");

  return (
      <aside className="flex w-full flex-col border-b border-slate-200 bg-white px-5 py-5 md:min-h-screen md:w-64 md:border-b-0 md:border-r md:px-6">
        <Link href="/dashboard" className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-xl font-bold text-white">
          S
        </span>
          <span className="text-xl font-bold tracking-tight">
          spendwise
        </span>
        </Link>

        <p className="mb-3 mt-9 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          Workspace
        </p>

        <nav className="flex gap-2 overflow-x-auto md:flex-col">
          {navigation.map((item) => {
            const active = item.href === "/dashboard";

            return (
                <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                        active
                            ? "bg-emerald-50 text-emerald-700"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                >
              <span className="w-5 text-center text-lg">
                {item.icon}
              </span>
                  {item.label}
                </Link>
            );
          })}
        </nav>

        <div className="mt-auto hidden rounded-2xl bg-slate-50 p-4 md:block">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
            ✦
          </div>

          <p className="text-sm font-semibold">
            Your money, in focus
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Understand your spending and build healthier
            financial habits.
          </p>
        </div>

        <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-800">
            {initials || "SW"}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {userName}
            </p>
            <p className="truncate text-xs text-slate-500">
              {userEmail}
            </p>
          </div>
        </div>

        <form action={logout} className="mt-5">
          <button
              type="submit"
              className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-left text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
          >
            Sign out
          </button>
        </form>
      </aside>
  );
}

function DashboardSkeleton() {
  return (
      <div
          className="mt-8 animate-pulse space-y-6"
          aria-label="Loading dashboard"
      >
        <div className="h-60 rounded-3xl bg-slate-200" />
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="h-80 rounded-2xl bg-slate-200 lg:col-span-2" />
          <div className="h-80 rounded-2xl bg-slate-200" />
        </div>
        <div className="h-72 rounded-2xl bg-slate-200" />
      </div>
  );
}

async function DashboardContent() {
  await connection();

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/signin");
  }

  const now = new Date();

  const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );

  const nextMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );

  const currentMonthValue = monthStart.toISOString().slice(0, 7);

  const [
    accounts,
    transactions,
    totals,
    budgets,
    monthlyExpenses,
  ] = await Promise.all([
    prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),

    prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 10,
      include: {
        account: true,
        toAccount: true,
      },
    }),

    prisma.transaction.groupBy({
      by: ["type"],
      where: { userId },
      _sum: { amount: true },
    }),

    prisma.budget.findMany({
      where: {
        userId,
        month: monthStart,
      },
      orderBy: { category: "asc" },
    }),

    prisma.transaction.groupBy({
      by: ["category"],
      where: {
        userId,
        type: "EXPENSE",
        date: {
          gte: monthStart,
          lt: nextMonth,
        },
        account: {
          currency: "USD",
        },
      },
      _sum: { amount: true },
    }),
  ]);

  const totalBalance = accounts
      .filter((account) => account.currency === "USD")
      .reduce((sum, account) => sum + Number(account.balance), 0);

  const totalIncome = Number(
      totals.find((item) => item.type === "INCOME")
          ?._sum.amount ?? 0,
  );

  const totalExpenses = Number(
      totals.find((item) => item.type === "EXPENSE")
          ?._sum.amount ?? 0,
  );

  const spendingByCategory = new Map(
      monthlyExpenses.map((item) => [
        item.category,
        Number(item._sum.amount ?? 0),
      ]),
  );

  const budgetItems = budgets.map((budget) => {
    const limit = Number(budget.amount);
    const spent = spendingByCategory.get(budget.category) ?? 0;

    return {
      id: budget.id,
      category: budget.category,
      limit,
      spent,
      remaining: limit - spent,
      percentage: limit > 0 ? (spent / limit) * 100 : 0,
    };
  });

  const totalBudget = budgetItems.reduce(
      (sum, item) => sum + item.limit,
      0,
  );

  const totalBudgetSpent = budgetItems.reduce(
      (sum, item) => sum + item.spent,
      0,
  );

  const totalBudgetRemaining = totalBudget - totalBudgetSpent;

  const overallBudgetPercentage =
      totalBudget > 0
          ? (totalBudgetSpent / totalBudget) * 100
          : 0;

  const overBudgetCount = budgetItems.filter(
      (item) => item.spent > item.limit,
  ).length;

  return (
      <main className="min-h-screen bg-[#f7f8fa] text-slate-900 md:flex">

        <Sidebar
            userName={session?.user?.name || "Spendwise User"}
            userEmail={session?.user?.email || ""}
        />

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
                Here&apos;s what&apos;s happening with your money.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                  href="/analytics"
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                View analytics
              </Link>

              <Link
                  href="/transactions/new"
                  className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                + Add transaction
              </Link>
            </div>
          </header>

          {/* BALANCE SUMMARY */}
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
                  Across{" "}
                  {accounts.filter((a) => a.currency === "USD").length}{" "}
                  USD accounts
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

          {/* RECENT TRANSACTIONS AND ACCOUNTS */}
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

                <Link
                    href="/transactions"
                    className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  View all
                </Link>
              </div>

              {transactions.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-sm text-slate-500">
                      No transactions yet.
                    </p>

                    <Link
                        href="/transactions/new"
                        className="mt-4 inline-block text-sm font-semibold text-emerald-700"
                    >
                      Add your first transaction
                    </Link>
                  </div>
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
                                        : isTransfer
                                            ? "bg-blue-50 text-blue-700"
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
                                {isTransfer && transaction.toAccount && (
                                    <>
                                      {" → "}
                                      {transaction.toAccount.name}
                                    </>
                                )}
                              </p>
                            </div>

                            <p
                                className={`shrink-0 text-sm font-semibold ${
                                    isIncome
                                        ? "text-emerald-700"
                                        : isTransfer
                                            ? "text-blue-700"
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
              <div className="flex items-center justify-between">
                <h2 className="font-bold">Your accounts</h2>
                <Link
                    href="/accounts"
                    className="text-sm font-semibold text-emerald-700"
                >
                  View all
                </Link>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Balances from your database
              </p>

              {accounts.length === 0 ? (
                  <div className="py-8">
                    <p className="text-sm text-slate-500">
                      No accounts yet.
                    </p>

                    <Link
                        href="/accounts/new"
                        className="mt-4 inline-block text-sm font-semibold text-emerald-700"
                    >
                      + Create account
                    </Link>
                  </div>
              ) : (
                  <div className="mt-5 space-y-3">
                    {accounts.map((account) => (
                        <div
                            key={account.id}
                            className="rounded-xl border border-slate-100 p-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 font-bold text-emerald-700">
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

          {/* MONTHLY BUDGET OVERVIEW */}
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold">
                  Monthly Budget Overview
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {monthLabel(monthStart)} · Track your spending
                  against your monthly limits
                </p>
              </div>

              <Link
                  href={`/budgets?month=${currentMonthValue}`}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                Manage budgets →
              </Link>
            </div>

            {budgetItems.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <p className="font-semibold text-slate-700">
                    No budgets set for this month
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    Create a monthly budget to start tracking
                    your spending.
                  </p>

                  <Link
                      href={`/budgets/new?month=${currentMonthValue}`}
                      className="mt-5 inline-block rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    + Create budget
                  </Link>
                </div>
            ) : (
                <>
                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">
                        Total budget
                      </p>
                      <p className="mt-2 text-2xl font-bold">
                        {money(totalBudget)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">
                        Total spent
                      </p>
                      <p className="mt-2 text-2xl font-bold text-rose-600">
                        {money(totalBudgetSpent)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">
                        Remaining
                      </p>

                      <p
                          className={`mt-2 text-2xl font-bold ${
                              totalBudgetRemaining >= 0
                                  ? "text-emerald-700"
                                  : "text-rose-600"
                          }`}
                      >
                        {money(totalBudgetRemaining)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">
                        Overall budget usage
                      </p>

                      <p className="text-sm font-semibold text-slate-600">
                        {overallBudgetPercentage.toFixed(1)}%
                      </p>
                    </div>

                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                          className={`h-full rounded-full ${
                              overallBudgetPercentage > 100
                                  ? "bg-rose-500"
                                  : overallBudgetPercentage >= 80
                                      ? "bg-amber-500"
                                      : "bg-emerald-500"
                          }`}
                          style={{
                            width: `${Math.min(
                                Math.max(overallBudgetPercentage, 0),
                                100,
                            )}%`,
                          }}
                      />
                    </div>

                    {overBudgetCount > 0 && (
                        <p className="mt-3 text-sm font-medium text-rose-700">
                          {overBudgetCount}{" "}
                          {overBudgetCount === 1
                              ? "category is"
                              : "categories are"}{" "}
                          over budget.
                        </p>
                    )}
                  </div>

                  <div className="mt-7 border-t border-slate-100 pt-6">
                    <h3 className="font-bold">
                      Spending by category
                    </h3>

                    <div className="mt-5 grid gap-5 md:grid-cols-2">
                      {budgetItems.map((item) => {
                        const progressColor =
                            item.percentage > 100
                                ? "bg-rose-500"
                                : item.percentage >= 80
                                    ? "bg-amber-500"
                                    : "bg-emerald-500";

                        return (
                            <div
                                key={item.id}
                                className="rounded-xl border border-slate-100 p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold">
                                    {item.category}
                                  </p>

                                  <p className="mt-1 text-xs text-slate-500">
                                    Limit: {money(item.limit)}
                                  </p>
                                </div>

                                <p className="text-sm font-bold">
                                  {money(item.spent)}
                                </p>
                              </div>

                              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className={`h-full rounded-full ${progressColor}`}
                                    style={{
                                      width: `${Math.min(
                                          Math.max(item.percentage, 0),
                                          100,
                                      )}%`,
                                    }}
                                />
                              </div>

                              <div className="mt-3 flex justify-between gap-2 text-xs">
                          <span className="text-slate-500">
                            {item.percentage.toFixed(1)}% used
                          </span>

                                <span
                                    className={
                                      item.remaining >= 0
                                          ? "font-semibold text-emerald-700"
                                          : "font-semibold text-rose-600"
                                    }
                                >
                            {item.remaining >= 0
                                ? `${money(item.remaining)} left`
                                : `${money(Math.abs(item.remaining))} over`}
                          </span>
                              </div>

                              <Link
                                  href={`/budgets/${item.id}/edit`}
                                  className="mt-4 inline-block text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                              >
                                Edit limit →
                              </Link>
                            </div>
                        );
                      })}
                    </div>
                  </div>
                </>
            )}
          </section>

          <p className="mt-6 text-center text-xs text-slate-400">
            Spendwise · Personal finance made clearer
          </p>
        </section>
      </main>
  );
}

export default function DashboardPage() {
  return (
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
  );
}

