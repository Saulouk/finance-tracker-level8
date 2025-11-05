import { os } from "@orpc/server";
import { z } from "zod";
import { createKV } from "@/server/lib/create-kv.js";
import { sessionsKV } from "./auth-shared.js";
import { incomeKV } from "./income-shared.js";
import { expensesKV } from "./expenses-shared.js";

const BalanceOverrideSchema = z.object({
  paymentType: z.string(),
  amount: z.number(),
  updatedAt: z.string(),
});

const DirectorLoanOverrideSchema = z.object({
  director: z.string(),
  amount: z.number(),
  updatedAt: z.string(),
});

const balanceOverridesKV = createKV<z.output<typeof BalanceOverrideSchema>>("balance-overrides");
const directorLoanOverridesKV = createKV<z.output<typeof DirectorLoanOverrideSchema>>("director-loan-overrides");

const getBalances = os
  .input(z.object({ sessionId: z.string() }))
  .handler(async ({ input }) => {
    const session = await sessionsKV.getItem(input.sessionId);
    if (!session) {
      throw new Error("Unauthorized");
    }

    const incomes = await incomeKV.getAllItems();
    const expenses = await expensesKV.getAllItems();

    const paymentTypes = ["Card", "Cash", "WeChat", "Credit"];
    const directors = ["Diego", "Leo", "Saulo", "Warren"];

    const balances: Record<string, { calculated: number; override?: number; final: number }> = {};
    const directorLoans: Record<string, { calculated: number; override?: number; final: number }> = {};

    for (const type of paymentTypes) {
      const incomeTotal = incomes.reduce((sum, income) => {
        return sum + income.paymentMethods
          .filter((pm) => pm.type === type)
          .reduce((pmSum, pm) => pmSum + pm.amount, 0);
      }, 0);

      const expenseTotal = expenses.reduce((sum, expense) => {
        return sum + (expense.category === type ? expense.amount : 0);
      }, 0);

      const calculated = incomeTotal - expenseTotal;
      const override = await balanceOverridesKV.getItem(type);

      balances[type] = {
        calculated,
        override: override?.amount,
        final: override?.amount ?? calculated,
      };
    }

    for (const director of directors) {
      const calculated = 0;
      const override = await directorLoanOverridesKV.getItem(director);

      directorLoans[director] = {
        calculated,
        override: override?.amount,
        final: override?.amount ?? calculated,
      };
    }

    return {
      balances,
      directorLoans,
    };
  });

const setBalanceOverride = os
  .input(
    z.object({
      sessionId: z.string(),
      paymentType: z.string(),
      amount: z.number(),
    })
  )
  .handler(async ({ input }) => {
    const session = await sessionsKV.getItem(input.sessionId);
    if (!session?.isAdmin) {
      throw new Error("Unauthorized");
    }

    const override = {
      paymentType: input.paymentType,
      amount: input.amount,
      updatedAt: new Date().toISOString(),
    };

    await balanceOverridesKV.setItem(input.paymentType, override);
    return { success: true };
  });

const setDirectorLoanOverride = os
  .input(
    z.object({
      sessionId: z.string(),
      director: z.string(),
      amount: z.number(),
    })
  )
  .handler(async ({ input }) => {
    const session = await sessionsKV.getItem(input.sessionId);
    if (!session?.isAdmin) {
      throw new Error("Unauthorized");
    }

    const override = {
      director: input.director,
      amount: input.amount,
      updatedAt: new Date().toISOString(),
    };

    await directorLoanOverridesKV.setItem(input.director, override);
    return { success: true };
  });

const clearBalanceOverride = os
  .input(
    z.object({
      sessionId: z.string(),
      paymentType: z.string(),
    })
  )
  .handler(async ({ input }) => {
    const session = await sessionsKV.getItem(input.sessionId);
    if (!session?.isAdmin) {
      throw new Error("Unauthorized");
    }

    await balanceOverridesKV.removeItem(input.paymentType);
    return { success: true };
  });

const clearDirectorLoanOverride = os
  .input(
    z.object({
      sessionId: z.string(),
      director: z.string(),
    })
  )
  .handler(async ({ input }) => {
    const session = await sessionsKV.getItem(input.sessionId);
    if (!session?.isAdmin) {
      throw new Error("Unauthorized");
    }

    await directorLoanOverridesKV.removeItem(input.director);
    return { success: true };
  });

export const router = {
  getBalances,
  setBalanceOverride,
  setDirectorLoanOverride,
  clearBalanceOverride,
  clearDirectorLoanOverride,
};
