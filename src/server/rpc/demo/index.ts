import { router as storageRouter } from "./storage.js";
import { router as aiRouter } from "./ai.js";

export const demo = {
  storage: storageRouter,
  ai: aiRouter,
};
