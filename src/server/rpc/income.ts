import { call, os } from "@orpc/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { sessionsKV } from "./auth-shared.js";
import { incomeKV, PaymentMethodSchema, IncomeSchema, Income } from "./income-shared.js";

const create = os
  .input(
    z.object({
      sessionId: z.string(),
      date: z.string(),
      room: z.string(),
      name: z.string(),
      bill: z.number(),
      paid: z.number(),
      paymentMethods: z.array(PaymentMethodSchema),
    })
  )
  .handler(async ({ input }) => {
    const session = await sessionsKV.getItem(input.sessionId);
    if (!session) {
      throw new Error("Unauthorized");
    }

    const income: Income = {
      id: randomUUID(),
      userId: session.userId,
      username: session.username,
      date: input.date,
      room: input.room,
      name: input.name,
      bill: input.bill,
      paid: input.paid,
      outstanding: input.bill - input.paid,
      paymentMethods: input.paymentMethods,
      createdAt: new Date().toISOString(),
    };

    await incomeKV.setItem(income.id, income);
    return income;
  });

const list = os
  .input(
    z.object({
      sessionId: z.string(),
      month: z.string().optional(),
      room: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    })
  )
  .handler(async ({ input }) => {
    const session = await sessionsKV.getItem(input.sessionId);
    if (!session) {
      throw new Error("Unauthorized");
    }

    let incomes = await incomeKV.getAllItems();

    if (!session.isAdmin) {
      incomes = incomes.filter((i) => i.userId === session.userId);
    }

    if (input.month) {
      const monthStr = input.month;
      incomes = incomes.filter((i) => i.date.startsWith(monthStr));
    }

    if (input.dateFrom) {
      incomes = incomes.filter((i) => i.date >= input.dateFrom!);
    }

    if (input.dateTo) {
      incomes = incomes.filter((i) => i.date <= input.dateTo!);
    }

    if (input.room) {
      incomes = incomes.filter((i) => i.room === input.room);
    }

    return incomes.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });

const update = os
  .input(
    z.object({
      sessionId: z.string(),
      incomeId: z.string(),
      paid: z.number(),
      paymentMethods: z.array(PaymentMethodSchema),
    })
  )
  .handler(async ({ input }) => {
    const session = await sessionsKV.getItem(input.sessionId);
    if (!session) {
      throw new Error("Unauthorized");
    }

    const income = await incomeKV.getItem(input.incomeId);
    if (!income) {
      throw new Error("Income not found");
    }

    income.paid = input.paid;
    income.outstanding = income.bill - input.paid;
    income.paymentMethods = input.paymentMethods;

    await incomeKV.setItem(income.id, income);
    return income;
  });

const deleteIncome = os
  .input(
    z.object({
      sessionId: z.string(),
      incomeId: z.string(),
    })
  )
  .handler(async ({ input }) => {
    const session = await sessionsKV.getItem(input.sessionId);
    if (!session?.isAdmin) {
      throw new Error("Unauthorized");
    }

    await incomeKV.removeItem(input.incomeId);
    return { success: true };
  });

const exportCSV = os
  .input(
    z.object({
      sessionId: z.string(),
      month: z.string().optional(),
      room: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    })
  )
  .handler(async ({ input }) => {
    const session = await sessionsKV.getItem(input.sessionId);
    if (!session?.isAdmin) {
      throw new Error("Unauthorized");
    }

    let incomes = await incomeKV.getAllItems();

    if (input.month) {
      const monthStr = input.month;
      incomes = incomes.filter((i) => i.date.startsWith(monthStr));
    }

    if (input.dateFrom) {
      incomes = incomes.filter((i) => i.date >= input.dateFrom!);
    }

    if (input.dateTo) {
      incomes = incomes.filter((i) => i.date <= input.dateTo!);
    }

    if (input.room) {
      incomes = incomes.filter((i) => i.room === input.room);
    }

    const sortedIncomes = incomes.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const headers = [
      "Date",
      "Room",
      "Name",
      "Bill",
      "Paid",
      "Outstanding",
      "Payment Methods",
      "User",
    ];
    const rows = sortedIncomes.map((i) => [
      i.date,
      i.room,
      i.name,
      i.bill.toString(),
      i.paid.toString(),
      i.outstanding.toString(),
      i.paymentMethods.map((pm) => `${pm.type}: £${pm.amount}`).join("; "),
      i.username,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    return csv;
  });

export const router = {
  create,
  update,
  deleteIncome,
  list,
  exportCSV,
};
