import "server-only";

import { BaseRepo } from "@/core/base-repo";
import { createSupabaseServerClient } from "@/server/supabase/server";

export type PatientRow = Record<string, unknown>;

export type PatientInsert = {
  mrn: string;
  full_name: string;
  sex?: string | null;
  date_of_birth?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  blood_group?: string | null;
  notes?: string | null;
};

export class PatientsRepo extends BaseRepo {
  constructor(hospitalId: string) {
    super("patients", hospitalId);
  }

  async search(query: string, page = 1, pageSize = 50): Promise<{ data: PatientRow[]; total: number }> {
    const sb = await createSupabaseServerClient();
    let q = sb
      .from("patients")
      .select("*, count(*)", { head: true })
      .eq("hospital_id", this.hospitalId)
      .is("deleted_at", null)
      .is("merged_into_id", null)
      .ilike("full_name", `%${query}%`)
      .or(`mrn.ilike.%${query}%`);
    const { count, error: countError } = await q;
    if (countError) throw new Error(countError.message);

    const { data, error } = await sb
      .from("patients")
      .select("*")
      .eq("hospital_id", this.hospitalId)
      .is("deleted_at", null)
      .is("merged_into_id", null)
      .ilike("full_name", `%${query}%`)
      .or(`mrn.ilike.%${query}%`)
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, (page - 1) * pageSize + pageSize - 1);
    if (error) throw new Error(error.message);

    return { data: (data ?? []) as PatientRow[], total: count ?? 0 };
  }

  async getByMRN(mrn: string): Promise<PatientRow | null> {
    const sb = await createSupabaseServerClient();
    const { data, error } = await sb
      .from("patients")
      .select("*")
      .eq("hospital_id", this.hospitalId)
      .eq("mrn", mrn)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as PatientRow | null) ?? null;
  }

  async archive(id: string): Promise<void> {
    const sb = await createSupabaseServerClient();
    const { error } = await sb
      .from("patients")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("hospital_id", this.hospitalId);
    if (error) throw new Error(error.message);
  }
}
