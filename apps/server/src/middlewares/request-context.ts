import type { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import type { RequestContext } from "../lib/async-context";
import { runWithContext } from "../lib/async-context";

// Extend Express Request type to include context
declare global {
	namespace Express {
		interface Request {
			context: RequestContext;
		}
	}
}

/**
 * Middleware to generate and attach request context with traceId
 * This should be the first middleware in the chain
 */
export function requestContext(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	// Generate unique traceId for this request
	const traceId = uuidv4();

	// Create request context
	const context: RequestContext = {
		traceId,
		startTime: Date.now(),
	};

	// Attach context to request object for easy access
	req.context = context;

	// Add traceId to response headers for client-side tracking
	res.setHeader("X-Trace-Id", traceId);

	// Run the rest of the request in this context
	runWithContext(context, () => {
		next();
	});
}
