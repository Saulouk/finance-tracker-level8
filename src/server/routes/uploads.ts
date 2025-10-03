import { Hono } from "hono";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { sessionsKV } from "../rpc/auth-shared";

const UPLOAD_DIR = "./.storage/uploads";

await mkdir(UPLOAD_DIR, { recursive: true });

export const uploadsApp = new Hono();

uploadsApp.post("/", async (c) => {
  const sessionId = c.req.header("x-session-id");
  if (!sessionId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const session = await sessionsKV.getItem(sessionId);
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.parseBody();
  const file = body.file;

  if (!file || !(file instanceof File)) {
    return c.json({ error: "No file uploaded" }, 400);
  }

  const ext = file.name.split(".").pop();
  const filename = `${randomUUID()}.${ext}`;
  const filepath = join(UPLOAD_DIR, filename);

  const buffer = await file.arrayBuffer();
  await writeFile(filepath, Buffer.from(buffer));

  return c.json({ path: filename });
});

uploadsApp.get("/:filename", async (c) => {
  const filename = c.req.param("filename");
  const filepath = join(UPLOAD_DIR, filename);

  try {
    const { readFile } = await import("fs/promises");
    const file = await readFile(filepath);
    const arrayBuffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer;
    return new Response(arrayBuffer);
  } catch {
    return c.json({ error: "File not found" }, 404);
  }
});
