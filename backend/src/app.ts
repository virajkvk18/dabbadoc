import "./types.js";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { config, isProduction } from "./config.js";
import { attachRequestId } from "./middleware/request-id.js";
import { errorHandler, notFoundHandler } from "./middleware/errors.js";
import { globalRateLimit } from "./middleware/rate-limit.js";
import { healthRouter } from "./routes/health.js";
import { aiRouter } from "./routes/ai.js";
import { barcodeRouter } from "./routes/barcode.js";
import { reportsRouter } from "./routes/reports.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "same-site" },
      contentSecurityPolicy: isProduction() ? undefined : false
    })
  );
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || config.allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error("CORS origin is not allowed."));
      },
      credentials: true
    })
  );
  app.use(express.json({ limit: "12mb" }));
  app.use(express.urlencoded({ extended: false, limit: "1mb" }));
  app.use(attachRequestId);
  app.use(globalRateLimit);

  app.get("/", (_request, response) => {
    response.json({
      service: "dabbadoc-express-backend",
      status: "ok",
      health: "/api/v1/health"
    });
  });

  app.use("/api/v1/health", healthRouter);
  app.use("/api/v1/ai", aiRouter);
  app.use("/api/v1/barcode", barcodeRouter);
  app.use("/api/v1/reports", reportsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
