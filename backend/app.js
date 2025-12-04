import express from 'express'
import cors from 'cors'
import { notFound, errorHandler } from './middleware/errorMiddleware.js'
import reportRoutes from "./routes/report.route.js";
import userRoutes from "./routes/user.routes.js";
import paymentRoutes from "./routes/payment.route.js";
import webhookRoutes from "./routes/webhook.route.js";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes.js";
import cron from "node-cron";
import { failStaleTransactions } from "./jobs/failStaleTransactions.js";
import projectRoutes from "./routes/project.routes.js";

const app = express()

app.use(morgan("dev"));

// -------------------- CORS FIX --------------------
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:5174",
    ];

    const isNgrokDomain =
      origin.includes("ngrok") || origin.includes("ngrok-free");

    if (allowedOrigins.includes(origin) || isNgrokDomain) {
      callback(null, true);
    } else {
      callback(null, true); // allow all for dev
    }
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
}));

// Raw body only for webhooks
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With, x-client-id, x-client-secret, x-api-version, x-razorpay-signature"
    );
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    );
    res.header(
      "Access-Control-Allow-Origin",
      req.headers.origin || "*"
    );
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => res.send("API is running..."));
cron.schedule("*/5 * * * *", failStaleTransactions);
app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/auth", authRoutes); 

app.use("/api/projects", projectRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
