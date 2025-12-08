// server.js or app.js - MINIMAL CORS

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
// NGROK-COMPATIBLE CORS - PROPER CREDENTIALS HANDLING
// -----------------------------------------------------------
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // IMPORTANT: Must echo back the actual origin, NOT "*" when using credentials
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH,OPTIONS,HEAD");
  res.header("Access-Control-Allow-Headers", 
    "Origin,X-Requested-With,Content-Type,Accept,Authorization,authorization," +
    "x-client-id,x-client-secret,x-api-version,x-razorpay-signature," +
    "ngrok-skip-browser-warning,user-agent,cache-control,pragma");
  res.header("Access-Control-Max-Age", "86400"); // 24 hours
  
  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  
  next();
});

// Also use cors middleware as backup
app.use(cors({
  origin: function (origin, callback) {
    // Always allow - return the requesting origin, not "*"
    callback(null, origin || true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With", 
    "Content-Type",
    "Accept",
    "Authorization",
    "authorization",
    "x-client-id",
    "x-client-secret",
    "x-api-version",
    "x-razorpay-signature",
    "ngrok-skip-browser-warning",
    "user-agent",
    "cache-control",
    "pragma"
  ],
  exposedHeaders: ["*"],
  maxAge: 86400
}));

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