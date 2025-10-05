import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { env } from "./config/env.js";
import { cronJob } from "./config/cron.js";
import healthRoutes from "./routes/healthRoutes.js";
import favouritesRoutes from "./routes/favouritesRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import booksRoutes from "./routes/booksRoutes.js";
import discoverRoutes from "./routes/discoverRoutes.js";

const PORT = env.PORT;
const app = express();

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware({ secretKey: env.CLERK_SECRET_KEY }));


if(env.NODE_ENV === "production") {
  cronJob.start();
}

app.use("/api/v1", healthRoutes);

app.use("/api/v1", favouritesRoutes);

app.use("/api/v1", profileRoutes);

app.use("/api/v1", booksRoutes);

app.use("/api/v1", discoverRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});