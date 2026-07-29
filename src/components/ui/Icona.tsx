import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeft,
  ArrowUpDown,
  Bell,
  Blocks,
  Building2,
  Calendar,
  CalendarDays,
  Camera,
  ChartColumn,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock,
  Copy,
  CreditCard,
  Download,
  Euro,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Gem,
  Hand,
  IdCard,
  Info,
  Landmark,
  LayoutDashboard,
  Lightbulb,
  LoaderCircle,
  LogOut,
  Mail,
  Map,
  MapPin,
  Menu,
  MessageCircle,
  Mic,
  Navigation,
  Paperclip,
  Pencil,
  Phone,
  Plus,
  Printer,
  ReceiptText,
  RefreshCw,
  Save,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Shuffle,
  Signal,
  Sparkles,
  Star,
  Tags,
  Target,
  Trash2,
  TriangleAlert,
  Upload,
  User,
  Users,
  Wallet,
  X,
} from 'lucide-react'

/**
 * Una sola famiglia di icone per tutta l'app (§"no emoji come icone").
 *
 * I nomi sono SEMANTICI, non descrivono il disegno: si chiede `agenda`, non
 * `calendario-con-i-puntini`. Cosi' cambiare il disegno di un concetto e' una
 * riga qui e zero righe altrove — esattamente come per i colori.
 *
 * Nessun file fuori da questo importa `lucide-react`: il resto dell'app
 * conosce solo `<Icona nome="..." />`.
 */
const REGISTRO = {
  // ---- navigazione principale
  cruscotto: LayoutDashboard,
  agenda: Calendar,
  settimana: CalendarDays,
  lead: Users,
  report: ChartColumn,
  configurazione: Settings,
  aree: Map,
  importa: Upload,
  esci: LogOut,
  menu: Menu,

  // ---- sezioni di Configurazione
  agente: IdCard,
  offerte: FileText,
  target: Target,
  zone: Map,
  vocabolari: Tags,
  campi: Blocks,
  notifiche: Bell,
  backup: ShieldCheck,

  // ---- schede dell'intervista NEXI
  pos: CreditCard,
  multipos: Shuffle,
  amex: Gem,
  costi: ReceiptText,
  operativita: Signal,
  banca: Landmark,

  // ---- azioni
  chiudi: X,
  aggiungi: Plus,
  elimina: Trash2,
  modifica: Pencil,
  salva: Save,
  conferma: Check,
  cerca: Search,
  filtra: Filter,
  ordina: ArrowUpDown,
  aggiorna: RefreshCw,
  scarica: Download,
  copia: Copy,
  esterno: ExternalLink,
  stampa: Printer,
  invia: Send,
  indietro: ArrowLeft,
  precedente: ChevronLeft,
  successivo: ChevronRight,
  espandi: ChevronDown,
  mostra: Eye,

  // ---- condivisione e contatto
  telefono: Phone,
  messaggio: MessageCircle,
  mail: Mail,
  mappa: MapPin,
  naviga: Navigation,

  // ---- contenuto
  allegato: Paperclip,
  foto: Camera,
  microfono: Mic,
  azienda: Building2,
  persona: User,
  euro: Euro,
  portafoglio: Wallet,
  orologio: Clock,
  stella: Star,
  foglio: FileSpreadsheet,
  documento: FileText,
  autonomo: Hand,

  // ---- feedback
  info: Info,
  avviso: TriangleAlert,
  errore: CircleAlert,
  successo: CircleCheck,
  suggerimento: Lightbulb,
  magia: Sparkles,
  caricamento: LoaderCircle,
} satisfies Record<string, LucideIcon>

export type NomeIcona = keyof typeof REGISTRO

/** Misure ancorate alla scala tipografica: mai valori arbitrari. */
const MISURE = { sm: 16, md: 20, lg: 24 } as const

type Props = {
  nome: NomeIcona
  misura?: keyof typeof MISURE
  className?: string
  /**
   * Testo alternativo. Ometterlo (il caso normale) rende l'icona invisibile
   * agli screen reader: se accompagna del testo sarebbe una ripetizione, e se
   * e' sola l'etichetta va sul bottone, non sull'icona.
   */
  titolo?: string
}

export function Icona({ nome, misura = 'md', className = '', titolo }: Props) {
  const Disegno = REGISTRO[nome]
  return (
    <Disegno
      size={MISURE[misura]}
      /* Tratto unico per tutta l'app: spessori misti sono il difetto piu'
         visibile di un set di icone messo insieme a pezzi. */
      strokeWidth={1.75}
      className={`shrink-0 ${className}`}
      aria-hidden={titolo ? undefined : true}
      role={titolo ? 'img' : undefined}
      aria-label={titolo}
    />
  )
}

/** Rotellina di attesa: stessa icona ovunque, stessa velocita' ovunque. */
export function Rotellina({
  misura = 'md',
  className = '',
}: {
  misura?: keyof typeof MISURE
  className?: string
}) {
  return (
    <Icona
      nome="caricamento"
      misura={misura}
      className={`animate-rotazione ${className}`}
    />
  )
}
