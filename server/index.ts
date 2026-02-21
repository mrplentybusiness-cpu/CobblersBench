import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

let isInitialized = false;
export function setInitialized() {
  isInitialized = true;
}
export function getInitialized() {
  return isInitialized;
}

if (process.env.NODE_ENV === "production") {
  const fs = require("fs");
  const path = require("path");
  const distPath = path.resolve(process.cwd(), "dist", "public");
  const indexPath = path.resolve(distPath, "index.html");
  
  if (fs.existsSync(indexPath)) {
    const indexHtml = fs.readFileSync(indexPath, "utf-8");
    app.get("/", (_req, res, next) => {
      if (!isInitialized) {
        res.setHeader("Content-Type", "text/html");
        res.send(indexHtml);
      } else {
        next();
      }
    });
  }
}

app.use(
  express.json({
    limit: '50mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: '50mb' }));

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
      if (capturedJsonResponse && process.env.NODE_ENV !== "production") {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

console.log(`[Email Config] GMAIL_APP_PASSWORD: ${process.env.GMAIL_APP_PASSWORD ? 'SET (length ' + process.env.GMAIL_APP_PASSWORD.length + ')' : 'NOT SET'}`);
console.log(`[Email Config] NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`[Email Config] REPLIT_DEPLOYMENT: ${process.env.REPLIT_DEPLOYMENT || 'not set'}`);
const _cid = process.env.GMAIL_CLIENT_ID?.trim();
const _csec = process.env.GMAIL_CLIENT_SECRET?.trim();
const _rtok = process.env.GMAIL_REFRESH_TOKEN?.trim();
console.log(`[Email Config] GMAIL_CLIENT_ID: ${_cid ? 'SET (length ' + _cid.length + ', starts: ' + _cid.substring(0, 10) + '...)' : 'NOT SET'}`);
console.log(`[Email Config] GMAIL_CLIENT_SECRET: ${_csec ? 'SET (length ' + _csec.length + ')' : 'NOT SET'}`);
console.log(`[Email Config] GMAIL_REFRESH_TOKEN: ${_rtok ? 'SET (length ' + _rtok.length + ')' : 'NOT SET'}`);

const port = parseInt(process.env.PORT || "3000", 10);

function startListening() {
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
}

if (process.env.NODE_ENV === "production") {
  startListening();
}

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  setInitialized();

  if (process.env.NODE_ENV !== "production") {
    startListening();
  }

  log("Server initialization complete");
})();
