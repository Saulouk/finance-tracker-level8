import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";

import { rpcApp } from "./routes/rpc.js";
import { clientEntry } from "./routes/client-entry.js";
import { uploadsApp } from "./routes/uploads.js";

const app = new Hono();

if (process.env.NODE_ENV === "production") {
  app.use("/static/*", serveStatic({ root: "./dist/client" }));
}

app.route("/uploads", uploadsApp);
app.route("/rpc", rpcApp);
app.get("/*", clientEntry);

export default app;app;
