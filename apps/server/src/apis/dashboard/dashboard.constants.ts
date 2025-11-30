/**
 * Dashboard constants
 *
 * Centralized configuration values for dashboard calculations
 */

/**
 * Default bed capacity configuration
 * TODO: This should come from hospital configuration in the database
 */
export const DEFAULT_BED_CAPACITY = 100;

/**
 * Estimated wait times for queue calculations (in minutes)
 */
export const ESTIMATED_WAIT_TIMES = {
	/** Estimated minutes per patient in doctor queue */
	PER_PATIENT: 15,
	/** Estimated minutes per prescription in pharmacy queue */
	PER_PRESCRIPTION: 10,
} as const;

/**
 * Default statistical values
 */
export const DASHBOARD_DEFAULTS = {
	/** Default average processing time for prescriptions (in minutes) */
	PRESCRIPTION_PROCESSING_TIME: 10,
} as const;
