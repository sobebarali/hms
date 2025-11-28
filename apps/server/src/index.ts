import "dotenv/config";
import { createAuth } from "@hms/auth";
import { connectDB } from "@hms/db";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";
import hospitalRoutes from "./apis/hospital/hospital.routes";
import { logger } from "./lib/logger";
import { errorHandler } from "./middlewares/error-handler";
import { requestContext } from "./middlewares/request-context";
import { requestLogger } from "./middlewares/request-logger";

// Connect to database
logger.info("Connecting to database...");
await connectDB();
logger.info("Database connected successfully");

// Initialize auth after database connection
const auth = createAuth();
logger.info("Auth initialized");

export const app = express();

// Request context middleware (MUST BE FIRST)
app.use(requestContext);

// Request logger middleware (after context)
app.use(requestLogger);

app.use(
	cors({
		origin: process.env.CORS_ORIGIN || "",
		methods: ["GET", "POST", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	}),
);

app.all("/api/auth{/*path}", toNodeHandler(auth));

app.use(express.json());

// API Routes
app.use("/api/hospitals", hospitalRoutes);

app.get("/", (_req, res) => {
	res.status(200).send("OK");
});

// Global error handler (MUST BE LAST)
app.use(errorHandler);

// Only start server if not in test environment
if (process.env.NODE_ENV !== "test") {
	const port = process.env.PORT || 3000;
	app.listen(port, () => {
		logger.info({ port }, `Server is running on port ${port}`);
	});
}
