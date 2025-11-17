import 'dotenv/config';
import "module-alias/register.js";
import { serve } from "@hono/node-server";
import app from "./index.js";

const port = Number(process.env.PORT) || 3000;

console.log(`Server starting on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
