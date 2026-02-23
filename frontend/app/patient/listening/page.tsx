"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Play, Loader2, FileText, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

type TranscriptionResult = {
  id: string
  date: string
  duration?: string
  transcript: string
  summary: string
  emotions: string[]
}

export default function ListeningPage() {
  const { token, isAuthenticated } = useAuth()

  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const [pastSessions, setPastSessions] = useState<TranscriptionResult[]>([])
  const [currentResult, setCurrentResult] = useState<TranscriptionResult | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop()
      }
    }
  }, [isRecording])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const startRecording = async () => {
    try {
      setError(null)
      setCurrentResult(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop())
        await processAudio(new Blob(chunksRef.current, { type: 'audio/webm' }))
      }

      mediaRecorder.start(1000) // Collect 1-second chunks
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (err) {
      console.error("Error accessing microphone:", err)
      setError("Could not access microphone. Please ensure permissions are granted.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const processAudio = async (audioBlob: Blob) => {
    if (!token) {
      setError("Authentication required.")
      return
    }

    setIsProcessing(true)
    try {
      // Create form data matching backend expectations
      const formData = new FormData()
      formData.append("files", audioBlob, "recording.webm")
      formData.append("speakers", "Patient")
      formData.append("mental_health_only", "true")

      const res = await fetch("/api/v1/patient/listening/transcribe-summarize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || "Failed to process audio")
      }

      const data = await res.json()

      // The backend agent summary is a markdown string.
      const newSession: TranscriptionResult = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        duration: formatTime(recordingTime),
        transcript: data.transcript,
        summary: data.summary,
        emotions: ["Processing"] // Real emotion extraction could be added to backend
      }

      setCurrentResult(newSession)
      setPastSessions(prev => [newSession, ...prev])

    } catch (err: any) {
      console.error("Processing error:", err)
      setError(err.message || "An error occurred while analyzing the audio.")
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isAuthenticated) return null

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Listening Agent
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Voice transcription with AI-generated clinical summaries
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-md bg-destructive/10 text-destructive border border-destructive/20 text-sm">
          {error}
        </div>
      )}

      {/* Recording Interface */}
      <Card className="mb-8">
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center">
            <button
              onClick={isProcessing ? undefined : handleToggleRecording}
              disabled={isProcessing}
              className={`flex h-24 w-24 items-center justify-center rounded-full transition-all duration-300 ${isRecording
                  ? "bg-destructive text-destructive-foreground animate-pulse hover:bg-destructive/90"
                  : isProcessing
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-foreground text-background hover:opacity-90"
                }`}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
              {isProcessing ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : isRecording ? (
                <MicOff className="h-8 w-8" />
              ) : (
                <Mic className="h-8 w-8" />
              )}
            </button>

            <p className="mt-6 text-sm font-medium text-foreground">
              {isRecording
                ? "Listening... Speak freely."
                : isProcessing
                  ? "Analyzing recording..."
                  : "Tap to start speaking"}
            </p>

            <p className="text-xs text-muted-foreground mt-1">
              {isRecording
                ? `Recording time: ${formatTime(recordingTime)}`
                : isProcessing
                  ? "Running Whisper transcription and clinical summarization"
                  : "Your recordings are private and encrypted end-to-end."}
            </p>

            {isRecording && (
              <div className="flex items-center gap-1.5 mt-6 h-8">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-destructive rounded-full animate-pulse"
                    style={{
                      height: `${Math.random() * 24 + 12}px`,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current/Latest Result */}
      {currentResult && (
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Session Analysis Complete
          </h2>
          <Card className="border-green-500/20 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Transcript</p>
                <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap font-mono text-muted-foreground">
                  {currentResult.transcript}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-foreground" />
                  <span className="text-xs font-semibold uppercase text-foreground">AI Clinical Summary</span>
                </div>
                <div className="p-4 bg-primary/5 rounded-md text-sm whitespace-pre-wrap leading-relaxed border border-primary/10">
                  {currentResult.summary}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Past Transcriptions */}
      {pastSessions.length > (currentResult ? 1 : 0) && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Previous Sessions in Browser Memory
          </h2>
          <div className="space-y-4">
            {pastSessions.filter(s => s.id !== currentResult?.id).map((t) => (
              <Card key={t.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {t.date}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Duration: {t.duration}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-foreground">
                        AI Summary
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap max-h-32 overflow-hidden relative">
                      {t.summary}
                      <span className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-muted to-transparent"></span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
