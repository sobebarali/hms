/**
 * Menu service
 *
 * Filters menu items based on user permissions
 */

import {
	hasPermission,
	type Permission,
} from "../../../constants/rbac.constants";
import { createServiceLogger } from "../../../lib/logger";
import { FULL_MENU_STRUCTURE } from "../menu-config";
import type {
	GetMenuOutput,
	MenuChildItem,
	MenuItem,
} from "../validations/get.menu.validation";

const logger = createServiceLogger("menu");

/**
 * Get filtered menu for authenticated user based on their permissions
 */
export function getMenuForUser({
	permissions,
}: {
	permissions: string[];
}): GetMenuOutput {
	logger.debug(
		{ permissionsCount: permissions.length },
		"Filtering menu for user",
	);

	const filteredMenu: MenuItem[] = FULL_MENU_STRUCTURE
		// Filter top-level items by permission
		.filter((item) => hasPermission(permissions, item.permission as Permission))
		// Filter children and handle empty children
		.map((item) => {
			if (!item.children) {
				return item;
			}

			const filteredChildren: MenuChildItem[] = item.children.filter((child) =>
				hasPermission(permissions, child.permission as Permission),
			);

			return { ...item, children: filteredChildren };
		})
		// Remove parent items with no visible children
		.filter((item) => !item.children || item.children.length > 0)
		// Ensure visibility flag is set
		.map((item) => ({ ...item, visible: true }));

	logger.debug(
		{ menuItemsCount: filteredMenu.length },
		"Menu filtered successfully",
	);

	return {
		menu: filteredMenu,
		permissions,
	};
}
