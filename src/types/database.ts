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
      stati_verifica: {
        Row: {
          attivo: boolean
          colore_bg: string | null
          colore_dot: string | null
          colore_fg: string | null
          created_at: string
          id: string
          nome: string
          ordine: number
          owner_id: string
          updated_at: string
          confermato: boolean
        }
        Insert: {
          attivo?: boolean
          colore_bg?: string | null
          colore_dot?: string | null
          colore_fg?: string | null
          created_at?: string
          id?: string
          nome: string
          ordine?: number
          owner_id: string
          updated_at?: string
          confermato?: boolean
        }
        Update: {
          attivo?: boolean
          colore_bg?: string | null
          colore_dot?: string | null
          colore_fg?: string | null
          created_at?: string
          id?: string
          nome?: string
          ordine?: number
          owner_id?: string
          updated_at?: string
          confermato?: boolean
        }
        Relationships: []
      }
      esigenze_pos: {
        Row: {
          attivo: boolean
          colore_bg: string | null
          colore_dot: string | null
          colore_fg: string | null
          created_at: string
          id: string
          nome: string
          ordine: number
          owner_id: string
          updated_at: string
        }
        Insert: {
          attivo?: boolean
          colore_bg?: string | null
          colore_dot?: string | null
          colore_fg?: string | null
          created_at?: string
          id?: string
          nome: string
          ordine?: number
          owner_id: string
          updated_at?: string
        }
        Update: {
          attivo?: boolean
          colore_bg?: string | null
          colore_dot?: string | null
          colore_fg?: string | null
          created_at?: string
          id?: string
          nome?: string
          ordine?: number
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profilo_agente: {
        Row: {
          area: string | null
          cell: string | null
          cognome: string | null
          created_at: string
          email: string | null
          indirizzo: string | null
          nome: string | null
          note: string | null
          owner_id: string
          tel: string | null
          updated_at: string
        }
        Insert: {
          area?: string | null
          cell?: string | null
          cognome?: string | null
          created_at?: string
          email?: string | null
          indirizzo?: string | null
          nome?: string | null
          note?: string | null
          owner_id: string
          tel?: string | null
          updated_at?: string
        }
        Update: {
          area?: string | null
          cell?: string | null
          cognome?: string | null
          created_at?: string
          email?: string | null
          indirizzo?: string | null
          nome?: string | null
          note?: string | null
          owner_id?: string
          tel?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      mandati: {
        Row: {
          admin: string | null
          area: string | null
          brand: Database["public"]["Enums"]["brand"]
          cell: string | null
          codice_agente: string | null
          created_at: string
          email: string | null
          firma: string | null
          id: string
          indirizzo: string | null
          note: string | null
          owner_id: string
          ragione_sociale: string | null
          referente: string | null
          tel: string | null
          updated_at: string
        }
        Insert: {
          admin?: string | null
          area?: string | null
          brand: Database["public"]["Enums"]["brand"]
          cell?: string | null
          codice_agente?: string | null
          created_at?: string
          email?: string | null
          firma?: string | null
          id?: string
          indirizzo?: string | null
          note?: string | null
          owner_id: string
          ragione_sociale?: string | null
          referente?: string | null
          tel?: string | null
          updated_at?: string
        }
        Update: {
          admin?: string | null
          area?: string | null
          brand?: Database["public"]["Enums"]["brand"]
          cell?: string | null
          codice_agente?: string | null
          created_at?: string
          email?: string | null
          firma?: string | null
          id?: string
          indirizzo?: string | null
          note?: string | null
          owner_id?: string
          ragione_sociale?: string | null
          referente?: string | null
          tel?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      zone_comune: {
        Row: {
          comune: string
          created_at: string
          id: string
          owner_id: string
          zona_id: string
        }
        Insert: {
          comune: string
          created_at?: string
          id?: string
          owner_id: string
          zona_id: string
        }
        Update: {
          comune?: string
          created_at?: string
          id?: string
          owner_id?: string
          zona_id?: string
        }
        Relationships: []
      }
      lead_esigenze: {
        Row: {
          created_at: string
          esigenza_id: string
          id: string
          lead_id: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          esigenza_id: string
          id?: string
          lead_id: string
          owner_id: string
        }
        Update: {
          created_at?: string
          esigenza_id?: string
          id?: string
          lead_id?: string
          owner_id?: string
        }
        Relationships: []
      }
      campi_config: {
        Row: {
          attivo: boolean
          brand: Database["public"]["Enums"]["brand"]
          created_at: string
          etichetta: string
          id: string
          opzioni: Json
          ordine: number
          owner_id: string
          sezione: string
          tipo: Database["public"]["Enums"]["tipo_campo"]
          updated_at: string
        }
        Insert: {
          attivo?: boolean
          brand: Database["public"]["Enums"]["brand"]
          created_at?: string
          etichetta: string
          id?: string
          opzioni?: Json
          ordine?: number
          owner_id: string
          sezione?: string
          tipo?: Database["public"]["Enums"]["tipo_campo"]
          updated_at?: string
        }
        Update: {
          attivo?: boolean
          brand?: Database["public"]["Enums"]["brand"]
          created_at?: string
          etichetta?: string
          id?: string
          opzioni?: Json
          ordine?: number
          owner_id?: string
          sezione?: string
          tipo?: Database["public"]["Enums"]["tipo_campo"]
          updated_at?: string
        }
        Relationships: []
      }
      campi_valori: {
        Row: {
          campo_id: string
          created_at: string
          id: string
          lead_id: string
          owner_id: string
          updated_at: string
          valore: string | null
        }
        Insert: {
          campo_id: string
          created_at?: string
          id?: string
          lead_id: string
          owner_id: string
          updated_at?: string
          valore?: string | null
        }
        Update: {
          campo_id?: string
          created_at?: string
          id?: string
          lead_id?: string
          owner_id?: string
          updated_at?: string
          valore?: string | null
        }
        Relationships: []
      }
      allegati: {
        Row: {
          created_at: string
          durata_sec: number | null
          file_eliminato_at: string | null
          id: string
          integrato_at: string | null
          lead_id: string
          nome_file: string | null
          owner_id: string
          stato: Database["public"]["Enums"]["stato_audio"] | null
          storage_path: string
          tipo: Database["public"]["Enums"]["tipo_allegato"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          durata_sec?: number | null
          file_eliminato_at?: string | null
          id?: string
          integrato_at?: string | null
          lead_id: string
          nome_file?: string | null
          owner_id: string
          stato?: Database["public"]["Enums"]["stato_audio"] | null
          storage_path: string
          tipo: Database["public"]["Enums"]["tipo_allegato"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          durata_sec?: number | null
          file_eliminato_at?: string | null
          id?: string
          integrato_at?: string | null
          lead_id?: string
          nome_file?: string | null
          owner_id?: string
          stato?: Database["public"]["Enums"]["stato_audio"] | null
          storage_path?: string
          tipo?: Database["public"]["Enums"]["tipo_allegato"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "allegati_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead"
            referencedColumns: ["id"]
          },
        ]
      }
      appuntamenti: {
        Row: {
          brand: Database["public"]["Enums"]["brand"] | null
          created_at: string
          durata_min: number
          fine: string
          id: string
          inizio: string
          lavorazione_id: string | null
          lead_id: string | null
          luogo: string | null
          note: string | null
          owner_id: string
          promemoria_inviato_at: string | null
          stato: Database["public"]["Enums"]["stato_appuntamento"]
          updated_at: string
        }
        Insert: {
          brand?: Database["public"]["Enums"]["brand"] | null
          created_at?: string
          durata_min: number
          fine: string
          id?: string
          inizio: string
          lavorazione_id?: string | null
          lead_id?: string | null
          luogo?: string | null
          note?: string | null
          owner_id: string
          promemoria_inviato_at?: string | null
          stato?: Database["public"]["Enums"]["stato_appuntamento"]
          updated_at?: string
        }
        Update: {
          brand?: Database["public"]["Enums"]["brand"] | null
          created_at?: string
          durata_min?: number
          fine?: string
          id?: string
          inizio?: string
          lavorazione_id?: string | null
          lead_id?: string | null
          luogo?: string | null
          note?: string | null
          owner_id?: string
          promemoria_inviato_at?: string | null
          stato?: Database["public"]["Enums"]["stato_appuntamento"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appuntamenti_lavorazione_id_fkey"
            columns: ["lavorazione_id"]
            isOneToOne: false
            referencedRelation: "lavorazioni"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appuntamenti_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead"
            referencedColumns: ["id"]
          },
        ]
      }
      azioni_successive: {
        Row: {
          colore_bg: string | null
          colore_fg: string | null
          colore_dot: string | null
          attivo: boolean
          created_at: string
          id: string
          nome: string
          ordine: number
          owner_id: string
          updated_at: string
        }
        Insert: {
          colore_bg?: string | null
          colore_fg?: string | null
          colore_dot?: string | null
          attivo?: boolean
          created_at?: string
          id?: string
          nome: string
          ordine?: number
          owner_id: string
          updated_at?: string
        }
        Update: {
          colore_bg?: string | null
          colore_fg?: string | null
          colore_dot?: string | null
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
          colore_bg: string | null
          colore_fg: string | null
          colore_dot: string | null
          attivo: boolean
          created_at: string
          id: string
          nome: string
          ordine: number
          owner_id: string
          updated_at: string
        }
        Insert: {
          colore_bg?: string | null
          colore_fg?: string | null
          colore_dot?: string | null
          attivo?: boolean
          created_at?: string
          id?: string
          nome: string
          ordine?: number
          owner_id: string
          updated_at?: string
        }
        Update: {
          colore_bg?: string | null
          colore_fg?: string | null
          colore_dot?: string | null
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
      contatti: {
        Row: {
          created_at: string
          email: string | null
          id: string
          lead_id: string
          nome: string
          note: string | null
          owner_id: string
          principale: boolean
          provenienza: Database["public"]["Enums"]["provenienza_contatto"]
          ruolo_id: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          lead_id: string
          nome: string
          note?: string | null
          owner_id: string
          principale?: boolean
          provenienza?: Database["public"]["Enums"]["provenienza_contatto"]
          ruolo_id?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          lead_id?: string
          nome?: string
          note?: string | null
          owner_id?: string
          principale?: boolean
          provenienza?: Database["public"]["Enums"]["provenienza_contatto"]
          ruolo_id?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contatti_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contatti_ruolo_id_fkey"
            columns: ["ruolo_id"]
            isOneToOne: false
            referencedRelation: "ruoli_contatto"
            referencedColumns: ["id"]
          },
        ]
      }
      esiti_lavorazione: {
        Row: {
          colore_bg: string | null
          colore_fg: string | null
          colore_dot: string | null
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
          colore_bg?: string | null
          colore_fg?: string | null
          colore_dot?: string | null
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
          colore_bg?: string | null
          colore_fg?: string | null
          colore_dot?: string | null
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
          colore_bg: string | null
          colore_fg: string | null
          colore_dot: string | null
          attivo: boolean
          created_at: string
          id: string
          nome: string
          ordine: number
          owner_id: string
          updated_at: string
        }
        Insert: {
          colore_bg?: string | null
          colore_fg?: string | null
          colore_dot?: string | null
          attivo?: boolean
          created_at?: string
          id?: string
          nome: string
          ordine?: number
          owner_id: string
          updated_at?: string
        }
        Update: {
          colore_bg?: string | null
          colore_fg?: string | null
          colore_dot?: string | null
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
      lavorazioni: {
        Row: {
          azione_successiva_id: string | null
          brand: Database["public"]["Enums"]["brand"]
          contatto_id: string | null
          created_at: string
          data_ora: string
          esito_id: string | null
          id: string
          lead_id: string
          note: string | null
          owner_id: string
          pos_richiesti: number | null
          updated_at: string
        }
        Insert: {
          azione_successiva_id?: string | null
          brand: Database["public"]["Enums"]["brand"]
          contatto_id?: string | null
          created_at?: string
          data_ora?: string
          esito_id?: string | null
          id?: string
          lead_id: string
          note?: string | null
          owner_id: string
          pos_richiesti?: number | null
          updated_at?: string
        }
        Update: {
          azione_successiva_id?: string | null
          brand?: Database["public"]["Enums"]["brand"]
          contatto_id?: string | null
          created_at?: string
          data_ora?: string
          esito_id?: string | null
          id?: string
          lead_id?: string
          note?: string | null
          owner_id?: string
          pos_richiesti?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lavorazioni_azione_successiva_id_fkey"
            columns: ["azione_successiva_id"]
            isOneToOne: false
            referencedRelation: "azioni_successive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lavorazioni_contatto_id_fkey"
            columns: ["contatto_id"]
            isOneToOne: false
            referencedRelation: "contatti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lavorazioni_esito_id_fkey"
            columns: ["esito_id"]
            isOneToOne: false
            referencedRelation: "esiti_lavorazione"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lavorazioni_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead"
            referencedColumns: ["id"]
          },
        ]
      }
      lead: {
        Row: {
          telefono: string | null
          cellulare: string | null
          pec: string | null
          forma_giuridica: string | null
          mcc: string | null
          psp_attuale: string | null
          orari: string | null
          n_punti_vendita: number | null
          proposta_offerta: string | null
          import_sessione: string | null
          verifica_id: string | null
          cap: string | null
          civico: string | null
          codice_fiscale: string | null
          comune: string | null
          created_at: string
          email: string | null
          fatturato_mensile: number | null
          fonte: Database["public"]["Enums"]["fonte_lead"]
          id: string
          indirizzo: string | null
          note: string | null
          offerta_consigliata_id: string | null
          owner_id: string
          piva: string | null
          provincia: string | null
          ragione_sociale: string
          sito_web: string | null
          target: Database["public"]["Enums"]["target_lettera"] | null
          updated_at: string
          zona_id: string | null
          zona_manuale: boolean
        }
        Insert: {
          telefono?: string | null
          cellulare?: string | null
          pec?: string | null
          forma_giuridica?: string | null
          mcc?: string | null
          psp_attuale?: string | null
          orari?: string | null
          n_punti_vendita?: number | null
          proposta_offerta?: string | null
          import_sessione?: string | null
          verifica_id?: string | null
          cap?: string | null
          civico?: string | null
          codice_fiscale?: string | null
          comune?: string | null
          created_at?: string
          email?: string | null
          fatturato_mensile?: number | null
          fonte?: Database["public"]["Enums"]["fonte_lead"]
          id?: string
          indirizzo?: string | null
          note?: string | null
          offerta_consigliata_id?: string | null
          owner_id: string
          piva?: string | null
          provincia?: string | null
          ragione_sociale: string
          sito_web?: string | null
          target?: Database["public"]["Enums"]["target_lettera"] | null
          updated_at?: string
          zona_id?: string | null
          zona_manuale?: boolean
        }
        Update: {
          telefono?: string | null
          cellulare?: string | null
          pec?: string | null
          forma_giuridica?: string | null
          mcc?: string | null
          psp_attuale?: string | null
          orari?: string | null
          n_punti_vendita?: number | null
          proposta_offerta?: string | null
          import_sessione?: string | null
          verifica_id?: string | null
          cap?: string | null
          civico?: string | null
          codice_fiscale?: string | null
          comune?: string | null
          created_at?: string
          email?: string | null
          fatturato_mensile?: number | null
          fonte?: Database["public"]["Enums"]["fonte_lead"]
          id?: string
          indirizzo?: string | null
          note?: string | null
          offerta_consigliata_id?: string | null
          owner_id?: string
          piva?: string | null
          provincia?: string | null
          ragione_sociale?: string
          sito_web?: string | null
          target?: Database["public"]["Enums"]["target_lettera"] | null
          updated_at?: string
          zona_id?: string | null
          zona_manuale?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "lead_offerta_consigliata_id_fkey"
            columns: ["offerta_consigliata_id"]
            isOneToOne: false
            referencedRelation: "offerte"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_zona_id_fkey"
            columns: ["zona_id"]
            isOneToOne: false
            referencedRelation: "zone"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_brand: {
        Row: {
          brand: Database["public"]["Enums"]["brand"]
          created_at: string
          id: string
          lead_id: string
          owner_id: string
          stato: Database["public"]["Enums"]["stato_lead"]
          updated_at: string
        }
        Insert: {
          brand: Database["public"]["Enums"]["brand"]
          created_at?: string
          id?: string
          lead_id: string
          owner_id: string
          stato?: Database["public"]["Enums"]["stato_lead"]
          updated_at?: string
        }
        Update: {
          brand?: Database["public"]["Enums"]["brand"]
          created_at?: string
          id?: string
          lead_id?: string
          owner_id?: string
          stato?: Database["public"]["Enums"]["stato_lead"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_brand_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_concorrenti: {
        Row: {
          concorrente_id: string
          created_at: string
          lead_id: string
          owner_id: string
        }
        Insert: {
          concorrente_id: string
          created_at?: string
          lead_id: string
          owner_id: string
        }
        Update: {
          concorrente_id?: string
          created_at?: string
          lead_id?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_concorrenti_concorrente_id_fkey"
            columns: ["concorrente_id"]
            isOneToOne: false
            referencedRelation: "concorrenti_pos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_concorrenti_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_nexi: {
        Row: {
          sicuro_no_nexi: boolean | null
          mai_stato_nexi: boolean | null
          piva_stessa_punti: boolean | null
          due_iban: boolean | null
          differenzia_pagamenti: boolean | null
          tasso_interesse: string | null
          commissioni_dettaglio: Json
          difficolta_agenzia: boolean | null
          storni: boolean | null
          interruzioni_servizio: boolean | null
          modalita_attuali: Json
          connettivita: string | null
          soddisfatto_banca: boolean | null
          cambio_banca: boolean | null
          amex_attivare: boolean | null
          amex_attivo: boolean | null
          amex_continuare: boolean | null
          canone_attuale: number | null
          commissioni_attuali: string | null
          created_at: string
          dcc_attivo: boolean | null
          extra_ue_valuta_estera: boolean | null
          lead_id: string
          ordini_telefonici: boolean | null
          owner_id: string
          rateale_interessato: boolean | null
          transazioni_fuori_sede: boolean | null
          transazioni_sotto_30: boolean | null
          updated_at: string
          vende_online: boolean | null
        }
        Insert: {
          sicuro_no_nexi?: boolean | null
          mai_stato_nexi?: boolean | null
          piva_stessa_punti?: boolean | null
          due_iban?: boolean | null
          differenzia_pagamenti?: boolean | null
          tasso_interesse?: string | null
          commissioni_dettaglio?: Json
          difficolta_agenzia?: boolean | null
          storni?: boolean | null
          interruzioni_servizio?: boolean | null
          modalita_attuali?: Json
          connettivita?: string | null
          soddisfatto_banca?: boolean | null
          cambio_banca?: boolean | null
          amex_attivare?: boolean | null
          amex_attivo?: boolean | null
          amex_continuare?: boolean | null
          canone_attuale?: number | null
          commissioni_attuali?: string | null
          created_at?: string
          dcc_attivo?: boolean | null
          extra_ue_valuta_estera?: boolean | null
          lead_id: string
          ordini_telefonici?: boolean | null
          owner_id: string
          rateale_interessato?: boolean | null
          transazioni_fuori_sede?: boolean | null
          transazioni_sotto_30?: boolean | null
          updated_at?: string
          vende_online?: boolean | null
        }
        Update: {
          sicuro_no_nexi?: boolean | null
          mai_stato_nexi?: boolean | null
          piva_stessa_punti?: boolean | null
          due_iban?: boolean | null
          differenzia_pagamenti?: boolean | null
          tasso_interesse?: string | null
          commissioni_dettaglio?: Json
          difficolta_agenzia?: boolean | null
          storni?: boolean | null
          interruzioni_servizio?: boolean | null
          modalita_attuali?: Json
          connettivita?: string | null
          soddisfatto_banca?: boolean | null
          cambio_banca?: boolean | null
          amex_attivare?: boolean | null
          amex_attivo?: boolean | null
          amex_continuare?: boolean | null
          canone_attuale?: number | null
          commissioni_attuali?: string | null
          created_at?: string
          dcc_attivo?: boolean | null
          extra_ue_valuta_estera?: boolean | null
          lead_id?: string
          ordini_telefonici?: boolean | null
          owner_id?: string
          rateale_interessato?: boolean | null
          transazioni_fuori_sede?: boolean | null
          transazioni_sotto_30?: boolean | null
          updated_at?: string
          vende_online?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_nexi_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "lead"
            referencedColumns: ["id"]
          },
        ]
      }
      liste_salvate: {
        Row: {
          colonne_export: Json | null
          created_at: string
          filtri: Json
          id: string
          nome: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          colonne_export?: Json | null
          created_at?: string
          filtri?: Json
          id?: string
          nome: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          colonne_export?: Json | null
          created_at?: string
          filtri?: Json
          id?: string
          nome?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      offerte: {
        Row: {
          categoria: string | null
          transato_min: number | null
          transato_max: number | null
          commissione: number | null
          target_cliente: string | null
          note: string | null
          testo_estratto: string | null
          nome_file: string | null
          versione: number
          sostituisce_id: string | null
          brand: Database["public"]["Enums"]["brand"]
          canone: number | null
          created_at: string
          descrizione: string | null
          id: string
          nome: string
          owner_id: string
          pdf_path: string | null
          stato: Database["public"]["Enums"]["stato_offerta"]
          target_max: Database["public"]["Enums"]["target_lettera"] | null
          target_min: Database["public"]["Enums"]["target_lettera"] | null
          updated_at: string
        }
        Insert: {
          categoria?: string | null
          transato_min?: number | null
          transato_max?: number | null
          commissione?: number | null
          target_cliente?: string | null
          note?: string | null
          testo_estratto?: string | null
          nome_file?: string | null
          versione?: number
          sostituisce_id?: string | null
          brand: Database["public"]["Enums"]["brand"]
          canone?: number | null
          created_at?: string
          descrizione?: string | null
          id?: string
          nome: string
          owner_id: string
          pdf_path?: string | null
          stato?: Database["public"]["Enums"]["stato_offerta"]
          target_max?: Database["public"]["Enums"]["target_lettera"] | null
          target_min?: Database["public"]["Enums"]["target_lettera"] | null
          updated_at?: string
        }
        Update: {
          categoria?: string | null
          transato_min?: number | null
          transato_max?: number | null
          commissione?: number | null
          target_cliente?: string | null
          note?: string | null
          testo_estratto?: string | null
          nome_file?: string | null
          versione?: number
          sostituisce_id?: string | null
          brand?: Database["public"]["Enums"]["brand"]
          canone?: number | null
          created_at?: string
          descrizione?: string | null
          id?: string
          nome?: string
          owner_id?: string
          pdf_path?: string | null
          stato?: Database["public"]["Enums"]["stato_offerta"]
          target_max?: Database["public"]["Enums"]["target_lettera"] | null
          target_min?: Database["public"]["Enums"]["target_lettera"] | null
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
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          owner_id: string
          p256dh: string
          user_agent: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          owner_id: string
          p256dh: string
          user_agent?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          owner_id?: string
          p256dh?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      ruoli_contatto: {
        Row: {
          colore_bg: string | null
          colore_fg: string | null
          colore_dot: string | null
          attivo: boolean
          created_at: string
          id: string
          nome: string
          ordine: number
          owner_id: string
          updated_at: string
        }
        Insert: {
          colore_bg?: string | null
          colore_fg?: string | null
          colore_dot?: string | null
          attivo?: boolean
          created_at?: string
          id?: string
          nome: string
          ordine?: number
          owner_id: string
          updated_at?: string
        }
        Update: {
          colore_bg?: string | null
          colore_fg?: string | null
          colore_dot?: string | null
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
      sedi: {
        Row: {
          principale: boolean
          consegna_pos: boolean
          cap: string | null
          civico: string | null
          comune: string | null
          created_at: string
          etichetta_id: string | null
          id: string
          indirizzo: string | null
          lead_id: string
          nome: string | null
          note: string | null
          owner_id: string
          provincia: string | null
          slot: number
          updated_at: string
        }
        Insert: {
          principale?: boolean
          consegna_pos?: boolean
          cap?: string | null
          civico?: string | null
          comune?: string | null
          created_at?: string
          etichetta_id?: string | null
          id?: string
          indirizzo?: string | null
          lead_id: string
          nome?: string | null
          note?: string | null
          owner_id: string
          provincia?: string | null
          slot: number
          updated_at?: string
        }
        Update: {
          principale?: boolean
          consegna_pos?: boolean
          cap?: string | null
          civico?: string | null
          comune?: string | null
          created_at?: string
          etichetta_id?: string | null
          id?: string
          indirizzo?: string | null
          lead_id?: string
          nome?: string | null
          note?: string | null
          owner_id?: string
          provincia?: string | null
          slot?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sedi_etichetta_id_fkey"
            columns: ["etichetta_id"]
            isOneToOne: false
            referencedRelation: "etichette_sede"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sedi_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead"
            referencedColumns: ["id"]
          },
        ]
      }
      sedi_pos: {
        Row: {
          quantita: number
          esigenza_id: string | null
          differenzia_pagamenti: boolean | null
          amex: boolean | null
          created_at: string
          iban: string | null
          id: string
          note: string | null
          owner_id: string
          sede_id: string
          seriale: string | null
          tipo_pos_id: string | null
          updated_at: string
        }
        Insert: {
          quantita?: number
          esigenza_id?: string | null
          differenzia_pagamenti?: boolean | null
          amex?: boolean | null
          created_at?: string
          iban?: string | null
          id?: string
          note?: string | null
          owner_id: string
          sede_id: string
          seriale?: string | null
          tipo_pos_id?: string | null
          updated_at?: string
        }
        Update: {
          quantita?: number
          esigenza_id?: string | null
          differenzia_pagamenti?: boolean | null
          amex?: boolean | null
          created_at?: string
          iban?: string | null
          id?: string
          note?: string | null
          owner_id?: string
          sede_id?: string
          seriale?: string | null
          tipo_pos_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sedi_pos_sede_id_fkey"
            columns: ["sede_id"]
            isOneToOne: false
            referencedRelation: "sedi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sedi_pos_tipo_pos_id_fkey"
            columns: ["tipo_pos_id"]
            isOneToOne: false
            referencedRelation: "tipi_pos"
            referencedColumns: ["id"]
          },
        ]
      }
      tipi_pos: {
        Row: {
          colore_bg: string | null
          colore_fg: string | null
          colore_dot: string | null
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
          colore_bg?: string | null
          colore_fg?: string | null
          colore_dot?: string | null
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
          colore_bg?: string | null
          colore_fg?: string | null
          colore_dot?: string | null
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
      lead_simili: {
        Args: { p_cap?: string; p_nome: string; p_soglia?: number }
        Returns: {
          cap: string
          id: string
          ragione_sociale: string
          similarita: number
        }[]
      }
      param_int: {
        Args: { p_chiave: string; p_default: number }
        Returns: number
      }
      ricalcola_stato_lead: {
        Args: { p_brand: Database["public"]["Enums"]["brand"]; p_lead: string }
        Returns: undefined
      }
      seed_vocabolari: { Args: { p_owner: string }; Returns: undefined }
      suggerisci_target: {
        Args: { p_fatturato_mensile: number }
        Returns: Database["public"]["Enums"]["target_lettera"]
      }
    }
    Enums: {
      tipo_campo: "testo" | "numero" | "si_no" | "tendina" | "data"
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
