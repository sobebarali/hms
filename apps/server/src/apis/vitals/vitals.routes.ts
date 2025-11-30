import { Router } from "express";
import { vitalsOwnershipPolicy } from "../../middlewares/abac-policies";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";

// Controllers
import { getVitalsByIdController } from "./controllers/get-by-id.vitals.controller";
import { latestVitalsController } from "./controllers/latest.vitals.controller";
import { listVitalsController } from "./controllers/list.vitals.controller";
import { recordVitalsController } from "./controllers/record.vitals.controller";
import { trendsVitalsController } from "./controllers/trends.vitals.controller";
import { updateVitalsController } from "./controllers/update.vitals.controller";

// Validations
import { getVitalsByIdSchema } from "./validations/get-by-id.vitals.validation";
import { latestVitalsSchema } from "./validations/latest.vitals.validation";
import { listVitalsSchema } from "./validations/list.vitals.validation";
import { recordVitalsSchema } from "./validations/record.vitals.validation";
import { trendsVitalsSchema } from "./validations/trends.vitals.validation";
import { updateVitalsSchema } from "./validations/update.vitals.validation";

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/vitals/patient/:patientId/latest - Get latest vitals for a patient
// (must be before other patient routes to avoid matching :id)
router.get(
	"/patient/:patientId/latest",
	authorize("VITALS:READ"),
	validate(latestVitalsSchema),
	latestVitalsController,
);

// GET /api/vitals/patient/:patientId/trends - Get vitals trends for a patient
router.get(
	"/patient/:patientId/trends",
	authorize("VITALS:READ"),
	validate(trendsVitalsSchema),
	trendsVitalsController,
);

// GET /api/vitals/patient/:patientId - List vitals for a patient
router.get(
	"/patient/:patientId",
	authorize("VITALS:READ"),
	validate(listVitalsSchema),
	listVitalsController,
);

// POST /api/vitals - Record new vitals
router.post(
	"/",
	authorize("VITALS:CREATE"),
	validate(recordVitalsSchema),
	recordVitalsController,
);

// GET /api/vitals/:id - Get vitals by ID
router.get(
	"/:id",
	authorize("VITALS:READ"),
	vitalsOwnershipPolicy, // ABAC: Doctors can only access vitals for their assigned patients
	validate(getVitalsByIdSchema),
	getVitalsByIdController,
);

// PATCH /api/vitals/:id - Update vitals (notes only)
router.patch(
	"/:id",
	authorize("VITALS:UPDATE"),
	vitalsOwnershipPolicy, // ABAC: Doctors can only update vitals for their assigned patients
	validate(updateVitalsSchema),
	updateVitalsController,
);

export default router;
