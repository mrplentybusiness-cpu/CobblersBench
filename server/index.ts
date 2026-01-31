import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { storage } from "./storage";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Health check endpoints - respond immediately for deployment health checks
// These must be registered BEFORE any async setup to ensure fast response
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Track initialization state for graceful startup
let isInitialized = false;
export function setInitialized() {
  isInitialized = true;
}
export function getInitialized() {
  return isInitialized;
}

// In production, serve a minimal response at / before full initialization completes
// This allows health checks on / to pass while the app is still starting
if (process.env.NODE_ENV === "production") {
  const fs = require("fs");
  const path = require("path");
  const distPath = path.resolve(process.cwd(), "dist", "public");
  const indexPath = path.resolve(distPath, "index.html");
  
  // Pre-read index.html so it's available immediately
  if (fs.existsSync(indexPath)) {
    const indexHtml = fs.readFileSync(indexPath, "utf-8");
    app.get("/", (_req, res, next) => {
      if (!isInitialized) {
        // Serve cached index.html before full initialization
        res.setHeader("Content-Type", "text/html");
        res.send(indexHtml);
      } else {
        // Once initialized, let the static middleware handle it
        next();
      }
    });
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

// Start server FIRST so health checks pass immediately
const port = parseInt(process.env.PORT || "3000", 10);
httpServer.listen(
  {
    port,
    host: "0.0.0.0",
    reusePort: true,
  },
  () => {
    log(`serving on port ${port}`);
  },
);

// Then do async setup (database, routes, and in development: Vite)
(async () => {
  await registerRoutes(httpServer, app);
  
  // Wait for migrations to complete, then clear any stored admin passwords
  try {
    await storage.waitForMigrations();
    await storage.clearAdminPasswordSettings();
  } catch (error) {
    console.log("[Auth] Could not clear stored passwords:", error);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  setInitialized();
  log("Server initialization complete");
})();
