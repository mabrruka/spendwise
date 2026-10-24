
const transactions = [
  {
    name: "Monthly salary",
    category: "Income",
    date: "Oct 24, 2026",
    amount: 4200,
    type: "income",
    initials: "MS",
  },
  {
    name: "Grocery shopping",
    category: "Food & groceries",
    date: "Oct 23, 2026",
    amount: -86.4,
    type: "expense",
    initials: "GS",
  },
  {
    name: "Netflix subscription",
    category: "Subscriptions",
    date: "Oct 22, 2026",
    amount: -15.99,
    type: "expense",
    initials: "N",
  },
  {
    name: "Freelance project",
    category: "Income",
    date: "Oct 21, 2026",
    amount: 850,
    type: "income",
    initials: "FP",
  },
  {
    name: "Coffee shop",
    category: "Food & drink",
    date: "Oct 20, 2026",
    amount: -8.5,
    type: "expense",
    initials: "CS",
  },
];

const money = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

const navigation = [
  { label: "Overview", icon: "◫", active: true },
  { label: "Transactions", icon: "↕", active: false },
  { label: "Accounts", icon: "▤", active: false },
  { label: "Budgets", icon: "◎", active: false },
  { label: "Reports", icon: "▥", active: false },
];

const spendingCategories = [
  { label: "Housing", amount: 850, color: "bg-emerald-500" },
  { label: "Food & groceries", amount: 420, color: "bg-blue-500" },
  { label: "Transport", amount: 225, color: "bg-amber-500" },
  { label: "Other", amount: 350.25, color: "bg-violet-500" },
];

export default function Home() {
  const totalIncome = 5050;
  const totalExpenses = 1845.25;
  const totalBalance = 12480.75;

  return (
      <main className="min-h-screen bg-[#f7f8fa] text-slate-900 md:flex">
        <aside className="flex w-full flex-col border-b border-slate-200 bg-white px-5 py-5 md:min-h-screen md:w-64 md:border-b-0 md:border-r md:px-6">
          <a href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-xl font-bold text-white">
            S
          </span>
            <span className="text-xl font-bold tracking-tight">spendwise</span>
          </a>

          <p className="mb-3 mt-9 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Workspace
          </p>

          <nav className="flex gap-2 overflow-x-auto md:flex-col">
            {navigation.map((item) => (
                <a
                    key={item.label}
                    href={item.active ? "/" : "#"}
                    aria-current={item.active ? "page" : undefined}
                    className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                        item.active
                            ? "bg-emerald-50 text-emerald-700"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                >
                  <span className="w-5 text-center text-lg">{item.icon}</span>
                  {item.label}
                </a>
            ))}
          </nav>

          <div className="mt-auto hidden rounded-2xl bg-slate-50 p-4 md:block">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
              ✦
            </div>
            <p className="text-sm font-semibold">Your money, in focus</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Understand your spending and build healthier financial habits.
            </p>
          </div>

          <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-800">
              MA
            </div>
            <div>
              <p className="text-sm font-semibold">My workspace</p>
              <p className="text-xs text-slate-500">Personal account</p>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1 px-5 py-7 sm:px-8 lg:px-10">
          <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm text-slate-500">Saturday, October 24, 2026</p>
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

          <section className="mt-8 rounded-3xl bg-slate-900 p-6 text-white shadow-sm sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-300">Total balance</p>
                <p className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  {money(totalBalance)}
                </p>
                <p className="mt-3 text-sm text-slate-300">
                  Across your personal accounts
                </p>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
              Sample data
            </span>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 border-t border-white/10 pt-5 sm:grid-cols-3">
              <div>
                <p className="text-sm text-slate-300">Monthly income</p>
                <p className="mt-2 text-xl font-semibold text-emerald-300">
                  {money(totalIncome)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-300">Monthly expenses</p>
                <p className="mt-2 text-xl font-semibold">
                  {money(totalExpenses)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-300">Money remaining</p>
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
                  <h2 className="font-bold">Recent transactions</h2>
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

              <div className="mt-5 divide-y divide-slate-100">
                {transactions.map((transaction) => (
                    <div
                        key={transaction.name}
                        className="flex items-center gap-3 py-4 first:pt-2 last:pb-1"
                    >
                      <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                              transaction.type === "income"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-600"
                          }`}
                      >
                        {transaction.initials}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {transaction.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {transaction.category} · {transaction.date}
                        </p>
                      </div>

                      <p
                          className={`shrink-0 text-sm font-semibold ${
                              transaction.amount > 0
                                  ? "text-emerald-700"
                                  : "text-slate-900"
                          }`}
                      >
                        {transaction.amount > 0 ? "+" : ""}
                        {money(transaction.amount)}
                      </p>
                    </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="font-bold">Spending snapshot</h2>
              <p className="mt-1 text-sm text-slate-500">
                This month’s expenses
              </p>

              <div className="mt-6 flex items-center justify-center">
                <div className="flex h-44 w-44 flex-col items-center justify-center rounded-full border-[14px] border-emerald-500">
                  <span className="text-xs text-slate-500">Total spent</span>
                  <span className="mt-1 text-2xl font-bold">
                  {money(totalExpenses)}
                </span>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {spendingCategories.map((category) => (
                    <div key={category.label}>
                      <div className="mb-2 flex justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span
                          className={`h-2.5 w-2.5 rounded-full ${category.color}`}
                      />
                      {category.label}
                    </span>
                        <span className="font-semibold">
                      {money(category.amount)}
                    </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                            className={`h-full rounded-full ${category.color}`}
                            style={{
                              width: `${(category.amount / totalExpenses) * 100}%`,
                            }}
                        />
                      </div>
                    </div>
                ))}
              </div>
            </section>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            Spendwise · Personal finance made clearer
          </p>
        </section>
      </main>
  );
}
