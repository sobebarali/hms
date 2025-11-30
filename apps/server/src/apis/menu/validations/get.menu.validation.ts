/**
 * Menu API validation and types
 *
 * No Zod schema needed for GET endpoint without body/params
 * Only Output types defined for response structure
 */

// Child menu item (nested under parent)
export interface MenuChildItem {
	id: string;
	label: string;
	path: string;
	permission: string;
	order: number;
}

// Top-level menu item
export interface MenuItem {
	id: string;
	label: string;
	icon: string;
	path?: string;
	permission: string;
	children?: MenuChildItem[];
	order: number;
	visible: boolean;
}

// GET /api/menu response
export interface GetMenuOutput {
	menu: MenuItem[];
	permissions: string[];
}
