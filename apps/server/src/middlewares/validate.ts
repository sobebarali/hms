import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodObject } from "zod";
import { createMiddlewareLogger } from "../lib/logger";

const logger = createMiddlewareLogger("validation");

// biome-ignore lint/suspicious/noExplicitAny: Need to accept any ZodObject schema
export function validate(schema: ZodObject<any>) {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			await schema.parseAsync({
				body: req.body,
				query: req.query,
				params: req.params,
			});

			logger.debug(
				{
					method: req.method,
					path: req.path,
				},
				"Validation passed",
			);

			next();
		} catch (error) {
			if (error instanceof ZodError) {
				const validationErrors = error.issues.map((err) => ({
					path: err.path.join("."),
					message: err.message,
				}));

				logger.warn(
					{
						method: req.method,
						path: req.path,
						errors: validationErrors,
						body: req.body,
						query: req.query,
						params: req.params,
					},
					"Validation failed",
				);

				return res.status(400).json({
					code: "INVALID_REQUEST",
					message: "Validation failed",
					errors: validationErrors,
				});
			}
			next(error);
		}
	};
}
