import { NextResponse } from "next/server";

import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
  const context = await getAuthContext();
  if (!context) return new NextResponse("Unauthorized", { status: 401 });
  if (!context.hospitalId || !hasPermission(context, "patients:read")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { id, docId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: document } = await supabase
    .from("patient_documents")
    .select("id, file_name, storage_path")
    .eq("id", docId)
    .eq("patient_id", id)
    .eq("hospital_id", context.hospitalId)
    .maybeSingle();

  if (!document) return new NextResponse("Not found", { status: 404 });

  const { error: logError } = await supabase.rpc("log_patient_document_access", {
    p_document_id: document.id,
  });
  if (logError) return new NextResponse("Not found", { status: 404 });

  const { data: signed, error: signError } = await supabase.storage
    .from("patient-documents")
    .createSignedUrl(document.storage_path, 60, { download: document.file_name });

  if (signError || !signed) return new NextResponse("Not found", { status: 404 });

  return NextResponse.redirect(signed.signedUrl, 303);
}
