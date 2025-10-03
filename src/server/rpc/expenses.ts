import { call, os } from "@orpc/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { createKV } from "@/server/lib/create-kv";

const ExpenseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  username: z.string(),
  date: z.string(),
  amount: z.number(),
  vat: z.number(),
  category: z.string(),
  purchaser: z.string(),
  receiptPath: z.string().optional(),
  isReimbursed: z.boolean(),
  createdAt: z.string(),
});

type Expense = z.output<typeof ExpenseSchema>;

const expensesKV = createKV<Expense>("expenses");

import { sessionsKV } from "./auth-shared";

const create = os
  .input(
    z.object({
      sessionId: z.string(),
      date: z.string(),
      amount: z.number(),
      vat: z.number(),
      category: z.string(),
      purchaser: z.string(),
      receiptPath: z.string().optional(),
    })
  )
  .handler(async ({ input }) => {
    const session = await sessionsKV.getItem(input.sessionId);
    if (!session) {
      throw new Error("Unauthorized");
    }

    const expense: Expense = {
      id: randomUUID(),
      userId: session.userId,
      username: session.username,
      date: input.date,
      amount: input.amount,
      vat: input.vat,
      category: input.category,
      purchaser: input.purchaser,
      receiptPath: input.receiptPath,
      isReimbursed: false,
      createdAt: new Date().toISOString(),
    };

    await expensesKV.setItem(expense.id, expense);
    return expense;
  });

const list = os
  .input(
    z.object({
      sessionId: z.string(),
      month: z.string().optional(),
      category: z.string().optional(),
      reimbursed: z.boolean().optional(),
    })
  )
  .handler(async ({ input }) => {
    const session = await sessionsKV.getItem(input.sessionId);
    if (!session) {
      throw new Error("Unauthorized");
    }

    let expenses = await expensesKV.getAllItems();

    if (!session.isAdmin) {
      expenses = expenses.filter((e) => e.userId === session.userId);
    }

    if (input.month) {
      const monthStr = input.month;
      expenses = expenses.filter((e) => e.date.startsWith(monthStr));
    }

    if (input.category) {
      expenses = expenses.filter((e) => e.category === input.category);
    }

    if (input.reimbursed !== undefined) {
      expenses = expenses.filter((e) => e.isReimbursed === input.reimbursed);
    }

    return expenses.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });

const live = {
  list: os
    .input(
      z.object({
        sessionId: z.string(),
        month: z.string().optional(),
        category: z.string().optional(),
        reimbursed: z.boolean().optional(),
      })
    )
    .handler(async function* ({ input, signal }) {
      yield await call(list, input, { signal });
      for await (const _ of expensesKV.subscribe()) {
        yield await call(list, input, { signal });
      }
    }),
};

const markReimbursed = os
  .input(
    z.object({
      sessionId: z.string(),
      expenseId: z.string(),
      isReimbursed: z.boolean(),
    })
  )
  .handler(async ({ input }) => {
    const session = await sessionsKV.getItem(input.sessionId);
    if (!session?.isAdmin) {
      throw new Error("Unauthorized");
    }

    const expense = await expensesKV.getItem(input.expenseId);
    if (!expense) {
      throw new Error("Expense not found");
    }

    expense.isReimbursed = input.isReimbursed;
    await expensesKV.setItem(expense.id, expense);
    return expense;
  });

const getCategories = os.handler(async () => {
  const expenses = await expensesKV.getAllItems();
  const categories = [...new Set(expenses.map((e) => e.category))];
  return categories.sort();
});

const exportCSV = os
  .input(
    z.object({
      sessionId: z.string(),
      month: z.string().optional(),
      category: z.string().optional(),
      reimbursed: z.boolean().optional(),
    })
  )
  .handler(async ({ input }) => {
    const session = await sessionsKV.getItem(input.sessionId);
    if (!session?.isAdmin) {
      throw new Error("Unauthorized");
    }

    let expenses = await expensesKV.getAllItems();

    if (input.month) {
      const monthStr = input.month;
      expenses = expenses.filter((e) => e.date.startsWith(monthStr));
    }

    if (input.category) {
      expenses = expenses.filter((e) => e.category === input.category);
    }

    if (input.reimbursed !== undefined) {
      expenses = expenses.filter((e) => e.isReimbursed === input.reimbursed);
    }

    const sortedExpenses = expenses.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const headers = [
      "Date",
      "Amount",
      "VAT",
      "Category",
      "Purchaser",
      "User",
      "Reimbursed",
    ];
    const rows = sortedExpenses.map((e) => [
      e.date,
      e.amount.toString(),
      e.vat.toString(),
      e.category,
      e.purchaser,
      e.username,
      e.isReimbursed ? "Yes" : "No",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    return csv;
  });

export const router = {
  create,
  list,
  live,
  markReimbursed,
  getCategories,
  exportCSV,
};
