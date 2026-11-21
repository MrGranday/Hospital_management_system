
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "hospital_counters": {
                  Row: {
                    "hospital_id": string,"name": string,"next_value": number
                  }
                  ComputedFields: never
                  Insert: {
                    "hospital_id": string,"name": string,"next_value"?: number
                  }
                  Update: {
                    "hospital_id"?: string,"name"?: string,"next_value"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "hospital_counters_hospital_id_fkey"
      columns: ["hospital_id"]
isOneToOne: false
      referencedRelation: "hospitals"
      referencedColumns: ["id"]
    }
                  ]
                },"hospital_settings": {
                  Row: {
                    "created_at": string,"currency": string,"hospital_id": string,"logo_path": string | null,"number_formats": NonNullable<Json>,"tax_rate": number,"timezone": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"currency": string,"hospital_id": string,"logo_path"?: string | null,"number_formats"?: NonNullable<Json>,"tax_rate"?: number,"timezone": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"currency"?: string,"hospital_id"?: string,"logo_path"?: string | null,"number_formats"?: NonNullable<Json>,"tax_rate"?: number,"timezone"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "hospital_settings_hospital_id_fkey"
      columns: ["hospital_id"]
isOneToOne: true
      referencedRelation: "hospitals"
      referencedColumns: ["id"]
    }
                  ]
                },"hospitals": {
                  Row: {
                    "code": string,"country": string,"created_at": string,"created_by": string | null,"currency": string,"id": string,"name": string,"status": string,"timezone": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"country": string,"created_at"?: string,"created_by"?: string | null,"currency"?: string,"id"?: string,"name": string,"status"?: string,"timezone"?: string,"updated_at"?: string
                  }
                  Update: {
                    "code"?: string,"country"?: string,"created_at"?: string,"created_by"?: string | null,"currency"?: string,"id"?: string,"name"?: string,"status"?: string,"timezone"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"patient_documents": {
                  Row: {
                    "created_at": string,"created_by": string | null,"deleted_at": string | null,"file_name": string,"hospital_id": string,"id": string,"mime_type": string,"patient_id": string,"size_bytes": number,"storage_path": string,"updated_at": string,"updated_by": string | null,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"file_name": string,"hospital_id": string,"id"?: string,"mime_type": string,"patient_id": string,"size_bytes": number,"storage_path": string,"updated_at"?: string,"updated_by"?: string | null,"version"?: number
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"file_name"?: string,"hospital_id"?: string,"id"?: string,"mime_type"?: string,"patient_id"?: string,"size_bytes"?: number,"storage_path"?: string,"updated_at"?: string,"updated_by"?: string | null,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "patient_documents_hospital_id_fkey"
      columns: ["hospital_id"]
isOneToOne: false
      referencedRelation: "hospitals"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "patient_documents_patient_id_fkey"
      columns: ["patient_id"]
isOneToOne: false
      referencedRelation: "patients"
      referencedColumns: ["id"]
    }
                  ]
                },"patient_merges": {
                  Row: {
                    "created_at": string,"created_by": string | null,"hospital_id": string,"id": string,"reason": string,"source_full_name": string,"source_mrn": string,"source_patient_id": string,"target_patient_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"hospital_id": string,"id"?: string,"reason": string,"source_full_name": string,"source_mrn": string,"source_patient_id": string,"target_patient_id": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"hospital_id"?: string,"id"?: string,"reason"?: string,"source_full_name"?: string,"source_mrn"?: string,"source_patient_id"?: string,"target_patient_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "patient_merges_hospital_id_fkey"
      columns: ["hospital_id"]
isOneToOne: false
      referencedRelation: "hospitals"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "patient_merges_source_patient_id_fkey"
      columns: ["source_patient_id"]
isOneToOne: false
      referencedRelation: "patients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "patient_merges_target_patient_id_fkey"
      columns: ["target_patient_id"]
isOneToOne: false
      referencedRelation: "patients"
      referencedColumns: ["id"]
    }
                  ]
                },"patients": {
                  Row: {
                    "address": string | null,"blood_group": string | null,"created_at": string,"created_by": string | null,"date_of_birth": string | null,"deleted_at": string | null,"email": string | null,"full_name": string,"hospital_id": string,"id": string,"merged_into_id": string | null,"mrn": string,"notes": string | null,"phone": string | null,"sex": string,"updated_at": string,"updated_by": string | null,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"blood_group"?: string | null,"created_at"?: string,"created_by"?: string | null,"date_of_birth"?: string | null,"deleted_at"?: string | null,"email"?: string | null,"full_name": string,"hospital_id": string,"id"?: string,"merged_into_id"?: string | null,"mrn": string,"notes"?: string | null,"phone"?: string | null,"sex"?: string,"updated_at"?: string,"updated_by"?: string | null,"version"?: number
                  }
                  Update: {
                    "address"?: string | null,"blood_group"?: string | null,"created_at"?: string,"created_by"?: string | null,"date_of_birth"?: string | null,"deleted_at"?: string | null,"email"?: string | null,"full_name"?: string,"hospital_id"?: string,"id"?: string,"merged_into_id"?: string | null,"mrn"?: string,"notes"?: string | null,"phone"?: string | null,"sex"?: string,"updated_at"?: string,"updated_by"?: string | null,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "patients_hospital_id_fkey"
      columns: ["hospital_id"]
isOneToOne: false
      referencedRelation: "hospitals"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "patients_merged_into_id_fkey"
      columns: ["merged_into_id"]
isOneToOne: false
      referencedRelation: "patients"
      referencedColumns: ["id"]
    }
                  ]
                },"allergies": {
                  Row: {
                    "allergen": string,"created_at": string,"created_by": string | null,"deleted_at": string | null,"hospital_id": string,"id": string,"is_active": boolean,"patient_id": string,"recorded_at": string,"recorded_by": string,"reaction": string | null,"severity": string | null,"updated_at": string,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "allergen": string,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"hospital_id": string,"id"?: string,"is_active"?: boolean,"patient_id": string,"recorded_at"?: string,"recorded_by": string,"reaction"?: string | null,"severity"?: string | null,"updated_at"?: string,"version"?: number
                  }
                  Update: {
                    "allergen"?: string,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"hospital_id"?: string,"id"?: string,"is_active"?: boolean,"patient_id"?: string,"recorded_at"?: string,"recorded_by"?: string,"reaction"?: string | null,"severity"?: string | null,"updated_at"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "allergies_hospital_id_fkey"
      columns: ["hospital_id"]
isOneToOne: false
referencedRelation: "hospitals"
referencedColumns: ["id"]
    },{
      foreignKeyName: "allergies_patient_id_fkey"
      columns: ["patient_id"]
isOneToOne: false
referencedRelation: "patients"
referencedColumns: ["id"]
    },{
      foreignKeyName: "allergies_recorded_by_fkey"
      columns: ["recorded_by"]
isOneToOne: false
referencedRelation: "profiles"
referencedColumns: ["user_id"]
    }
                  ]
                },"clinical_notes": {
                  Row: {
                    "content": string,"created_at": string,"created_by": string | null,"deleted_at": string | null,"hospital_id": string,"id": string,"is_confidential": boolean,"note_type": string,"provider_id": string,"title": string,"updated_at": string,"updated_by": string | null,"visit_id": string,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "content": string,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"hospital_id": string,"id"?: string,"is_confidential"?: boolean,"note_type": string,"provider_id": string,"title": string,"updated_at"?: string,"updated_by"?: string | null,"visit_id": string,"version"?: number
                  }
                  Update: {
                    "content"?: string,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"hospital_id"?: string,"id"?: string,"is_confidential"?: boolean,"note_type"?: string,"provider_id"?: string,"title"?: string,"updated_at"?: string,"updated_by"?: string | null,"visit_id"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "clinical_notes_hospital_id_fkey"
      columns: ["hospital_id"]
isOneToOne: false
referencedRelation: "hospitals"
referencedColumns: ["id"]
    },{
      foreignKeyName: "clinical_notes_provider_id_fkey"
      columns: ["provider_id"]
isOneToOne: false
referencedRelation: "profiles"
referencedColumns: ["user_id"]
    },{
      foreignKeyName: "clinical_notes_visit_id_fkey"
      columns: ["visit_id"]
isOneToOne: false
referencedRelation: "visits"
referencedColumns: ["id"]
    }
                  ]
                },"diagnoses": {
                  Row: {
                    "created_at": string,"created_by": string | null,"deleted_at": string | null,"description": string,"diagnosed_at": string,"hospital_id": string,"id": string,"icd_code": string,"is_chronic": boolean,"is_primary": boolean,"patient_id": string,"provider_id": string,"updated_at": string,"updated_by": string | null,"visit_id": string | null,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"description": string,"diagnosed_at"?: string,"hospital_id": string,"id"?: string,"icd_code": string,"is_chronic"?: boolean,"is_primary"?: boolean,"patient_id": string,"provider_id": string,"updated_at"?: string,"updated_by"?: string | null,"visit_id"?: string | null,"version"?: number
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"description"?: string,"diagnosed_at"?: string,"hospital_id"?: string,"id"?: string,"icd_code"?: string,"is_chronic"?: boolean,"is_primary"?: boolean,"patient_id"?: string,"provider_id"?: string,"updated_at"?: string,"updated_by"?: string | null,"visit_id"?: string | null,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "diagnoses_hospital_id_fkey"
      columns: ["hospital_id"]
isOneToOne: false
referencedRelation: "hospitals"
referencedColumns: ["id"]
    },{
      foreignKeyName: "diagnoses_patient_id_fkey"
      columns: ["patient_id"]
isOneToOne: false
referencedRelation: "patients"
referencedColumns: ["id"]
    },{
      foreignKeyName: "diagnoses_provider_id_fkey"
      columns: ["provider_id"]
isOneToOne: false
referencedRelation: "profiles"
referencedColumns: ["user_id"]
    },{
      foreignKeyName: "diagnoses_visit_id_fkey"
      columns: ["visit_id"]
isOneToOne: false
referencedRelation: "visits"
referencedColumns: ["id"]
    }
                  ]
                },"problems": {
                  Row: {
                    "condition": string,"created_at": string,"created_by": string | null,"deleted_at": string | null,"hospital_id": string,"icd_code": string | null,"id": string,"is_active": boolean,"onset_date": string | null,"patient_id": string,"recorded_by": string,"resolved_date": string | null,"updated_at": string,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "condition": string,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"hospital_id": string,"icd_code"?: string | null,"id"?: string,"is_active"?: boolean,"onset_date"?: string | null,"patient_id": string,"recorded_by": string,"resolved_date"?: string | null,"updated_at"?: string,"version"?: number
                  }
                  Update: {
                    "condition"?: string,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"hospital_id"?: string,"icd_code"?: string | null,"id"?: string,"is_active"?: boolean,"onset_date"?: string | null,"patient_id"?: string,"recorded_by"?: string,"resolved_date"?: string | null,"updated_at"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "problems_hospital_id_fkey"
      columns: ["hospital_id"]
isOneToOne: false
referencedRelation: "hospitals"
referencedColumns: ["id"]
    },{
      foreignKeyName: "problems_patient_id_fkey"
      columns: ["patient_id"]
isOneToOne: false
referencedRelation: "patients"
referencedColumns: ["id"]
    },{
      foreignKeyName: "problems_recorded_by_fkey"
      columns: ["recorded_by"]
isOneToOne: false
referencedRelation: "profiles"
referencedColumns: ["user_id"]
    }
                  ]
                },"prescriptions": {
                  Row: {
                    "created_at": string,"created_by": string | null,"deleted_at": string | null,"hospital_id": string,"id": string,"notes": string | null,"patient_id": string,"prescribed_at": string,"provider_id": string,"status": string,"updated_at": string,"updated_by": string | null,"valid_until": string | null,"visit_id": string | null,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"hospital_id": string,"id"?: string,"notes"?: string | null,"patient_id": string,"prescribed_at"?: string,"provider_id": string,"status": string,"updated_at"?: string,"updated_by"?: string | null,"valid_until"?: string | null,"visit_id"?: string | null,"version"?: number
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"hospital_id"?: string,"id"?: string,"notes"?: string | null,"patient_id"?: string,"prescribed_at"?: string,"provider_id"?: string,"status"?: string,"updated_at"?: string,"updated_by"?: string | null,"valid_until"?: string | null,"visit_id"?: string | null,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "prescriptions_hospital_id_fkey"
      columns: ["hospital_id"]
isOneToOne: false
referencedRelation: "hospitals"
referencedColumns: ["id"]
    },{
      foreignKeyName: "prescriptions_patient_id_fkey"
      columns: ["patient_id"]
isOneToOne: false
referencedRelation: "patients"
referencedColumns: ["id"]
    },{
      foreignKeyName: "prescriptions_provider_id_fkey"
      columns: ["provider_id"]
isOneToOne: false
referencedRelation: "profiles"
referencedColumns: ["user_id"]
    },{
      foreignKeyName: "prescriptions_visit_id_fkey"
      columns: ["visit_id"]
isOneToOne: false
referencedRelation: "visits"
referencedColumns: ["id"]
    }
                  ]
                },"prescription_items": {
                  Row: {
                    "created_at": string,"created_by": string | null,"duration": string | null,"frequency": string,"hospital_id": string,"id": string,"instructions": string | null,"medication_name": string,"dosage": string,"prescription_id": string,"quantity": number | null,"refills": number,"updated_at": string,"updated_by": string | null,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"duration"?: string | null,"frequency": string,"hospital_id": string,"id"?: string,"instructions"?: string | null,"medication_name": string,"dosage": string,"prescription_id": string,"quantity"?: number | null,"refills"?: number,"updated_at"?: string,"updated_by"?: string | null,"version"?: number
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"duration"?: string | null,"frequency"?: string,"hospital_id"?: string,"id"?: string,"instructions"?: string | null,"medication_name"?: string,"dosage"?: string,"prescription_id"?: string,"quantity"?: number | null,"refills"?: number,"updated_at"?: string,"updated_by"?: string | null,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "prescription_items_hospital_id_fkey"
      columns: ["hospital_id"]
isOneToOne: false
referencedRelation: "hospitals"
referencedColumns: ["id"]
    },{
      foreignKeyName: "prescription_items_prescription_id_fkey"
      columns: ["prescription_id"]
isOneToOne: false
referencedRelation: "prescriptions"
referencedColumns: ["id"]
    }
                  ]
                },"credit_notes": {
                  Row: {
                    "amount_minor": number,"created_at": string,"currency": string,"hospital_id": string,"id": string,"invoice_id": string,"reason": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_minor": number,"created_at"?: string,"currency"?: string,"hospital_id": string,"id"?: string,"invoice_id": string,"reason": string
                  }
                  Update: {
                    "amount_minor"?: number,"created_at"?: string,"currency"?: string,"hospital_id"?: string,"id"?: string,"invoice_id"?: string,"reason"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "credit_notes_hospital_id_fkey"
      columns: ["hospital_id"]
isOneToOne: false
referencedRelation: "hospitals"
referencedColumns: ["id"]
    },{
      foreignKeyName: "credit_notes_invoice_id_fkey"
      columns: ["invoice_id"]
isOneToOne: false
referencedRelation: "invoices"
referencedColumns: ["id"]
    }
                  ]
                },"invoice_lines": {
                  Row: {
                    "created_at": string,"created_by": string | null,"deleted_at": string | null,"description": string,"hospital_id": string,"id": string,"invoice_id": string,"line_total_minor": number,"quantity": number,"service_id": string | null,"unit_price_minor": number,"updated_at": string,"updated_by": string | null,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"description": string,"hospital_id": string,"id"?: string,"invoice_id": string,"line_total_minor": number,"quantity": number,"service_id"?: string | null,"unit_price_minor": number,"updated_at"?: string,"updated_by"?: string | null,"version"?: number
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"description"?: string,"hospital_id"?: string,"id"?: string,"invoice_id"?: string,"line_total_minor"?: number,"quantity"?: number,"service_id"?: string | null,"unit_price_minor"?: number,"updated_at"?: string,"updated_by"?: string | null,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "invoice_lines_hospital_id_fkey"
      columns: ["hospital_id"]
isOneToOne: false
referencedRelation: "hospitals"
referencedColumns: ["id"]
    },{
      foreignKeyName: "invoice_lines_invoice_id_fkey"
      columns: ["invoice_id"]
isOneToOne: false
referencedRelation: "invoices"
referencedColumns: ["id"]
    },{
      foreignKeyName: "invoice_lines_service_id_fkey"
      columns: ["service_id"]
isOneToOne: false
referencedRelation: "services"
referencedColumns: ["id"]
    }
                  ]
                },"invoices": {
                  Row: {
                    "created_at": string,"created_by": string | null,"currency": string,"deleted_at": string | null,"hospital_id": string,"id": string,"invoice_no": string,"issued_at": string | null,"patient_id": string,"status": string,"subtotal_minor": number,"tax_minor": number,"total_minor": number,"updated_at": string,"updated_by": string | null,"void_reason": string | null,"voided_at": string | null,"voided_by": string | null,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"currency"?: string,"deleted_at"?: string | null,"hospital_id": string,"id"?: string,"invoice_no": string,"issued_at"?: string | null,"patient_id": string,"status": string,"subtotal_minor": number,"tax_minor": number,"total_minor": number,"updated_at"?: string,"updated_by"?: string | null,"void_reason"?: string | null,"voided_at"?: string | null,"voided_by"?: string | null,"version"?: number
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"currency"?: string,"deleted_at"?: string | null,"hospital_id"?: string,"id"?: string,"invoice_no"?: string,"issued_at"?: string | null,"patient_id"?: string,"status"?: string,"subtotal_minor"?: number,"tax_minor"?: number,"total_minor"?: number,"updated_at"?: string,"updated_by"?: string | null,"void_reason"?: string | null,"voided_at"?: string | null,"voided_by"?: string | null,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "invoices_hospital_id_fkey"
      columns: ["hospital_id"]
isOneToOne: false
referencedRelation: "hospitals"
referencedColumns: ["id"]
    },{
      foreignKeyName: "invoices_patient_id_fkey"
      columns: ["patient_id"]
isOneToOne: false
referencedRelation: "patients"
referencedColumns: ["id"]
    },{
      foreignKeyName: "invoices_voided_by_fkey"
      columns: ["voided_by"]
isOneToOne: false
referencedRelation: "auth.users"
referencedColumns: ["id"]
    }
                  ]
                },"payments": {
                  Row: {
                    "amount_minor": number,"created_at": string,"created_by": string | null,"currency": string,"deleted_at": string | null,"hospital_id": string,"id": string,"invoice_id": string,"paid_at": string,"payment_method": string,"reference": string | null,"updated_at": string,"updated_by": string | null,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_minor": number,"created_at"?: string,"created_by"?: string | null,"currency"?: string,"deleted_at"?: string | null,"hospital_id": string,"id"?: string,"invoice_id": string,"paid_at"?: string,"payment_method": string,"reference"?: string | null,"updated_at"?: string,"updated_by"?: string | null,"version"?: number
                  }
                  Update: {
                    "amount_minor"?: number,"created_at"?: string,"created_by"?: string | null,"currency"?: string,"deleted_at"?: string | null,"hospital_id"?: string,"id"?: string,"invoice_id"?: string,"paid_at"?: string,"payment_method"?: string,"reference"?: string | null,"updated_at"?: string,"updated_by"?: string | null,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "payments_hospital_id_fkey"
      columns: ["hospital_id"]
isOneToOne: false
referencedRelation: "hospitals"
referencedColumns: ["id"]
    },{
      foreignKeyName: "payments_invoice_id_fkey"
      columns: ["invoice_id"]
isOneToOne: false
referencedRelation: "invoices"
referencedColumns: ["id"]
    }
                  ]
                },"services": {
                  Row: {
                    "code": string,"created_at": string,"created_by": string | null,"currency": string,"deleted_at": string | null,"department": string | null,"description": string | null,"hospital_id": string,"id": string,"is_active": boolean,"name": string,"unit_price_minor": number,"updated_at": string,"updated_by": string | null,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"created_at"?: string,"created_by"?: string | null,"currency"?: string,"deleted_at"?: string | null,"department"?: string | null,"description"?: string | null,"hospital_id": string,"id"?: string,"is_active"?: boolean,"name": string,"unit_price_minor": number,"updated_at"?: string,"updated_by"?: string | null,"version"?: number
                  }
                  Update: {
                    "code"?: string,"created_at"?: string,"created_by"?: string | null,"currency"?: string,"deleted_at"?: string | null,"department"?: string | null,"description"?: string | null,"hospital_id"?: string,"id"?: string,"is_active"?: boolean,"name"?: string,"unit_price_minor"?: number,"updated_at"?: string,"updated_by"?: string | null,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "services_hospital_id_fkey"
      columns: ["hospital_id"]
isOneToOne: false
referencedRelation: "hospitals"
referencedColumns: ["id"]
    }
                  ]
                },"dispensations": {
                  Row: {
                    "created_at": string,"created_by": string | null,"deleted_at": string | null,"dispensed_at": string,"dispensed_by": string,"hospital_id": string,"id": string,"notes": string | null,"prescription_id": string,"prescription_item_id": string,"stock_movement_id": string,"updated_at": string,"updated_by": string | null,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"dispensed_at"?: string,"dispensed_by": string,"hospital_id": string,"id"?: string,"notes"?: string | null,"prescription_id": string,"prescription_item_id": string,"stock_movement_id": string,"updated_at"?: string,"updated_by"?: string | null,"version"?: number
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"dispensed_at"?: string,"dispensed_by"?: string,"hospital_id"?: string,"id"?: string,"notes"?: string | null,"prescription_id"?: string,"prescription_item_id"?: string,"stock_movement_id"?: string,"updated_at"?: string,"updated_by"?: string | null,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "dispensations_hospital_id_fkey"
      columns: ["hospital_id"]
isOneToOne: false
referencedRelation: "hospitals"
referencedColumns: ["id"]
    },{
      foreignKeyName: "dispensations_dispensed_by_fkey"
      columns: ["dispensed_by"]
isOneToOne: false
referencedRelation: "profiles"
referencedColumns: ["user_id"]
    },{
      foreignKeyName: "dispensations_prescription_id_fkey"
      columns: ["prescription_id"]
isOneToOne: false
referencedRelation: "prescriptions"
referencedColumns: ["id"]
    },{
      foreignKeyName: "dispensations_prescription_item_id_fkey"
      columns: ["prescription_item_id"]
isOneToOne: false
referencedRelation: "prescription_items"
referencedColumns: ["id"]
    },{
      foreignKeyName: "dispensations_stock_movement_id_fkey"
      columns: ["stock_movement_id"]
isOneToOne: false
referencedRelation: "stock_movements"
referencedColumns: ["id"]
    }
                  ]
                },"item_batches": {
                  Row: {
                    "batch_no": string,"cost_price_minor": number,"created_at": string,"created_by": string | null,"currency": string,"deleted_at": string | null,"expiry_date": string,"hospital_id": string,"id": string,"item_id": string,"received_at": string,"received_by": string | null,"sale_price_minor": number,"updated_at": string,"updated_by": string | null,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "batch_no": string,"cost_price_minor": number,"created_at"?: string,"created_by"?: string | null,"currency"?: string,"deleted_at"?: string | null,"expiry_date": string,"hospital_id": string,"id"?: string,"item_id": string,"received_at"?: string,"received_by"?: string | null,"sale_price_minor": number,"updated_at"?: string,"updated_by"?: string | null,"version"?: number
                  }
                  Update: {
                    "batch_no"?: string,"cost_price_minor"?: number,"created_at"?: string,"created_by"?: string | null,"currency"?: string,"deleted_at"?: string | null,"expiry_date"?: string,"hospital_id"?: string,"id"?: string,"item_id"?: string,"received_at"?: string,"received_by"?: string | null,"sale_price_minor"?: number,"updated_at"?: string,"updated_by"?: string | null,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "item_batches_hospital_id_fkey"
      columns: ["hospital_id"]
isOneToOne: false
referencedRelation: "hospitals"
referencedColumns: ["id"]
    },{
      foreignKeyName: "item_batches_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
referencedRelation: "items"
referencedColumns: ["id"]
    }
                  ]
                },"items": {
                  Row: {
                    "category": string | null,"created_at": string,"created_by": string | null,"deleted_at": string | null,"description": string | null,"hospital_id": string,"id": string,"is_active": boolean,"is_controlled": boolean,"name": string,"requires_prescription": boolean,"sku": string,"unit": string,"updated_at": string,"updated_by": string | null,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "category"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"description"?: string | null,"hospital_id": string,"id"?: string,"is_active"?: boolean,"is_controlled"?: boolean,"name": string,"requires_prescription"?: boolean,"sku": string,"unit": string,"updated_at"?: string,"updated_by"?: string | null,"version"?: number
                  }
                  Update: {
                    "category"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"description"?: string | null,"hospital_id"?: string,"id"?: string,"is_active"?: boolean,"is_controlled"?: boolean,"name"?: string,"requires_prescription"?: boolean,"sku"?: string,"unit"?: string,"updated_at"?: string,"updated_by"?: string | null,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "items_hospital_id_fkey"
      columns: ["hospital_id"]
isOneToOne: false
referencedRelation: "hospitals"
referencedColumns: ["id"]
    }
                  ]
                },"stock_adjustments": {
                  Row: {
                    "approved_at": string | null,"approved_by": string | null,"created_at": string,"created_by": string,"hospital_id": string,"id": string,"movement_id": string,"reason": string
                  }
                  ComputedFields: never
                  Insert: {
                    "approved_at"?: string | null,"approved_by"?: string | null,"created_at"?: string,"created_by": string,"hospital_id": string,"id"?: string,"movement_id": string,"reason": string
                  }
                  Update: {
                    "approved_at"?: string | null,"approved_by"?: string | null,"created_at"?: string,"created_by"?: string,"hospital_id"?: string,"id"?: string,"movement_id"?: string,"reason"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "stock_adjustments_hospital_id_fkey"
      columns: ["hospital_id"]
isOneToOne: false
referencedRelation: "hospitals"
referencedColumns: ["id"]
    },{
      foreignKeyName: "stock_adjustments_movement_id_fkey"
      columns: ["movement_id"]
isOneToOne: false
referencedRelation: "stock_movements"
referencedColumns: ["id"]
    }
                  ]
                },"stock_locations": {
                  Row: {
                    "created_at": string,"created_by": string | null,"deleted_at": string | null,"hospital_id": string,"id": string,"is_active": boolean,"name": string,"type": string,"updated_at": string,"updated_by": string | null,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"hospital_id": string,"id"?: string,"is_active"?: boolean,"name": string,"type": string,"updated_at"?: string,"updated_by"?: string | null,"version"?: number
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"hospital_id"?: string,"id"?: string,"is_active"?: boolean,"name"?: string,"type"?: string,"updated_at"?: string,"updated_by"?: string | null,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "stock_locations_hospital_id_fkey"
      columns: ["hospital_id"]
isOneToOne: false
referencedRelation: "hospitals"
referencedColumns: ["id"]
    }
                  ]
                },"stock_movements": {
                  Row: {
                    "batch_id": string | null,"created_at": string,"created_by": string,"hospital_id": string,"id": string,"item_id": string,"location_id": string | null,"movement_type": string,"notes": string | null,"quantity": number,"reference_id": string | null,"reference_type": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "batch_id"?: string | null,"created_at"?: string,"created_by": string,"hospital_id": string,"id"?: string,"item_id": string,"location_id"?: string | null,"movement_type": string,"notes"?: string | null,"quantity": number,"reference_id"?: string | null,"reference_type"?: string | null
                  }
                  Update: {
                    "batch_id"?: string | null,"created_at"?: string,"created_by"?: string,"hospital_id"?: string,"id"?: string,"item_id"?: string,"location_id"?: string | null,"movement_type"?: string,"notes"?: string | null,"quantity"?: number,"reference_id"?: string | null,"reference_type"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "stock_movements_batch_id_fkey"
      columns: ["batch_id"]
isOneToOne: false
referencedRelation: "item_batches"
referencedColumns: ["id"]
    },{
      foreignKeyName: "stock_movements_hospital_id_fkey"
      columns: ["hospital_id"]
isOneToOne: false
referencedRelation: "hospitals"
referencedColumns: ["id"]
    },{
      foreignKeyName: "stock_movements_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
referencedRelation: "items"
referencedColumns: ["id"]
    },{
      foreignKeyName: "stock_movements_location_id_fkey"
      columns: ["location_id"]
isOneToOne: false
referencedRelation: "stock_locations"
referencedColumns: ["id"]
    }
                  ]
                },"permissions": {
                  Row: {
                    "action": string,"created_at": string,"description": string | null,"id": string,"key": string,"module": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"created_at"?: string,"description"?: string | null,"id"?: string,"key": string,"module": string
                  }
                  Update: {
                    "action"?: string,"created_at"?: string,"description"?: string | null,"id"?: string,"key"?: string,"module"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"created_by": string | null,"full_name": string,"hospital_id": string | null,"is_active": boolean,"must_change_password": boolean,"updated_at": string,"user_id": string,"username": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"full_name": string,"hospital_id"?: string | null,"is_active"?: boolean,"must_change_password"?: boolean,"updated_at"?: string,"user_id": string,"username"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"full_name"?: string,"hospital_id"?: string | null,"is_active"?: boolean,"must_change_password"?: boolean,"updated_at"?: string,"user_id"?: string,"username"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_hospital_id_fkey"
      columns: ["hospital_id"]
isOneToOne: false
      referencedRelation: "hospitals"
      referencedColumns: ["id"]
    }
                  ]
                },"role_permissions": {
                  Row: {
                    "permission_id": string,"role_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "permission_id": string,"role_id": string
                  }
                  Update: {
                    "permission_id"?: string,"role_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "role_permissions_permission_id_fkey"
      columns: ["permission_id"]
isOneToOne: false
      referencedRelation: "permissions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "role_permissions_role_id_fkey"
      columns: ["role_id"]
isOneToOne: false
      referencedRelation: "roles"
      referencedColumns: ["id"]
    }
                  ]
                },"roles": {
                  Row: {
                    "created_at": string,"id": string,"is_system": boolean,"key": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"is_system"?: boolean,"key": string,"name": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"is_system"?: boolean,"key"?: string,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"user_roles": {
                  Row: {
                    "assigned_at": string,"assigned_by": string | null,"role_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "assigned_at"?: string,"assigned_by"?: string | null,"role_id": string,"user_id": string
                  }
                  Update: {
                    "assigned_at"?: string,"assigned_by"?: string | null,"role_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_roles_role_id_fkey"
      columns: ["role_id"]
isOneToOne: false
      referencedRelation: "roles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "archive_patient":
{ Args: { "p_patient_id": string }; Returns: boolean
                           },
            "create_appointment":
{ Args: { "p_ends_at": string,"p_notes"?: string,"p_patient_id": string,"p_provider_id": string,"p_reason": string,"p_starts_at": string,"p_type": string }; Returns: {
              "created_at": string,"created_by": string | null,"deleted_at": string | null,"ends_at": string,"hospital_id": string,"id": string,"notes": string | null,"patient_id": string,"provider_id": string,"reason": string,"starts_at": string,"status": string,"type": string,"updated_at": string,"updated_by": string | null,"version": number
            }
                            },
            "create_visit":
{ Args: { "p_appointment_id"?: string,"p_chief_complaint"?: string,"p_patient_id": string,"p_provider_id": string }; Returns: {
              "appointment_id": string | null,"chief_complaint": string | null,"completed_at": string | null,"created_at": string,"created_by": string | null,"deleted_at": string | null,"hospital_id": string,"id": string,"notes": string | null,"patient_id": string,"provider_id": string,"queue_position": number | null,"started_at": string | null,"status": string,"updated_at": string,"updated_by": string | null,"version": number
            }
                            },
            "custom_access_token_hook":
{ Args: { "event": Json }; Returns: Json
                           },
"delete_patient_document":
{ Args: { "p_document_id": string }; Returns: boolean
                           },
"list_hospital_audit_events":
{ Args: { "p_action"?: string,"p_limit"?: number,"p_offset"?: number,"p_table"?: string }; Returns: {
              "action": string,"actor_id": string,"actor_role": string,"after": Json,"before": Json,"id": number,"occurred_at": string,"reason": string,"record_id": string,"table_name": string,"total_count": number
            }[]
                            },
            "list_appointments":
{ Args: { "p_limit"?: number,"p_offset"?: number,"p_provider_id"?: string,"p_query"?: string,"p_status"?: string }; Returns: {
              "created_at": string,"ends_at": string,"id": string,"patient_id": string,"patient_mrn": string,"patient_name": string,"provider_id": string,"provider_name": string,"reason": string,"starts_at": string,"status": string,"total_count": number,"type": string
            }[]
                            },
            "list_visits":
{ Args: { "p_limit"?: number,"p_offset"?: number,"p_query"?: string,"p_status"?: string }; Returns: {
              "appointment_id": string | null,"chief_complaint": string | null,"completed_at": string | null,"created_at": string,"id": string,"patient_id": string,"patient_mrn": string,"patient_name": string,"provider_id": string,"provider_name": string,"queue_position": number | null,"started_at": string | null,"status": string,"total_count": number
            }[]
                            },
            "list_patients":
{ Args: { "p_limit"?: number,"p_offset"?: number,"p_query"?: string }; Returns: {
              "created_at": string,"date_of_birth": string,"full_name": string,"id": string,"mrn": string,"phone": string,"sex": string,"total_count": number
            }[]
                           },
"list_platform_audit_events":
{ Args: { "p_limit"?: number }; Returns: {
              "action": string,"actor_role": string,"hospital_id": string,"id": number,"occurred_at": string,"record_id": string,"table_name": string
            }[]
                           },
"log_patient_document_access":
{ Args: { "p_document_id": string }; Returns: undefined
                           },
            "record_vitals":
{ Args: { "p_blood_pressure_diastolic"?: number,"p_blood_pressure_systolic"?: number,"p_height_cm"?: number,"p_heart_rate"?: number,"p_notes"?: string,"p_oxygen_saturation"?: number,"p_recorded_by"?: string,"p_respiratory_rate"?: number,"p_temperature_c"?: number,"p_visit_id": string,"p_weight_kg"?: number }; Returns: {
              "blood_pressure_diastolic": number | null,"blood_pressure_systolic": number | null,"created_at": string,"height_cm": number | null,"heart_rate": number | null,"hospital_id": string,"id": string,"notes": string | null,"oxygen_saturation": number | null,"recorded_at": string,"recorded_by": string,"respiratory_rate": number | null,"temperature_c": number | null,"updated_at": string,"version": number,"visit_id": string,"weight_kg": number | null
            }
                           },
"merge_patients":
{ Args: { "p_reason": string,"p_source_id": string,"p_target_id": string }; Returns: string
                           },
"register_patient":
{ Args: { "p_address"?: string,"p_blood_group"?: string,"p_date_of_birth"?: string,"p_email"?: string,"p_full_name": string,"p_notes"?: string,"p_phone"?: string,"p_sex"?: string }; Returns: {
              "address": string | null,
"blood_group": string | null,
"created_at": string,
"created_by": string | null,
"date_of_birth": string | null,
"deleted_at": string | null,
"email": string | null,
"full_name": string,
"hospital_id": string,
"id": string,
"merged_into_id": string | null,
"mrn": string,
"notes": string | null,
"phone": string | null,
"sex": string,
"updated_at": string,
"updated_by": string | null,
"version": number
            }
                          SetofOptions: {
        from: "*"
        to: "patients"
        isOneToOne: true
        isSetofReturn: false
      } }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
