-- DropForeignKey
ALTER TABLE "invoice_items" DROP CONSTRAINT "invoice_items_invoice_id_fkey";

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "amount_paid" DECIMAL(10,2),
ADD COLUMN     "amount_to_pay" DECIMAL(10,2),
ADD COLUMN     "discount" DECIMAL(10,2),
ADD COLUMN     "payment_method" TEXT,
ADD COLUMN     "store_address" TEXT,
ADD COLUMN     "store_cnpj" TEXT,
ALTER COLUMN "url" DROP NOT NULL;

-- CreateTable
CREATE TABLE "budgets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category_id" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "period" TEXT NOT NULL DEFAULT 'monthly',
    "current_spent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_reset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alert_50_sent" BOOLEAN NOT NULL DEFAULT false,
    "alert_80_sent" BOOLEAN NOT NULL DEFAULT false,
    "alert_100_sent" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_alerts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "budget_id" TEXT NOT NULL,
    "threshold" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "budget_amount" DOUBLE PRECISION NOT NULL,
    "percentage" INTEGER NOT NULL,
    "category_name" TEXT,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "opened" BOOLEAN NOT NULL DEFAULT false,
    "opened_at" TIMESTAMP(3),

    CONSTRAINT "budget_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "budget_id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "target_amount" DOUBLE PRECISION NOT NULL,
    "spent_amount" DOUBLE PRECISION NOT NULL,
    "percentage" INTEGER NOT NULL,
    "achieved" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "budgets_user_id_idx" ON "budgets"("user_id");

-- CreateIndex
CREATE INDEX "budgets_user_id_active_idx" ON "budgets"("user_id", "active");

-- CreateIndex
CREATE INDEX "budget_alerts_user_id_idx" ON "budget_alerts"("user_id");

-- CreateIndex
CREATE INDEX "budget_alerts_budget_id_idx" ON "budget_alerts"("budget_id");

-- CreateIndex
CREATE INDEX "budget_history_user_id_idx" ON "budget_history"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "budget_history_budget_id_month_key" ON "budget_history"("budget_id", "month");

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_alerts" ADD CONSTRAINT "budget_alerts_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_history" ADD CONSTRAINT "budget_history_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
