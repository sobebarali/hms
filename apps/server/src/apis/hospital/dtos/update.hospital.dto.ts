// Input DTO
export interface UpdateHospitalInput {
	name?: string;
	address?: {
		street?: string;
		city?: string;
		state?: string;
		postalCode?: string;
		country?: string;
	};
	contactEmail?: string;
	contactPhone?: string;
}

// Output DTO
export interface UpdateHospitalOutput {
	id: string;
	name: string;
	address: {
		street: string;
		city: string;
		state: string;
		postalCode: string;
		country: string;
	};
	contactEmail: string;
	contactPhone: string;
	status: string;
	updatedAt: string;
}
