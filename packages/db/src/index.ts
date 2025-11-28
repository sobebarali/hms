import mongoose from "mongoose";

let isConnected = false;
let clientInstance: ReturnType<typeof mongoose.connection.getClient> | null =
	null;

export async function connectDB() {
	if (isConnected) {
		return;
	}

	const DATABASE_URL = process.env.DATABASE_URL;

	if (!DATABASE_URL) {
		throw new Error("DATABASE_URL environment variable is not defined");
	}

	try {
		await mongoose.connect(DATABASE_URL);
		clientInstance = mongoose.connection.getClient();
		isConnected = true;
	} catch (error) {
		console.error("❌ Error connecting to database:", error);
		throw error;
	}
}

export function getClient() {
	if (!clientInstance) {
		throw new Error("Database not connected. Call connectDB() first.");
	}
	return clientInstance.db("hms");
}

export { mongoose };

// Export all models
export * from "./models";
