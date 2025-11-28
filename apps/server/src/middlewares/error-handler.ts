import type { NextFunction, Request, Response } from "express";
import { createMiddlewareLogger, logError } from "../lib/logger";

const logger = createMiddlewareLogger("error-handler");

/**
 * Global error handler middleware
 * This should be the last middleware in the chain
 */
export function errorHandler(
	error: unknown,
	req: Request,
	res: Response,
	_next: NextFunction,
) {
	// Log the error with full context
	logError(logger, error, "Unhandled error in request", {
		method: req.method,
		path: req.path,
		query: req.query,
		body: req.body,
		ip: req.ip || req.socket.remoteAddress,
	});

	// Send error response
	if (!res.headersSent) {
		res.status(500).json({
			code: "INTERNAL_ERROR",
			message: "An unexpected error occurred",
			traceId: req.context?.traceId,
		});
	}
}
