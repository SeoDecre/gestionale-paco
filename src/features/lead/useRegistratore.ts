import { useCallback, useRef, useState } from 'react'

/**
 * Registratore audio in-app (§5, "Memo vocale"). Usa MediaRecorder → blob, che
 * poi si carica su Storage. Niente librerie esterne. Su iOS il permesso
 * microfono è chiesto al primo avvio; se negato, `errore` viene valorizzato.
 */
export type StatoRegistrazione = 'idle' | 'in_corso' | 'pronto'

export type RisultatoRegistrazione = {
  blob: Blob
  estensione: string
  durataSec: number
}

export function useRegistratore() {
  const [stato, setStato] = useState<StatoRegistrazione>('idle')
  const [errore, setErrore] = useState<string | null>(null)
  const [secondi, setSecondi] = useState(0)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const inizioRef = useRef(0)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const pulisci = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current)
    tickRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const avvia = useCallback(async () => {
    setErrore(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      const rec = new MediaRecorder(stream)
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      rec.start()
      recorderRef.current = rec
      inizioRef.current = Date.now()
      setSecondi(0)
      tickRef.current = setInterval(
        () => setSecondi(Math.floor((Date.now() - inizioRef.current) / 1000)),
        250,
      )
      setStato('in_corso')
    } catch {
      setErrore('Microfono non disponibile o permesso negato.')
      pulisci()
    }
  }, [pulisci])

  /** Ferma e restituisce il risultato (blob + durata). */
  const ferma = useCallback((): Promise<RisultatoRegistrazione> => {
    return new Promise((resolve, reject) => {
      const rec = recorderRef.current
      if (!rec) return reject(new Error('Nessuna registrazione in corso.'))
      rec.onstop = () => {
        const tipo = rec.mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type: tipo })
        const durataSec = Math.max(1, Math.round((Date.now() - inizioRef.current) / 1000))
        const estensione = tipo.includes('mp4') ? 'm4a' : 'webm'
        pulisci()
        setStato('pronto')
        resolve({ blob, estensione, durataSec })
      }
      rec.stop()
    })
  }, [pulisci])

  const annulla = useCallback(() => {
    try {
      recorderRef.current?.stop()
    } catch {
      /* già fermo */
    }
    pulisci()
    setStato('idle')
    setSecondi(0)
  }, [pulisci])

  return { stato, errore, secondi, avvia, ferma, annulla }
}
