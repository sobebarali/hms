import mongoose from "mongoose";
import { generateMasterKey } from "../../src/utils/encryption";

export interface EncryptionTestContext {
	originalKey: string | undefined;
	testKey: string;
	restoreKey: () => void;
}

/**
 * Setup a temporary encryption key for tests
 * Saves the original key and restores it when done
 *
 * @returns Context with original key, test key, and restore function
 *
 * @example
 * ```typescript
 * const encContext = setupEncryptionTestKey();
 *
 * afterAll(() => {
 *   encContext.restoreKey();
 * });
 * ```
 */
export function setupEncryptionTestKey(): EncryptionTestContext {
	const originalKey = process.env.ENCRYPTION_MASTER_KEY;
	const testKey = generateMasterKey();

	// Set test key
	process.env.ENCRYPTION_MASTER_KEY = testKey;

	return {
		originalKey,
		testKey,
		restoreKey: () => {
			if (originalKey) {
				process.env.ENCRYPTION_MASTER_KEY = originalKey;
			} else {
				delete process.env.ENCRYPTION_MASTER_KEY;
			}
		},
	};
}

/**
 * Get value from object using dot notation path
 */
function getFieldValue(obj: unknown, path: string): unknown {
	const parts = path.split(".");
	let current: Record<string, unknown> = obj as Record<string, unknown>;

	for (const part of parts) {
		if (current == null) return undefined;
		current = current[part] as Record<string, unknown>;
	}

	return current;
}

/**
 * Check if a field is encrypted (has "enc:" prefix)
 *
 * @param obj - The document object
 * @param fieldPath - Field path (supports dot notation)
 * @returns True if field value has "enc:" prefix
 *
 * @example
 * ```typescript
 * const isEncrypted = verifyFieldEncrypted(patient, 'firstName');
 * const isNestedEncrypted = verifyFieldEncrypted(patient, 'address.street');
 * ```
 */
export function verifyFieldEncrypted(obj: unknown, fieldPath: string): boolean {
	const value = getFieldValue(obj, fieldPath);

	if (value == null || value === "") {
		return false;
	}

	return typeof value === "string" && value.startsWith("enc:");
}

/**
 * Verify that a field has been decrypted and matches expected value
 *
 * @param obj - The document object
 * @param fieldPath - Field path (supports dot notation)
 * @param expectedValue - Expected decrypted value
 * @returns True if field value matches expected plaintext
 *
 * @example
 * ```typescript
 * const isDecrypted = verifyFieldDecrypted(patient, 'firstName', 'John');
 * ```
 */
export function verifyFieldDecrypted(
	obj: unknown,
	fieldPath: string,
	expectedValue: string,
): boolean {
	const value = getFieldValue(obj, fieldPath);
	return value === expectedValue;
}

/**
 * Get raw encrypted value from database (bypassing Mongoose decryption)
 *
 * @param collection - Collection name (e.g., 'patient', 'staff')
 * @param id - Document ID
 * @param fieldPath - Field path (supports dot notation)
 * @returns Raw encrypted value from database
 *
 * @example
 * ```typescript
 * const rawValue = await getEncryptedValueFromDb('patient', patientId, 'firstName');
 * expect(rawValue).toMatch(/^enc:/);
 * ```
 */
export async function getEncryptedValueFromDb(
	collection: string,
	id: string,
	fieldPath: string,
): Promise<string | null> {
	const db = mongoose.connection.db;
	const coll = db?.collection(collection);

	if (!coll) {
		throw new Error(`Collection ${collection} not found`);
	}

	// biome-ignore lint/suspicious/noExplicitAny: MongoDB native driver expects ObjectId but we use string IDs
	const doc = await coll.findOne({ _id: id } as any);

	if (!doc) {
		throw new Error(`Document with id ${id} not found in ${collection}`);
	}

	const value = getFieldValue(doc, fieldPath);
	return value as string | null;
}

/**
 * Get raw document from database (bypassing Mongoose)
 *
 * @param collection - Collection name
 * @param id - Document ID
 * @returns Raw document from database
 *
 * @example
 * ```typescript
 * const rawDoc = await getRawDocumentFromDb('patient', patientId);
 * expect(rawDoc.firstName).toMatch(/^enc:/);
 * ```
 */
export async function getRawDocumentFromDb(
	collection: string,
	id: string,
): Promise<Record<string, unknown> | null> {
	const db = mongoose.connection.db;
	const coll = db?.collection(collection);

	if (!coll) {
		throw new Error(`Collection ${collection} not found`);
	}

	// biome-ignore lint/suspicious/noExplicitAny: MongoDB native driver expects ObjectId but we use string IDs
	const doc = await coll.findOne({ _id: id } as any);
	return doc as Record<string, unknown> | null;
}
