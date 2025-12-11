import "./loadEnv.js";
import * as Sentry from "@sentry/node";
import "@sentry/tracing";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

import app from "./app.js";
import { connectDB } from "./config/db.js";

connectDB();

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on PORT: ${PORT}`);
});
