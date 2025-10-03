import { call, os } from "@orpc/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { createKV } from "@/server/lib/create-kv";
import { sessionsKV, Session } from "./auth-shared";

const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  password: z.string(),
  isAdmin: z.boolean(),
});

type User = z.output<typeof UserSchema>;

const usersKV = createKV<User>("users");

async function initDefaultAdmin() {
  const users = await usersKV.getAllItems();
  if (users.length === 0) {
    const hashedPassword = await bcrypt.hash("admin", 10);
    const adminUser: User = {
      id: randomUUID(),
      username: "admin",
      password: hashedPassword,
      isAdmin: true,
    };
    await usersKV.setItem(adminUser.id, adminUser);
  }
}

initDefaultAdmin();

const login = os
  .input(
    z.object({
      username: z.string(),
      password: z.string(),
    })
  )
  .handler(async ({ input }) => {
    const users = await usersKV.getAllItems();
    const user = users.find((u) => u.username === input.username);

    if (!user || !(await bcrypt.compare(input.password, user.password))) {
      throw new Error("Invalid credentials");
    }

    const session: Session = {
      id: randomUUID(),
      userId: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
      createdAt: new Date().toISOString(),
    };

    await sessionsKV.setItem(session.id, session);

    return {
      sessionId: session.id,
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
      },
    };
  });

const logout = os.input(z.string()).handler(async ({ input: sessionId }) => {
  await sessionsKV.removeItem(sessionId);
  return { success: true };
});

const getCurrentUser = os
  .input(z.string().optional())
  .handler(async ({ input: sessionId }) => {
    if (!sessionId) return null;

    const session = await sessionsKV.getItem(sessionId);
    if (!session) return null;

    return {
      id: session.userId,
      username: session.username,
      isAdmin: session.isAdmin,
    };
  });

const createUser = os
  .input(
    z.object({
      sessionId: z.string(),
      username: z.string(),
      password: z.string(),
      isAdmin: z.boolean(),
    })
  )
  .handler(async ({ input }) => {
    const session = await sessionsKV.getItem(input.sessionId);
    if (!session?.isAdmin) {
      throw new Error("Unauthorized");
    }

    const users = await usersKV.getAllItems();
    if (users.some((u) => u.username === input.username)) {
      throw new Error("Username already exists");
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);
    const user: User = {
      id: randomUUID(),
      username: input.username,
      password: hashedPassword,
      isAdmin: input.isAdmin,
    };

    await usersKV.setItem(user.id, user);
    return { success: true };
  });

const listUsers = os.input(z.string()).handler(async ({ input: sessionId }) => {
  const session = await sessionsKV.getItem(sessionId);
  if (!session?.isAdmin) {
    throw new Error("Unauthorized");
  }

  const users = await usersKV.getAllItems();
  return users.map((u) => ({
    id: u.id,
    username: u.username,
    isAdmin: u.isAdmin,
  }));
});

export const router = {
  login,
  logout,
  getCurrentUser,
  createUser,
  listUsers,
};
