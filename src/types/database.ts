export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      azioni_successive: {
        Row: {
          attivo: boolean
          created_at: string
          id: string
          nome: string
          ordine: number
          owner_id: string
          updated_at: string
        }
        Insert: {
          attivo?: boolean
          created_at?: string
          id?: string
          nome: string
          ordine?: number
          owner_id: string
          updated_at?: string
        }
        Update: {
          attivo?: boolean
          created_at?: string
          id?: string
          nome?: string
          ordine?: number
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      concorrenti_pos: {
        Row: {
          attivo: boolean
          created_at: string
          id: string
          nome: string
          ordine: number
          owner_id: string
          updated_at: string
        }
        Insert: {
          attivo?: boolean
          created_at?: string
          id?: string
          nome: string
          ordine?: number
          owner_id: string
          updated_at?: string
        }
        Update: {
          attivo?: boolean
          created_at?: string
          id?: string
          nome?: string
          ordine?: number
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      esiti_lavorazione: {
        Row: {
          attivo: boolean
          created_at: string
          esito_positivo: boolean | null
          id: string
          is_chiusura: boolean
          nome: string
          ordine: number
          owner_id: string
          updated_at: string
        }
        Insert: {
          attivo?: boolean
          created_at?: string
          esito_positivo?: boolean | null
          id?: string
          is_chiusura?: boolean
          nome: string
          ordine?: number
          owner_id: string
          updated_at?: string
        }
        Update: {
          attivo?: boolean
          created_at?: string
          esito_positivo?: boolean | null
          id?: string
          is_chiusura?: boolean
          nome?: string
          ordine?: number
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      etichette_sede: {
        Row: {
          attivo: boolean
          created_at: string
          id: string
          nome: string
          ordine: number
          owner_id: string
          updated_at: string
        }
        Insert: {
          attivo?: boolean
          created_at?: string
          id?: string
          nome: string
          ordine?: number
          owner_id: string
          updated_at?: string
        }
        Update: {
          attivo?: boolean
          created_at?: string
          id?: string
          nome?: string
          ordine?: number
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      parametri_app: {
        Row: {
          chiave: string
          owner_id: string
          updated_at: string
          valore: Json
        }
        Insert: {
          chiave: string
          owner_id: string
          updated_at?: string
          valore: Json
        }
        Update: {
          chiave?: string
          owner_id?: string
          updated_at?: string
          valore?: Json
        }
        Relationships: []
      }
      parametri_target: {
        Row: {
          created_at: string
          id: string
          owner_id: string
          soglia_max_annua: number | null
          soglia_min_annua: number | null
          target: Database["public"]["Enums"]["target_lettera"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          owner_id: string
          soglia_max_annua?: number | null
          soglia_min_annua?: number | null
          target: Database["public"]["Enums"]["target_lettera"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          owner_id?: string
          soglia_max_annua?: number | null
          soglia_min_annua?: number | null
          target?: Database["public"]["Enums"]["target_lettera"]
          updated_at?: string
        }
        Relationships: []
      }
      ruoli_contatto: {
        Row: {
          attivo: boolean
          created_at: string
          id: string
          nome: string
          ordine: number
          owner_id: string
          updated_at: string
        }
        Insert: {
          attivo?: boolean
          created_at?: string
          id?: string
          nome: string
          ordine?: number
          owner_id: string
          updated_at?: string
        }
        Update: {
          attivo?: boolean
          created_at?: string
          id?: string
          nome?: string
          ordine?: number
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tipi_pos: {
        Row: {
          attivo: boolean
          created_at: string
          id: string
          nome: string
          ordine: number
          owner_id: string
          richiede_iban: boolean
          updated_at: string
        }
        Insert: {
          attivo?: boolean
          created_at?: string
          id?: string
          nome: string
          ordine?: number
          owner_id: string
          richiede_iban?: boolean
          updated_at?: string
        }
        Update: {
          attivo?: boolean
          created_at?: string
          id?: string
          nome?: string
          ordine?: number
          owner_id?: string
          richiede_iban?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      zone: {
        Row: {
          attivo: boolean
          colore: string | null
          created_at: string
          id: string
          nome: string
          note: string | null
          ordine: number
          owner_id: string
          updated_at: string
        }
        Insert: {
          attivo?: boolean
          colore?: string | null
          created_at?: string
          id?: string
          nome: string
          note?: string | null
          ordine?: number
          owner_id: string
          updated_at?: string
        }
        Update: {
          attivo?: boolean
          colore?: string | null
          created_at?: string
          id?: string
          nome?: string
          note?: string | null
          ordine?: number
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      zone_cap: {
        Row: {
          cap: string
          comune: string | null
          created_at: string
          id: string
          owner_id: string
          zona_id: string
        }
        Insert: {
          cap: string
          comune?: string | null
          created_at?: string
          id?: string
          owner_id: string
          zona_id: string
        }
        Update: {
          cap?: string
          comune?: string | null
          created_at?: string
          id?: string
          owner_id?: string
          zona_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_cap_zona_id_fkey"
            columns: ["zona_id"]
            isOneToOne: false
            referencedRelation: "zone"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      applica_rls_owner: { Args: { p_tabella: string }; Returns: undefined }
      param_int: {
        Args: { p_chiave: string; p_default: number }
        Returns: number
      }
      seed_vocabolari: { Args: { p_owner: string }; Returns: undefined }
      suggerisci_target: {
        Args: { p_fatturato_mensile: number }
        Returns: Database["public"]["Enums"]["target_lettera"]
      }
    }
    Enums: {
      brand: "NEXI" | "HERA_COMM"
      fonte_lead: "import_excel" | "self_gen" | "call_center_nexi"
      merge_mode: "sovrascrivi" | "lascia" | "integra"
      provenienza_contatto: "mail_call_center" | "import_excel" | "manuale"
      stato_appuntamento: "pianificato" | "fatto" | "annullato"
      stato_audio: "da_integrare" | "integrato"
      stato_lead:
        | "da_contattare"
        | "in_lavorazione"
        | "chiuso_vinto"
        | "chiuso_perso"
      stato_offerta: "attiva" | "archiviata"
      target_lettera: "E" | "A" | "B" | "C"
      tipo_allegato: "foto" | "documento" | "audio"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      brand: ["NEXI", "HERA_COMM"],
      fonte_lead: ["import_excel", "self_gen", "call_center_nexi"],
      merge_mode: ["sovrascrivi", "lascia", "integra"],
      provenienza_contatto: ["mail_call_center", "import_excel", "manuale"],
      stato_appuntamento: ["pianificato", "fatto", "annullato"],
      stato_audio: ["da_integrare", "integrato"],
      stato_lead: [
        "da_contattare",
        "in_lavorazione",
        "chiuso_vinto",
        "chiuso_perso",
      ],
      stato_offerta: ["attiva", "archiviata"],
      target_lettera: ["E", "A", "B", "C"],
      tipo_allegato: ["foto", "documento", "audio"],
    },
  },
} as const
