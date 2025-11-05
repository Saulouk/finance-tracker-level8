import { z } from "zod";
import { createKV } from "@/server/lib/create-kv";

export const ExpenseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  username: z.string(),
  date: z.string(),
  amount: z.number(),
  vat: z.number(),
  category: z.string(),
  purchaser: z.string(),
  company: z.string(),
  receiptPath: z.string().optional(),
  isReimbursed: z.boolean(),
  createdAt: z.string(),
});

export type Expense = z.output<typeof ExpenseSchema>;

export const expensesKV = createKV<Expense>("expenses");
