import { connectDB } from "@hms/db";
import dotenv from "dotenv";
import { afterAll, beforeAll } from "vitest";

// Load environment variables before anything else
dotenv.config({ path: "apps/server/.env" });

beforeAll(async () => {
	// Connect to database before running tests
	await connectDB();
});

afterAll(async () => {
	// Global teardown - runs once after all tests
});

// Test utilities can be added here
export const testUtils = {
	// Add any shared test utilities here
	// Example: createTestUser, cleanupDatabase, etc.
};
