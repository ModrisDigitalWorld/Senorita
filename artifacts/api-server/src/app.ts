import express, { type Application, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import multer from "multer";
import router from "./routes/index.js";

const app: Application = express();

const ALLOWED_ORIGINS = [
  "https://www.senoritastore.com",
  "https://senoritastore.com",
  "https://senorita-tawny.vercel.app",
  process.env.FRONTEND_URL,
  process.env.REPL_SLUG
    ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
    : undefined,
  ...(process.env.REPLIT_DOMAINS
    ? process.env.REPLIT_DOMAINS.split(",").map((d) => `https://${d.trim()}`)
    : []),
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (
        ALLOWED_ORIGINS.some((allowed) => origin === allowed) ||
        origin.endsWith(".replit.dev") ||
        origin.endsWith(".repl.co") ||
        origin.endsWith(".senoritastore.com") ||
        origin.endsWith(".vercel.app")
      ) {
        callback(null, true);
      } else if (process.env.NODE_ENV !== "production") {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ error: "File is too large. Maximum size is 20MB." });
      return;
    }
    res.status(400).json({ error: err.message });
    return;
  }
  console.error("[app error]", err?.message || err);
  res.status(500).json({ error: err?.message || "Internal server error" });
});

export default app;
