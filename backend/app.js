// server.js or app.js (your main backend entry file)

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

// -----------------------------------------------------------
// LOGGING
// -----------------------------------------------------------
app.use(morgan("dev"));

// -----------------------------------------------------------
// FIXED, STABLE CORS (ONLY THIS – DELETE YOUR OLD CORS BLOCK)
// -----------------------------------------------------------
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (no origin header)
      if (!origin) return callback(null, true);

      const allowed = [
        "http://localhost:5173",
        "http://localhost:5174",
      ];

      const isNgrok =
        typeof origin === "string" &&
        (origin.includes("ngrok") || origin.includes("ngrok-free"));

      if (allowed.includes(origin) || isNgrok) {
        return callback(null, true);
      }

      // Allow all for development safety
      return callback(null, true);
    },

    credentials: true,

    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "x-client-id",
      "x-client-secret",
      "x-api-version",
      "x-razorpay-signature",
    ],
  })
);

// ❗ REMOVE your old OPTIONS middleware — cors() handles it properly
// DO NOT PUT ANY CUSTOM OPTIONS HANDLER HERE

// -----------------------------------------------------------
// BODY PARSERS
// -----------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -----------------------------------------------------------
// ROUTES
// -----------------------------------------------------------
app.get("/", (req, res) => res.send("API is running..."));

cron.schedule("*/5 * * * *", failStaleTransactions);

app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);

// -----------------------------------------------------------
// ERROR HANDLERS
// -----------------------------------------------------------
app.use(notFound);
app.use(errorHandler);

export default app;
