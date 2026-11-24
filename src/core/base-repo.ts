// Core shared utilities for MediCore HMS backend.
// See PLATFORM_MODULES.md §4 (core tables).

import { createSupabaseServerClient } from "@/server/supabase/server";

export type PaginationParams = {
  page?: number;
  pageSize?: number;
};

export type PaginationResult<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function paginate<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginationResult<T> {
  const totalPages = Math.ceil(total / pageSize);
  return { data, total, page, pageSize, totalPages };
}

export async function getSupabase() {
  return createSupabaseServerClient();
}

type TableName = string & { __brand: "table" };

function tbl(name: string): TableName {
  return name as TableName;
}

// Base repository with common CRUD operations.
// Uses untyped Supabase calls to avoid generated-type mismatches for new tables.
export class BaseRepo {
  constructor(
    public table: string,
    public hospitalId: string,
  ) {}

  protected async sb() {
    return createSupabaseServerClient();
  }

  async list(filters: Record<string, unknown> = {}): Promise<Record<string, unknown>[]> {
    const sb = await this.sb();
    let query = sb
      .from(tbl(this.table) as never)
      .select("*")
      .eq("hospital_id", this.hospitalId)
      .is("deleted_at", null);
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    }
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Record<string, unknown>[];
  }

  async get(id: string): Promise<Record<string, unknown> | null> {
    const sb = await this.sb();
    const { data, error } = await sb
      .from(tbl(this.table) as never)
      .select("*")
      .eq("id", id)
      .eq("hospital_id", this.hospitalId)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Record<string, unknown> | null) ?? null;
  }

  async insert(values: Record<string, unknown>): Promise<Record<string, unknown>> {
    const sb = await this.sb();
    const { data, error } = await sb
      .from(tbl(this.table) as never)
      .insert({ ...values, hospital_id: this.hospitalId } as never)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data as Record<string, unknown>;
  }

  async update(id: string, values: Record<string, unknown>): Promise<Record<string, unknown>> {
    const sb = await this.sb();
    const { data, error } = await sb
      .from(tbl(this.table) as never)
      .update(values as never)
      .eq("id", id)
      .eq("hospital_id", this.hospitalId)
      .is("deleted_at", null)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data as Record<string, unknown>;
  }

  async softDelete(id: string): Promise<void> {
    const sb = await this.sb();
    const { error } = await sb
      .from(tbl(this.table) as never)
      .update({ deleted_at: new Date().toISOString() } as never)
      .eq("id", id)
      .eq("hospital_id", this.hospitalId);
    if (error) throw new Error(error.message);
  }

  async paginate(
    page = 1,
    pageSize = 50,
    filters: Record<string, unknown> = {},
  ): Promise<PaginationResult<Record<string, unknown>>> {
    const sb = await this.sb();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let countQuery = sb
      .from(tbl(this.table) as never)
      .select("*", { head: true, count: "exact" })
      .eq("hospital_id", this.hospitalId)
      .is("deleted_at", null);
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        countQuery = countQuery.eq(key, value);
      }
    }
    const { count, error: countError } = await countQuery;
    if (countError) throw new Error(countError.message);

    let dataQuery = sb
      .from(tbl(this.table) as never)
      .select("*")
      .eq("hospital_id", this.hospitalId)
      .is("deleted_at", null);
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        dataQuery = dataQuery.eq(key, value);
      }
    }
    dataQuery = dataQuery.order("created_at", { ascending: false }).range(from, to);
    const { data, error } = await dataQuery;
    if (error) throw new Error(error.message);

    return paginate((data ?? []) as Record<string, unknown>[], count ?? 0, page, pageSize);
  }
}
