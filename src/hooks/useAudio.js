import { useRef, useCallback } from 'react'

export function useAudio() {
  const ctxRef         = useRef(null)
  const gainRef        = useRef(null)
  const bgSourceRef    = useRef(null)
  const bgBufferRef    = useRef(null)
  const chimeBufferRef = useRef(null)
  const loadedSndRef   = useRef(null)

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      gainRef.current = ctxRef.current.createGain()
      gainRef.current.gain.value = 0.8
      gainRef.current.connect(ctxRef.current.destination)
    }
    return ctxRef.current
  }, [])

  // ── Decode a file ─────────────────────────────
  const decodeFile = useCallback(async (url) => {
    const ctx = getCtx()
    const res = await fetch(url)
    const buf = await res.arrayBuffer()
    return ctx.decodeAudioData(buf)
  }, [getCtx])

  // ── Preload sound files in background (call on setup screen mount) ──
  const preload = useCallback(async (soundKey) => {
    // Load chime if not already loaded
    if (!chimeBufferRef.current) {
      try { chimeBufferRef.current = await decodeFile('/chime.mp3') } catch(e) { console.warn('chime load fail', e) }
    }
    // Load background sound if not already loaded
    if (soundKey && soundKey !== 'silence' && loadedSndRef.current !== soundKey) {
      const urlMap = {
        'piano':                '/piano.mp3',
        'soothing-fire':        '/soothing-fire.mp3',
        'bonfire':              '/bonfire.mp3',
        'ocean-waves':          '/ocean-waves.mp3',
        'beach-waves':          '/beach-waves.mp3',
        'gentle-wind':          '/gentle-wind.mp3',
        'rain':                 '/rain.mp3',
        'birds-morning-breeze': '/birds.mp3',
        'stream':               '/stream.mp3',
        'stream-gentle':        '/stream-gentle.mp3',
      }
      const url = urlMap[soundKey]
      if (url) {
        try {
          bgBufferRef.current = await decodeFile(url)
          loadedSndRef.current = soundKey
        } catch(e) { console.warn('bg load fail', e) }
      }
    }
  }, [decodeFile])

  // ── Unlock + resume AudioContext (call synchronously in gesture) ──
  const unlock = useCallback(() => {
    const ctx = getCtx()
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  }, [getCtx])

  // ── Start looping background — call after unlock() in gesture ──
  const startBackground = useCallback((soundKey) => {
    if (!soundKey || soundKey === 'silence') return
    const ctx = getCtx()

    const play = (buffer) => {
      if (bgSourceRef.current) {
        try { bgSourceRef.current.stop() } catch {}
        bgSourceRef.current = null
      }
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.loop = true
      source.connect(gainRef.current)
      source.start(0)
      bgSourceRef.current = source
    }

    // If already loaded, play immediately
    if (bgBufferRef.current && loadedSndRef.current === soundKey) {
      play(bgBufferRef.current)
      return
    }

    // Otherwise load then play
    const urlMap = {
      'piano':                '/piano.mp3',
      'soothing-fire':        '/soothing-fire.mp3',
      'bonfire':              '/bonfire.mp3',
      'ocean-waves':          '/ocean-waves.mp3',
      'beach-waves':          '/beach-waves.mp3',
      'gentle-wind':          '/gentle-wind.mp3',
      'rain':                 '/rain.mp3',
      'birds-morning-breeze': '/birds.mp3',
      'stream':               '/stream.mp3',
      'stream-gentle':        '/stream-gentle.mp3',
    }
    const url = urlMap[soundKey]
    if (!url) return
    decodeFile(url).then(buffer => {
      bgBufferRef.current = buffer
      loadedSndRef.current = soundKey
      play(buffer)
    }).catch(e => console.warn('bg load fail', e))
  }, [getCtx, decodeFile])

  // ── Stop background ──────────────────────────
  const stopBackground = useCallback(() => {
    if (bgSourceRef.current) {
      try { bgSourceRef.current.stop() } catch {}
      bgSourceRef.current = null
    }
  }, [])

  // ── Play chime — call after unlock() in gesture ──
  const playChime = useCallback(() => {
    if (!chimeBufferRef.current) return
    const ctx = getCtx()
    const source = ctx.createBufferSource()
    source.buffer = chimeBufferRef.current
    source.connect(gainRef.current)
    source.start(0)
  }, [getCtx])

  // ── Fade out ─────────────────────────────────
  const fadeOut = useCallback((durationMs = 2000) => {
    return new Promise(resolve => {
      if (!gainRef.current || !ctxRef.current) { resolve(); return }
      const ctx = ctxRef.current
      const gain = gainRef.current.gain
      const now = ctx.currentTime
      gain.setValueAtTime(gain.value, now)
      gain.linearRampToValueAtTime(0, now + durationMs / 1000)
      setTimeout(() => {
        gain.setValueAtTime(0.8, ctx.currentTime)
        resolve()
      }, durationMs + 50)
    })
  }, [])

  return { unlock, preload, startBackground, stopBackground, playChime, fadeOut }
}
