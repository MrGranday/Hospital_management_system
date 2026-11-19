
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
