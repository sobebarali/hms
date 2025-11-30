import type {
	SecurityEventSeverityValue,
	SecurityEventTypeValue,
} from "@hms/db";
import { SecurityEvent } from "@hms/db";
import {
	type AuthTestContext,
	createAuthTestContext,
} from "./auth-test-context";

export interface SecurityTestContext extends AuthTestContext {
	permissions: string[];
	roles: string[];
}

/**
 * Create a test context with specific permissions and roles
 *
 * @param permissions - Array of permissions (e.g., ['PATIENT:READ', 'PATIENT:CREATE'])
 * @param roles - Optional array of role names (default: ['TEST_ROLE'])
 * @param options - Additional options for auth context
 * @returns Security test context with auth context plus permissions/roles
 *
 * @example
 * ```typescript
 * const context = await createSecurityTestContext(
 *   ['SECURITY:READ', 'SECURITY:MANAGE'],
 *   ['SECURITY_ADMIN']
 * );
 * ```
 */
export async function createSecurityTestContext(
	permissions: string[],
	roles: string[] = ["TEST_ROLE"],
	options: {
		includeDepartment?: boolean;
		createStaff?: boolean;
		password?: string;
	} = {},
): Promise<SecurityTestContext> {
	const authContext = await createAuthTestContext({
		roleName: roles[0] || "TEST_ROLE",
		rolePermissions: permissions,
		extraRoles:
			roles.length > 1
				? roles.slice(1).map((roleName) => ({
						name: roleName,
						permissions: [],
						isSystem: false,
					}))
				: [],
		includeDepartment: options.includeDepartment ?? false,
		createStaff: options.createStaff ?? true,
		password: options.password ?? "TestPassword123!",
	});

	return {
		...authContext,
		permissions,
		roles,
	};
}

/**
 * Wait for a security event to be logged (with polling)
 *
 * Security events are logged asynchronously, so this function polls
 * the database until the event is found or timeout occurs
 *
 * @param type - Event type to wait for
 * @param userId - User ID associated with the event
 * @param timeout - Maximum wait time in milliseconds (default: 5000)
 * @returns The security event document
 * @throws Error if event not found within timeout
 *
 * @example
 * ```typescript
 * // Perform action that should log a security event
 * await request(app).get('/api/patients/invalid').set('Authorization', token);
 *
 * // Wait for the event to be logged
 * const event = await waitForSecurityEvent('PERMISSION_DENIED', userId);
 * expect(event.severity).toBe('medium');
 * ```
 */
export async function waitForSecurityEvent(
	type: SecurityEventTypeValue,
	userId: string,
	timeout = 5000,
): Promise<
	Awaited<ReturnType<typeof SecurityEvent.findOne>> & { _id: string }
> {
	const startTime = Date.now();
	const pollInterval = 100; // Poll every 100ms

	while (Date.now() - startTime < timeout) {
		const event = await SecurityEvent.findOne({
			type,
			userId,
		}).sort({ timestamp: -1 });

		if (event) {
			return event as Awaited<ReturnType<typeof SecurityEvent.findOne>> & {
				_id: string;
			};
		}

		// Wait before next poll
		await new Promise((resolve) => setTimeout(resolve, pollInterval));
	}

	throw new Error(
		`Security event ${type} for user ${userId} not found within ${timeout}ms`,
	);
}

/**
 * Wait for a security event with specific criteria
 *
 * @param filters - Partial security event filters
 * @param timeout - Maximum wait time in milliseconds (default: 5000)
 * @returns The security event document
 *
 * @example
 * ```typescript
 * const event = await waitForSecurityEventWithFilters({
 *   type: 'MFA_ENABLED',
 *   tenantId: hospitalId,
 *   severity: 'low'
 * });
 * ```
 */
export async function waitForSecurityEventWithFilters(
	filters: {
		type?: SecurityEventTypeValue;
		tenantId?: string;
		userId?: string;
		severity?: SecurityEventSeverityValue;
	},
	timeout = 5000,
): Promise<
	Awaited<ReturnType<typeof SecurityEvent.findOne>> & { _id: string }
> {
	const startTime = Date.now();
	const pollInterval = 100;

	while (Date.now() - startTime < timeout) {
		const event = await SecurityEvent.findOne(filters).sort({ timestamp: -1 });

		if (event) {
			return event as Awaited<ReturnType<typeof SecurityEvent.findOne>> & {
				_id: string;
			};
		}

		await new Promise((resolve) => setTimeout(resolve, pollInterval));
	}

	throw new Error(
		`Security event matching filters not found within ${timeout}ms`,
	);
}

/**
 * Get count of security events matching filters
 *
 * @param filters - Partial security event filters
 * @returns Number of matching events
 *
 * @example
 * ```typescript
 * const count = await getSecurityEventCount({
 *   type: 'AUTH_FAILED',
 *   tenantId: hospitalId
 * });
 * expect(count).toBeGreaterThan(0);
 * ```
 */
export async function getSecurityEventCount(filters: {
	type?: SecurityEventTypeValue;
	tenantId?: string;
	userId?: string;
	severity?: SecurityEventSeverityValue;
}): Promise<number> {
	return await SecurityEvent.countDocuments(filters);
}

/**
 * Clean up security events for a tenant
 *
 * Should be called in afterAll hook to prevent test pollution
 *
 * @param tenantId - Tenant ID to clean up events for
 *
 * @example
 * ```typescript
 * afterAll(async () => {
 *   await cleanupSecurityEvents(context.hospitalId);
 *   await context.cleanup();
 * });
 * ```
 */
export async function cleanupSecurityEvents(tenantId: string): Promise<void> {
	await SecurityEvent.deleteMany({ tenantId });
}

/**
 * Clean up security events for a specific user
 *
 * @param userId - User ID to clean up events for
 *
 * @example
 * ```typescript
 * await cleanupSecurityEventsForUser(context.userId);
 * ```
 */
export async function cleanupSecurityEventsForUser(
	userId: string,
): Promise<void> {
	await SecurityEvent.deleteMany({ userId });
}

/**
 * Get recent security events for a user
 *
 * @param userId - User ID
 * @param limit - Maximum number of events to return (default: 10)
 * @returns Array of security events
 *
 * @example
 * ```typescript
 * const events = await getRecentSecurityEvents(userId, 5);
 * expect(events).toHaveLength(5);
 * ```
 */
export async function getRecentSecurityEvents(
	userId: string,
	limit = 10,
): Promise<Awaited<ReturnType<typeof SecurityEvent.find>>> {
	return await SecurityEvent.find({ userId })
		.sort({ timestamp: -1 })
		.limit(limit);
}
