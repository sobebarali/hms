import { createServiceLogger } from "../../../lib/logger";
import { getAllDepartmentsForTree } from "../repositories/tree.departments.repository";
import type {
	TreeDepartmentsOutput,
	TreeNode,
} from "../validations/tree.departments.validation";

const logger = createServiceLogger("treeDepartments");

/**
 * Build hierarchical department tree
 */
export async function treeDepartmentsService({
	tenantId,
}: {
	tenantId: string;
}): Promise<TreeDepartmentsOutput> {
	logger.info({ tenantId }, "Building department tree");

	// Get all departments
	const departments = await getAllDepartmentsForTree({ tenantId });

	// Build tree structure
	const departmentMap = new Map<string, TreeNode>();
	const rootNodes: TreeNode[] = [];

	// First pass: create all nodes
	for (const dept of departments) {
		departmentMap.set(dept._id, {
			id: dept._id,
			name: dept.name,
			code: dept.code,
			type: dept.type,
			children: [],
		});
	}

	// Second pass: build tree hierarchy
	for (const dept of departments) {
		const node = departmentMap.get(dept._id);
		if (!node) continue;

		if (dept.parentId && departmentMap.has(dept.parentId)) {
			// Add as child to parent
			const parent = departmentMap.get(dept.parentId);
			parent?.children.push(node);
		} else {
			// Root node (no parent or parent not found)
			rootNodes.push(node);
		}
	}

	logger.info(
		{
			tenantId,
			totalDepartments: departments.length,
			rootNodes: rootNodes.length,
		},
		"Department tree built successfully",
	);

	return {
		tree: rootNodes,
	};
}
