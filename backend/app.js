import * as Sentry from "@sentry/node";
import express from "express";
import cors from "cors";
import morgan from "morgan";

import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

import reportRoutes from "./routes/report.route.js";
import userRoutes from "./routes/user.routes.js";
import paymentRoutes from "./routes/payment.route.js";
import webhookRoutes from "./routes/webhook.route.js";
import authRoutes from "./routes/auth.routes.js";
import projectRoutes from "./routes/project.routes.js";

import cron from "node-cron";
import { failStaleTransactions } from "./jobs/failStaleTransactions.js";

const app = express();

/* ------------------------
   Sentry v7 — middleware
------------------------- */
// create handlers (callable middlewares)
const sentryRequestHandler = Sentry.Handlers.requestHandler();
const sentryTracingHandler = Sentry.Handlers.tracingHandler();

// Skip Sentry for OPTIONS preflight to avoid interfering with CORS/auth flows
app.use((req, res, next) => {
  if (req.method === "OPTIONS") return next();
  return sentryRequestHandler(req, res, next);
});
app.use(sentryTracingHandler);

/* ------------------------
   LOGGING
------------------------- */
app.use(morgan("dev"));

/* ------------------------
   NGROK-COMPATIBLE CORS
------------------------- */
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) res.header("Access-Control-Allow-Origin", origin);

  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,PATCH,OPTIONS,HEAD"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin,X-Requested-With,Content-Type,Accept,Authorization,authorization," +
      "x-client-id,x-client-secret,x-api-version,x-razorpay-signature," +
      "ngrok-skip-browser-warning,user-agent,cache-control,pragma"
  );

  if (req.method === "OPTIONS") return res.status(200).end();

  next();
});

app.use(
  cors({
    origin: (origin, callback) => callback(null, origin || true),
    credentials: true,
  })
);

/* ------------------------
   BODY PARSERS
------------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ------------------------
   ROUTES
------------------------- */
app.get("/", (req, res) => res.send("API is running..."));

cron.schedule("*/5 * * * *", failStaleTransactions);

app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);

app.get("/debug-sentry", (req, res) => {
  throw new Error("Sentry test error!");
});


/* ------------------------
   Sentry error handler (must be before custom handlers)
------------------------- */
app.use(Sentry.Handlers.errorHandler());


app.use(notFound);
app.use(errorHandler);

export default app;
