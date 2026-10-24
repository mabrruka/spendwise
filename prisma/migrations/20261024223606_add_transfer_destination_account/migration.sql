-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "toAccountId" TEXT;

-- CreateIndex
CREATE INDEX "Transaction_toAccountId_date_idx" ON "Transaction"("toAccountId", "date");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_toAccountId_fkey" FOREIGN KEY ("toAccountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
