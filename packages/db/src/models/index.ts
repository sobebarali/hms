// Auth models (Better-Auth)
export { User, Session, Account, Verification } from "./auth.model";

// Hospital/Tenant
export { Hospital, HospitalStatus } from "./hospital.model";

// Role & Permissions
export { Role } from "./role.model";

// Department
export { Department, DepartmentType, DepartmentStatus } from "./department.model";

// Staff
export { Staff, StaffShift, StaffStatus } from "./staff.model";

// Patient
export { Patient, Gender, PatientType, PatientStatus } from "./patient.model";

// Appointment
export {
	Appointment,
	AppointmentType,
	AppointmentPriority,
	AppointmentStatus,
} from "./appointment.model";

// Vitals
export {
	Vitals,
	TemperatureUnit,
	WeightUnit,
	HeightUnit,
	GlucoseUnit,
	GlucoseTiming,
	AlertSeverity,
} from "./vitals.model";

// Prescription
export {
	Prescription,
	PrescriptionTemplate,
	PrescriptionStatus,
} from "./prescription.model";

// Dispensing
export {
	Dispensing,
	DispensingStatus,
	MedicineDispensingStatus,
} from "./dispensing.model";

// Medicine
export { Medicine, MedicineCategory, MedicineType } from "./medicine.model";

// Inventory
export {
	Inventory,
	InventoryTransaction,
	TransactionType,
} from "./inventory.model";

// Counter
export { Counter, CounterType } from "./counter.model";
