// useVoice.js — reusable speech recognition hook for MIH
// Adapted from remember-all.html voice implementation
// Behaviour: populates text field, NEVER auto-submits

import { useState, useRef, useEffect } from 'react'

export default function useVoice(setValue) {
  const [recording, setRecording] = useState(false)
  const recRef   = useRef(null)
  const finalRef = useRef('')
  const timerRef = useRef(null)

  // Animated bar heights state
  const [bars, setBars] = useState(() => Array(14).fill(4))

  const startBars = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setBars(Array.from({ length: 14 }, () => Math.floor(Math.random() * 20 + 4)))
    }, 120)
  }

  const stopBars = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    setBars(Array(14).fill(4))
  }

  const start = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Voice input is not supported on this browser.'); return }
    finalRef.current = ''
    setValue('')
    const rec = new SR()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-GB'
    rec.onresult = (e) => {
      let fin = '', interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) fin += e.results[i][0].transcript + ' '
        else interim += e.results[i][0].transcript
      }
      if (fin) finalRef.current += fin
      setValue((finalRef.current + interim).trim())
    }
    rec.onend = () => {
      // Keep listening until Done or Cancel
      if (recRef.current) {
        try { recRef.current.start() } catch (err) {}
      }
    }
    recRef.current = rec
    rec.start()
    setRecording(true)
    startBars()
  }

  const done = () => {
    if (recRef.current) { try { recRef.current.stop() } catch (e) {} }
    recRef.current = null
    setRecording(false)
    stopBars()
    // Leave text in field — user reviews and submits manually
  }

  const cancel = () => {
    if (recRef.current) { try { recRef.current.stop() } catch (e) {} }
    recRef.current = null
    setRecording(false)
    stopBars()
    setValue('')
  }

  // Clean up on unmount
  useEffect(() => () => {
    if (recRef.current) { try { recRef.current.stop() } catch (e) {} }
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  return { recording, bars, start, done, cancel }
}
