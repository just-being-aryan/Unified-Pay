import * as Sentry from "@sentry/node";
import express from "express";
import cors from "cors";
import morgan from "morgan";

import {
  notFound,
  errorHandler
} from "./middleware/errorMiddleware.js";

import reportRoutes from "./routes/report.route.js";
import userRoutes from "./routes/user.routes.js";
import paymentRoutes from "./routes/payment.route.js";
import webhookRoutes from "./routes/webhook.route.js";
import authRoutes from "./routes/auth.routes.js";
import projectRoutes from "./routes/project.routes.js";

import cron from "node-cron";
import { failStaleTransactions } from "./jobs/failStaleTransactions.js";

const app = express();

/* ------------------------------------------------
   FIX: CORS MUST BE FIRST, BEFORE ANY MIDDLEWARE
-------------------------------------------------- */
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  })
);
// app.options("*", cors());

/* ------------------------
   Sentry v7 — middleware
------------------------- */
const sentryRequestHandler = Sentry.Handlers.requestHandler();
const sentryTracingHandler = Sentry.Handlers.tracingHandler();

app.use(sentryRequestHandler);
app.use(sentryTracingHandler);

/* ------------------------
   LOGGING
------------------------- */
app.use(morgan("dev"));

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

/* ------------------------
   Sentry + Error Handlers
------------------------- */
app.use(Sentry.Handlers.errorHandler());
app.use(notFound);
app.use(errorHandler);

export default app;
