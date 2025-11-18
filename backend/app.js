import express from 'express'
import cors from 'cors'
import { notFound, errorHandler } from './middleware/errorMiddleware.js'
import reportRoutes from "./routes/report.route.js";
import userRoutes from "./routes/user.routes.js";
import paymentRoutes from "./routes/payment.route.js";
import morgan from "morgan";
import webhookRoutes from "./routes/webhook.route.js";

const app = express()

app.use(morgan("dev"));

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:5174",
    ];
    
    const isNgrokDomain = origin && (
      origin.includes('.ngrok-free.dev') || 
      origin.includes('.ngrok-free.app') ||
      origin.includes('.ngrok.io')
    );
    
    if (allowedOrigins.includes(origin) || isNgrokDomain) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
}));

app.use((req, res, next) => {
  if (req.originalUrl.startsWith("/api/webhooks")) {
    // Store raw body
    let data = "";
    req.on("data", chunk => (data += chunk));
    req.on("end", () => {
      req.rawBody = data;
      next();
    });
  } else {
    next();
  }
});

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use((req, res, next) => {
  if (req.originalUrl.startsWith("/api/webhooks")) {
    // Store raw body
    let data = "";
    req.on("data", chunk => (data += chunk));
    req.on("end", () => {
      req.rawBody = data;
      next();
    });
  } else {
    next();
  }
});


app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/webhooks", webhookRoutes);

app.use(notFound)
app.use(errorHandler)

export default app;