import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestContext {
	traceId: string;
	tenantId?: string;
	userId?: string;
	startTime: number;
}

// Create AsyncLocalStorage instance for request context
const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Get the current request context
 * @returns The current request context or undefined if not in a request context
 */
export function getContext(): RequestContext | undefined {
	return asyncLocalStorage.getStore();
}

/**
 * Get the traceId from the current request context
 * @returns The traceId or 'no-trace' if not in a request context
 */
export function getTraceId(): string {
	const context = getContext();
	return context?.traceId || "no-trace";
}

/**
 * Get the tenantId from the current request context
 * @returns The tenantId or undefined if not available
 */
export function getTenantId(): string | undefined {
	const context = getContext();
	return context?.tenantId;
}

/**
 * Get the userId from the current request context
 * @returns The userId or undefined if not available
 */
export function getUserId(): string | undefined {
	const context = getContext();
	return context?.userId;
}

/**
 * Run a function with a request context
 * @param context - The request context to use
 * @param callback - The function to run
 * @returns The result of the callback
 */
export function runWithContext<T>(
	context: RequestContext,
	callback: () => T,
): T {
	return asyncLocalStorage.run(context, callback);
}

/**
 * Enter a context that persists across async boundaries
 * Use this in middleware to maintain context throughout the request lifecycle
 * @param context - The request context to enter
 */
export function enterContext(context: RequestContext): void {
	asyncLocalStorage.enterWith(context);
}

/**
 * Update the current request context with new values
 * @param updates - Partial context updates
 */
export function updateContext(updates: Partial<RequestContext>): void {
	const currentContext = getContext();
	if (currentContext) {
		Object.assign(currentContext, updates);
	}
}
