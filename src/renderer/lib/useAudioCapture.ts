import { useEffect, useRef } from 'react'

/**
 * Hook that bridges main-process audio capture commands with the
 * browser's MediaRecorder API.
 *
 * Flow:
 *   main sends "audio:start" → we getUserMedia + start MediaRecorder
 *   MediaRecorder ondataavailable → sendAudioChunk to main
 *   main sends "audio:stop"  → we stop MediaRecorder + release stream
 */
export function useAudioCapture(): void {
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!window.recon) return

    const cleanups: (() => void)[] = []

    cleanups.push(
      window.recon.onAudioStart(async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          streamRef.current = stream

          const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
          recorderRef.current = recorder

          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              e.data.arrayBuffer().then((buf) => {
                window.recon?.sendAudioChunk(buf)
              })
            }
          }

          // Send chunks every 250ms for smooth streaming
          recorder.start(250)
        } catch (err) {
          console.error('Audio capture failed:', err)
        }
      })
    )

    cleanups.push(
      window.recon.onAudioStop(() => {
        const recorder = recorderRef.current
        if (recorder && recorder.state !== 'inactive') {
          // Wait for the final dataavailable event before signaling stopped
          recorder.onstop = () => {
            window.recon?.sendAudioStopped()
          }
          recorder.stop()
        } else {
          window.recon?.sendAudioStopped()
        }
        recorderRef.current = null

        // Release microphone
        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      })
    )

    return () => {
      // Cleanup on unmount
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop()
      }
      streamRef.current?.getTracks().forEach((t) => t.stop())
      cleanups.forEach((fn) => fn())
    }
  }, [])
}
