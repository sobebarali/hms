import { z } from "zod";

export const verifyHospitalSchema = z.object({
	params: z.object({
		id: z.string().min(1, "Hospital ID is required"),
	}),
	body: z.object({
		token: z.string().min(1, "Verification token is required"),
	}),
});

export type VerifyHospitalValidated = z.infer<
	typeof verifyHospitalSchema.shape.body
>;
