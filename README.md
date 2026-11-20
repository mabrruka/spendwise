
# Spendwise

Spendwise is a full-stack personal finance management application built with Next.js, TypeScript, Prisma, and PostgreSQL. It helps users manage financial accounts, track income and expenses, transfer money, set monthly budgets, and analyze spending through interactive reports.

## Features

- **User Authentication:** Account registration, sign-in, sign-out, and secure password hashing.
- **Financial Dashboard:** Overview of account balances, recent transactions, and monthly budgets.
- **Account Management:** Create, view, edit, and delete financial accounts with multiple account types and currencies.
- **Transaction Management:** Record, edit, delete, search, and filter income and expense transactions.
- **Money Transfers:** Transfer funds between accounts with atomic database transactions and balance validation.
- **Budget Management:** Create and manage monthly category budgets, track spending, and monitor budget progress.
- **Spending Analytics:** Analyze income, expenses, and spending by category and month.
- **Financial Reports:** View financial summaries and trends across multiple reporting periods.
- **CSV Export:** Download monthly financial reports and detailed transaction data.
- **Responsive Interface:** Clean, responsive UI built with Tailwind CSS.

## Tech Stack

| Category | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Frontend | React, Tailwind CSS 4 |
| Backend | Next.js Server Actions, Route Handlers |
| Database | PostgreSQL 17 |
| ORM | Prisma 6 |
| Authentication | Auth.js (NextAuth.js v5), bcryptjs |
| Validation | Zod |
| Database Infrastructure | Docker, Docker Compose |

## Getting Started

### Prerequisites

- Node.js and npm
- Docker and Docker Compose

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/YOUR_USERNAME/spendwise.git
   cd spendwise
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables.

   Create a `.env` file in the project root and set your PostgreSQL connection string:

   ```env
   DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/spendwise?schema=public"
   ```

   Create a `.env.local` file for the authentication secret:

   ```env
   AUTH_SECRET="YOUR_GENERATED_SECRET"
   ```

   Generate a secure secret using:

   ```bash
   openssl rand -base64 32
   ```

   Update the database credentials to match your Docker configuration. Do not commit environment files containing secrets.

4. Start PostgreSQL using Docker Compose:

   ```bash
   docker compose up -d
   ```

5. Apply database migrations and generate the Prisma Client:

   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

6. Start the development server:

   ```bash
   npm run dev
   ```

7. Open the application:

   http://localhost:3000

Create an account through the sign-up page to get started.

## Project Architecture

Spendwise uses the Next.js App Router architecture, with server-rendered pages, Server Actions for data mutations, and Prisma for database access.

```text
spendwise/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts
│   ├── accounts/
│   │   ├── new/
│   │   └── [id]/
│   │       ├── edit/
│   │       └── delete/
│   ├── analytics/
│   ├── budgets/
│   │   ├── new/
│   │   └── [id]/
│   │       ├── edit/
│   │       └── delete/
│   ├── dashboard/
│   ├── reports/
│   │   └── export/
│   │       └── transactions/
│   ├── signin/
│   ├── signout/
│   ├── signup/
│   ├── transactions/
│   │   ├── new/
│   │   └── [id]/
│   │       ├── edit/
│   │       └── delete/
│   ├── transfers/
│   │   └── new/
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── prisma.ts
│   └── require-user.ts
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── auth.ts
├── package.json
└── README.md
```

### Application Layers

- **Presentation Layer:** Next.js pages and React components render the dashboard, forms, account lists, analytics, and reports.
- **Application Layer:** Server Actions handle account, transaction, transfer, and budget operations.
- **Authentication Layer:** Auth.js manages credentials-based authentication and user sessions.
- **Data Access Layer:** Prisma Client communicates with PostgreSQL.
- **Database Layer:** PostgreSQL stores users, accounts, transactions, and budgets.
- **Infrastructure Layer:** Docker provides a reproducible local database environment.

## Database Schema

The application uses four main Prisma models.

### User

Stores user information and authentication credentials.

| Field | Description |
| --- | --- |
| id | Unique user identifier |
| name | User's display name |
| email | Unique email address |
| passwordHash | Hashed password |
| createdAt | Account creation timestamp |
| updatedAt | Last update timestamp |

### Account

Represents a financial account owned by a user.

| Field | Description |
| --- | --- |
| id | Unique account identifier |
| name | Account name |
| type | Checking, savings, cash, or other account type |
| currency | Account currency |
| balance | Current account balance |
| userId | Account owner |
| createdAt | Creation timestamp |
| updatedAt | Last update timestamp |

### Transaction

Stores income, expense, and transfer records.

| Field | Description |
| --- | --- |
| id | Unique transaction identifier |
| title | Transaction title |
| amount | Transaction amount |
| type | INCOME, EXPENSE, or TRANSFER |
| category | Transaction category |
| description | Optional description |
| date | Transaction date |
| userId | Transaction owner |
| accountId | Source account |
| toAccountId | Optional destination account for transfers |
| createdAt | Creation timestamp |
| updatedAt | Last update timestamp |

### Budget

Stores monthly spending limits by category.

| Field | Description |
| --- | --- |
| id | Unique budget identifier |
| category | Spending category |
| amount | Monthly budget limit |
| month | Budget month |
| userId | Budget owner |
| createdAt | Creation timestamp |
| updatedAt | Last update timestamp |

### Relationships

- A user can have multiple accounts, transactions, and budgets.
- Each account belongs to one user.
- Each transaction belongs to one user and has a source account.
- Transfer transactions can also reference a destination account.
- Each budget belongs to one user.
- A user can have only one budget per category per month.

## API Endpoints

Spendwise primarily uses Next.js Server Actions for application operations, rather than exposing a separate REST API.

### Authentication

| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/auth/[...nextauth]` | GET / POST | Auth.js authentication handlers |

### Reports

| Endpoint | Method | Description |
| --- | --- | --- |
| `/reports/export?period=6` | GET | Export monthly income and expense totals as CSV |
| `/reports/export/transactions?period=6` | GET | Export detailed transactions as CSV |

Supported reporting periods are 3, 6, 12, and 24 months.

### Server Actions

| Module | Operations |
| --- | --- |
| Accounts | Create, edit, and delete accounts |
| Transactions | Create, edit, and delete transactions |
| Transfers | Transfer funds between accounts |
| Budgets | Create, edit, and delete monthly budgets |
| Authentication | Sign up, sign in, and sign out |

Server Actions execute on the server and use Prisma to interact with PostgreSQL.

## Development Status

Spendwise is under active development.

