import { useCallback, useEffect, useState } from 'react'
import { messaggioErrore } from '@/lib/errors'
import {
  pushSupportato,
  installataStandalone,
  iscrivi,
  iscrizioneCorrente,
} from './push'
import { salvaSubscription, eliminaSubscription, inviaNotificaProva } from './api'

export function useNotifiche() {
  const supportato = pushSupportato()
  const standalone = installataStandalone()
  const [iscritto, setIscritto] = useState(false)
  const [caricamento, setCaricamento] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)
  const [esito, setEsito] = useState<string | null>(null)

  useEffect(() => {
    if (!supportato) return
    iscrizioneCorrente()
      .then((s) => setIscritto(!!s))
      .catch(() => setIscritto(false))
  }, [supportato])

  const attiva = useCallback(async () => {
    setCaricamento(true)
    setErrore(null)
    setEsito(null)
    try {
      const sub = await iscrivi()
      await salvaSubscription(sub)
      setIscritto(true)
    } catch (e) {
      setErrore(messaggioErrore(e))
    } finally {
      setCaricamento(false)
    }
  }, [])

  const disattiva = useCallback(async () => {
    setCaricamento(true)
    setErrore(null)
    try {
      const sub = await iscrizioneCorrente()
      if (sub) {
        await eliminaSubscription(sub.endpoint)
        await sub.unsubscribe()
      }
      setIscritto(false)
    } catch (e) {
      setErrore(messaggioErrore(e))
    } finally {
      setCaricamento(false)
    }
  }, [])

  const prova = useCallback(async () => {
    setErrore(null)
    setEsito(null)
    try {
      const r = await inviaNotificaProva()
      setEsito(`Inviata a ${r.inviate} dispositivo/i.`)
    } catch (e) {
      setErrore(messaggioErrore(e))
    }
  }, [])

  return { supportato, standalone, iscritto, caricamento, errore, esito, attiva, disattiva, prova }
}
