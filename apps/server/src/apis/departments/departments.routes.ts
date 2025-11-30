import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";

// Controllers
import { assignStaffController } from "./controllers/assign-staff.departments.controller";
import { createDepartmentController } from "./controllers/create.departments.controller";
import { deleteDepartmentController } from "./controllers/delete.departments.controller";
import { getDepartmentByIdController } from "./controllers/get-by-id.departments.controller";
import { getStaffController } from "./controllers/get-staff.departments.controller";
import { listDepartmentsController } from "./controllers/list.departments.controller";
import { removeStaffController } from "./controllers/remove-staff.departments.controller";
import { treeDepartmentsController } from "./controllers/tree.departments.controller";
import { updateDepartmentController } from "./controllers/update.departments.controller";

// Validations
import { assignStaffSchema } from "./validations/assign-staff.departments.validation";
import { createDepartmentSchema } from "./validations/create.departments.validation";
import { deleteDepartmentSchema } from "./validations/delete.departments.validation";
import { getDepartmentByIdSchema } from "./validations/get-by-id.departments.validation";
import { getStaffSchema } from "./validations/get-staff.departments.validation";
import { listDepartmentsSchema } from "./validations/list.departments.validation";
import { removeStaffSchema } from "./validations/remove-staff.departments.validation";
import { updateDepartmentSchema } from "./validations/update.departments.validation";

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/departments/tree - Get department hierarchy tree
// (must be before /:id to avoid matching "tree" as an id)
router.get("/tree", authorize("DEPARTMENT:READ"), treeDepartmentsController);

// GET /api/departments - List all departments
router.get(
	"/",
	authorize("DEPARTMENT:READ"),
	validate(listDepartmentsSchema),
	listDepartmentsController,
);

// POST /api/departments - Create a new department
router.post(
	"/",
	authorize("DEPARTMENT:CREATE"),
	validate(createDepartmentSchema),
	createDepartmentController,
);

// GET /api/departments/:id - Get department by ID
router.get(
	"/:id",
	authorize("DEPARTMENT:READ"),
	validate(getDepartmentByIdSchema),
	getDepartmentByIdController,
);

// PATCH /api/departments/:id - Update a department
router.patch(
	"/:id",
	authorize("DEPARTMENT:UPDATE"),
	validate(updateDepartmentSchema),
	updateDepartmentController,
);

// DELETE /api/departments/:id - Delete (deactivate) a department
router.delete(
	"/:id",
	authorize("DEPARTMENT:DELETE"),
	validate(deleteDepartmentSchema),
	deleteDepartmentController,
);

// GET /api/departments/:id/staff - Get staff in a department
router.get(
	"/:id/staff",
	authorize("DEPARTMENT:READ"),
	validate(getStaffSchema),
	getStaffController,
);

// POST /api/departments/:id/staff - Assign staff to a department
router.post(
	"/:id/staff",
	authorize("DEPARTMENT:MANAGE"),
	validate(assignStaffSchema),
	assignStaffController,
);

// DELETE /api/departments/:id/staff/:userId - Remove staff from a department
router.delete(
	"/:id/staff/:userId",
	authorize("DEPARTMENT:MANAGE"),
	validate(removeStaffSchema),
	removeStaffController,
);

export default router;
