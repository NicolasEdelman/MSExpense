/*
  Warnings:

  - You are about to drop the `Company` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_userId_companyId_fkey";

-- DropForeignKey
ALTER TABLE "ExpenseCategory" DROP CONSTRAINT "ExpenseCategory_companyId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_companyId_fkey";

-- DropTable
DROP TABLE "Company";

-- DropTable
DROP TABLE "User";

-- DropEnum
DROP TYPE "Role";
