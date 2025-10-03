import { Hono } from "hono";

import { rpcApp } from "./routes/rpc";
import { clientEntry } from "./routes/client-entry";
import { uploadsApp } from "./routes/uploads";

const app = new Hono();

app.route("/uploads", uploadsApp);
app.route("/rpc", rpcApp);
app.get("/*", clientEntry);

export default app;
