import type { Response } from "express";
import { UnauthorizedError } from "../../../errors";
import {
	createControllerLogger,
	logInput,
	logSuccess,
} from "../../../lib/logger";
import {
	type AuthenticatedRequest,
	authenticatedHandler,
} from "../../../utils/async-handler";
import { createRoleService } from "../services/create.roles.service";
import type { CreateRoleInput } from "../validations/create.roles.validation";

const logger = createControllerLogger("createRole");

export const createRoleController = authenticatedHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const startTime = Date.now();

		logInput(logger, req.body, "Create role request received");

		const { user } = req;
		if (!user?.tenantId) {
			throw new UnauthorizedError("Authentication required");
		}

		const data = req.body as CreateRoleInput;

		const result = await createRoleService({
			tenantId: user.tenantId,
			data,
			userRoles: user.roles,
			userPermissions: user.permissions,
		});

		const duration = Date.now() - startTime;

		logSuccess(
			logger,
			{
				roleId: result.id,
				name: result.name,
				permissionsCount: result.permissions.length,
			},
			"Role created successfully",
			duration,
		);

		res.status(201).json(result);
	},
);
