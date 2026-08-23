import "dotenv/config";
import express, { Application, Request, Response } from "express";
import cors from "cors";
import itemRoutes from "./routes/saved-item.routes";
import tagRoutes from "./routes/tag.routes";

const app: Application = express();

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  }),
);
app.use(express.json());

// Routes
app.use("/api/items", itemRoutes);
app.use("/api/tags", tagRoutes);

// Health check endpoint (Great for platforms like Render or Railway to know your app is alive)
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok", message: "Server is healthy" });
});

export default app;
