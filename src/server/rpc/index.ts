import { demo } from "./demo";
import { router as auth } from "./auth";
import { router as expenses } from "./expenses";
import { router as income } from "./income";
import { router as balances } from "./balances";

export const router = {
  demo,
  auth,
  expenses,
  income,
  balances,
};
