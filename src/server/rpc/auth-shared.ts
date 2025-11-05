import { z } from "zod";
import { createKV } from "@/server/lib/create-kv.js";

export const SessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  username: z.string(),
  isAdmin: z.boolean(),
  createdAt: z.string(),
});

export type Session = z.output<typeof SessionSchema>;

export const sessionsKV = createKV<Session>("sessions");
