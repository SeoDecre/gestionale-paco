import type { Database } from './database'

/**
 * Scorciatoie sui tipi generati da Supabase. Il codice feature usa questi
 * (`Riga<'lead'>`, `Enum<'brand'>`) invece del percorso completo, così se lo
 * schema cambia si rigenera database.ts e i tipi si propagano da soli.
 */
export type Riga<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Inserimento<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type Aggiornamento<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type Enum<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]
