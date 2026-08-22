import app from "./app";
import dotenv from "dotenv";
import { prisma } from "./lib/prisma";

// Load environment variables from .env file
dotenv.config();

const PORT = process.env.PORT || 3001;

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Graceful shutdown logic
process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  server.close(async () => {
    console.log("HTTP server closed");
    // Close Prisma database connection:
    await prisma.$disconnect();
    process.exit(0);
  });
});
