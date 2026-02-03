/**
 * Operis API HTTP Handler
 * Wraps Express router for use with raw Node HTTP server
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import express, { type Express } from "express";
import cors from "cors";
import operisRouter from "./index.js";
import { allowHostsMiddleware } from "./middleware/index.js";

let app: Express | null = null;

// Read allowed origins from environment for CORS
const ALLOWED_ORIGINS = (process.env.ALLOWED_HOSTS || "localhost,127.0.0.1")
  .split(",")
  .map((h) => h.trim())
  .flatMap((h) => [`http://${h}`, `https://${h}`, `http://${h}:*`, `https://${h}:*`]);

/**
 * Get or create Express app
 */
function getApp(): Express {
  if (!app) {
    app = express();

    // CORS with allowed origins
    app.use(
      cors({
        origin: (origin, callback) => {
          // Allow requests with no origin (like mobile apps or curl)
          if (!origin) return callback(null, true);

          // Check if origin matches allowed hosts
          const isAllowed = ALLOWED_ORIGINS.some((allowed) => {
            if (allowed.includes("*")) {
              const pattern = allowed.replace("*", "\\d+");
              return new RegExp(pattern).test(origin);
            }
            return origin.startsWith(allowed);
          });

          if (isAllowed) {
            callback(null, true);
          } else {
            callback(new Error("Not allowed by CORS"));
          }
        },
        credentials: true,
      }),
    );

    app.use(express.json());

    // Allow hosts check
    app.use(allowHostsMiddleware);

    // Mount Operis API at /api
    app.use("/api", operisRouter);
  }
  return app;
}

/**
 * Handle Operis API requests
 * Returns true if request was handled, false otherwise
 */
export async function handleOperisApiRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const url = req.url ?? "/";

  // Only handle /api/* requests
  if (!url.startsWith("/api/") && url !== "/api") {
    return false;
  }

  return new Promise((resolve) => {
    const expressApp = getApp();

    // Use Express to handle the request
    // Cast to any because Express handler is compatible with Node http
    (expressApp as (req: IncomingMessage, res: ServerResponse, next?: () => void) => void)(
      req,
      res,
      () => {
        // If Express didn't handle it, return false
        resolve(false);
      },
    );

    // Mark as handled after response ends
    res.on("finish", () => {
      resolve(true);
    });
  });
}

export default handleOperisApiRequest;
