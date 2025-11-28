// Input DTO
export interface VerifyHospitalInput {
	token: string;
}

// Output DTO
export interface VerifyHospitalOutput {
	id: string;
	status: string;
	message: string;
}
