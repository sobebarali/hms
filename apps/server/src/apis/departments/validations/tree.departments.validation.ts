import { z } from "zod";

// Zod schema for runtime validation (no params needed)
export const treeDepartmentsSchema = z.object({});

// Tree node output type
export interface TreeNode {
	id: string;
	name: string;
	code: string;
	type: string;
	children: TreeNode[];
}

// Output type for tree response
export interface TreeDepartmentsOutput {
	tree: TreeNode[];
}
