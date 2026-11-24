// Public API for the reception module.
// See PLATFORM_MODULES.md §11 (module index.ts pattern).

export type { PatientRow, PatientInsert } from "@/features/reception/repo";
export { PatientsRepo } from "@/features/reception/repo";
export type { CreatePatientInput } from "@/features/reception/service";
export { PatientsService } from "@/features/reception/service";

export {
  createPatientAction,
  listPatientsAction,
  searchPatientsAction,
  getPatientAction,
  archivePatientAction,
} from "@/features/reception/actions";
