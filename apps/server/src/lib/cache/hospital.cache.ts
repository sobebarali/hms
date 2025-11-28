import { redis } from "../redis";

// Cache TTL configurations (in seconds)
const CACHE_TTL = {
	HOSPITAL_DATA: 3600, // 1 hour for hospital data
	VERIFICATION_TOKEN: 86400, // 24 hours for verification tokens
} as const;

// Cache key generators
export const CacheKeys = {
	hospital: (id: string) => `hospital:${id}`,
	verificationToken: (hospitalId: string) =>
		`hospital:verification:${hospitalId}`,
} as const;

/**
 * Get hospital data from cache
 */
export async function getCachedHospital(id: string): Promise<unknown | null> {
	try {
		const key = CacheKeys.hospital(id);
		const cached = await redis.get(key);
		return cached;
	} catch (error) {
		console.error("Redis get error:", error);
		return null; // Fail silently, fall back to database
	}
}

/**
 * Set hospital data in cache
 */
export async function setCachedHospital(
	id: string,
	data: unknown,
): Promise<void> {
	try {
		const key = CacheKeys.hospital(id);
		await redis.setex(key, CACHE_TTL.HOSPITAL_DATA, JSON.stringify(data));
	} catch (error) {
		console.error("Redis set error:", error);
		// Fail silently, don't block the operation
	}
}

/**
 * Invalidate hospital cache
 */
export async function invalidateHospitalCache(id: string): Promise<void> {
	try {
		const key = CacheKeys.hospital(id);
		await redis.del(key);
	} catch (error) {
		console.error("Redis delete error:", error);
		// Fail silently
	}
}

/**
 * Store verification token in Redis with TTL
 */
export async function setVerificationToken(
	hospitalId: string,
	token: string,
	expiresInSeconds?: number,
): Promise<void> {
	try {
		const key = CacheKeys.verificationToken(hospitalId);
		const ttl = expiresInSeconds || CACHE_TTL.VERIFICATION_TOKEN;
		await redis.setex(key, ttl, token);
	} catch (error) {
		console.error("Redis set verification token error:", error);
		// Don't throw - verification token is also stored in database
	}
}

/**
 * Get verification token from Redis
 */
export async function getVerificationToken(
	hospitalId: string,
): Promise<string | null> {
	try {
		const key = CacheKeys.verificationToken(hospitalId);
		const token = await redis.get(key);
		return token as string | null;
	} catch (error) {
		console.error("Redis get verification token error:", error);
		return null; // Fall back to database
	}
}

/**
 * Delete verification token from Redis
 */
export async function deleteVerificationToken(
	hospitalId: string,
): Promise<void> {
	try {
		const key = CacheKeys.verificationToken(hospitalId);
		await redis.del(key);
	} catch (error) {
		console.error("Redis delete verification token error:", error);
		// Fail silently
	}
}
