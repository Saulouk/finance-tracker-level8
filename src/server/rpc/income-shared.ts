import { z } from "zod";
import { createKV } from "@/server/lib/create-kv.js";

export const PaymentMethodSchema = z.object({
  type: z.string(),
  amount: z.number(),
  wechatCNY: z.string().optional(),
});

export const IncomeSchema = z.object({
  id: z.string(),
  userId: z.string(),
  username: z.string(),
  date: z.string(),
  room: z.string(),
  name: z.string(),
  bill: z.number(),
  paid: z.number(),
  outstanding: z.number(),
  paymentMethods: z.array(PaymentMethodSchema),
  createdAt: z.string(),
});

export type Income = z.output<typeof IncomeSchema>;

export const incomeKV = createKV<Income>("income");
