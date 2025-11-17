import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";

import { rpcApp } from "./routes/rpc.js";
import { clientEntry } from "./routes/client-entry.js";
import { uploadsApp } from "./routes/uploads.js";

import { resolve } from "path";

const app = new Hono();

// Serve static files
// This will correctly serve /static/main.js and /static/main.css
app.get("/static/*", serveStatic({
  root: resolve("./dist/client"),
}));

// RPC and uploads
app.route("/uploads", uploadsApp);
app.route("/rpc", rpcApp);

// Catch-all route for HTML
app.get("/*", clientEntry);

export default app;
