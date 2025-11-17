import { router as auth } from "./auth.js";
import { router as expenses } from "./expenses.js";
import { router as income } from "./income.js";
import { router as balances } from "./balances.js";

export const router = {
  auth,
  expenses,
  income,
  balances,
};
