import type { NextFunction, Request, Response } from "express";
import { createMiddlewareLogger, sanitizeObject } from "../lib/logger";

const logger = createMiddlewareLogger("request-logger");

/**
 * Middleware to log HTTP requests and responses
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
	const startTime = Date.now();

	// Log incoming request
	logger.info(
		{
			method: req.method,
			path: req.path,
			query: sanitizeObject(req.query),
			body: sanitizeObject(req.body),
			ip: req.ip || req.socket.remoteAddress,
			userAgent: req.get("user-agent"),
		},
		"Incoming request",
	);

	// Capture the original res.json to log response
	const originalJson = res.json.bind(res);
	res.json = (body: unknown) => {
		const duration = Date.now() - startTime;

		// Log response
		logger.info(
			{
				method: req.method,
				path: req.path,
				statusCode: res.statusCode,
				duration,
				responseBody: sanitizeObject(body),
			},
			"Request completed",
		);

		return originalJson(body);
	};

	// Capture the original res.send to log response
	const originalSend = res.send.bind(res);
	res.send = (body: unknown) => {
		const duration = Date.now() - startTime;

		// Only log if json hasn't already logged it
		if (
			!res.getHeader("Content-Type")?.toString().includes("application/json")
		) {
			logger.info(
				{
					method: req.method,
					path: req.path,
					statusCode: res.statusCode,
					duration,
				},
				"Request completed",
			);
		}

		return originalSend(body);
	};

	next();
}
