import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";
import { createRoleController } from "./controllers/create.roles.controller";
import { deleteRoleController } from "./controllers/delete.roles.controller";
import { getRoleByIdController } from "./controllers/get-by-id.roles.controller";
import { listRolesController } from "./controllers/list.roles.controller";
import { updateRoleController } from "./controllers/update.roles.controller";
import { createRoleSchema } from "./validations/create.roles.validation";
import { deleteRoleSchema } from "./validations/delete.roles.validation";
import { getRoleByIdSchema } from "./validations/get-by-id.roles.validation";
import { listRolesSchema } from "./validations/list.roles.validation";
import { updateRoleSchema } from "./validations/update.roles.validation";

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/roles - List all roles
// Requires ROLE:READ permission
router.get(
	"/",
	authorize("ROLE:READ"),
	validate(listRolesSchema),
	listRolesController,
);

// GET /api/roles/:id - Get role by ID
// Requires ROLE:READ permission
router.get(
	"/:id",
	authorize("ROLE:READ"),
	validate(getRoleByIdSchema),
	getRoleByIdController,
);

// POST /api/roles - Create a new custom role
// Requires ROLE:CREATE permission
router.post(
	"/",
	authorize("ROLE:CREATE"),
	validate(createRoleSchema),
	createRoleController,
);

// PATCH /api/roles/:id - Update a role
// Requires ROLE:UPDATE permission
router.patch(
	"/:id",
	authorize("ROLE:UPDATE"),
	validate(updateRoleSchema),
	updateRoleController,
);

// DELETE /api/roles/:id - Delete (deactivate) a role
// Requires ROLE:DELETE permission
router.delete(
	"/:id",
	authorize("ROLE:DELETE"),
	validate(deleteRoleSchema),
	deleteRoleController,
);

export default router;
