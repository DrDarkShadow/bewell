"use client"

import { useRouter } from "next/navigation"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot, User } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

type Message = {
  id: string | number
  role: "user" | "ai"
  content: string
  emotion?: string
  timestamp: string
}

type EmotionData = {
  emotion: string
  intensity: number
  time: string
}

export default function CompanionPage() {
  const router = useRouter()
  const { token, isAuthenticated, logout } = useAuth()
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [emotionTimeline, setEmotionTimeline] = useState<EmotionData[]>([])
  const [currentEmotion, setCurrentEmotion] = useState<{ emotion: string; score: number } | null>(null)

  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const overallState = emotionTimeline.length > 0 ? {
    emotion: Object.entries(emotionTimeline.reduce((acc, curr) => {
      acc[curr.emotion] = (acc[curr.emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)).sort((a, b) => b[1] - a[1])[0][0],
    score: Math.round(emotionTimeline.reduce((acc, curr) => acc + curr.intensity, 0) / emotionTimeline.length)
  } : null;

  // Start or resume chat session on mount
  useEffect(() => {
    if (!isAuthenticated || !token) return

    const startOrResumeSession = async () => {
      const existingConvId = sessionStorage.getItem("activeConversationId")

      if (existingConvId) {
        setConversationId(existingConvId)
        try {
          // Fetch existing history
          const res = await fetch(`/api/v1/patient/chat/${existingConvId}/history`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (res.ok) {
            const data = await res.json()
            if (data.messages && data.messages.length > 0) {
              setMessages(data.messages.map((m: any) => ({
                id: m.id,
                role: m.sender === "patient" ? "user" : "ai",
                content: m.content,
                timestamp: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
                emotion: m.emotion_score?.emotions?.primary_emotion || undefined
              })))
              return // Successfully resumed
            }
          } else if (res.status === 401) {
            logout()
            return
          }
        } catch (err) {
          console.error("Failed to fetch chat history", err)
        }
      }

      // Start new session if no existing one or fetch failed
      try {
        const res = await fetch("/api/v1/patient/chat/start", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        })
        if (res.ok) {
          const data = await res.json()
          setConversationId(data.conversation_id)
          sessionStorage.setItem("activeConversationId", data.conversation_id)
          setMessages([
            {
              id: "welcome",
              role: "ai",
              content: "Hello. I'm here whenever you're ready to talk. There's no pressure -- take your time. How are you feeling today?",
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            }
          ])
        } else if (res.status === 401) {
          logout()
          return
        }
      } catch (err) {
        console.error("Failed to start chat session", err)
      }
    }

    startOrResumeSession()
  }, [isAuthenticated, token])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || !conversationId || !token) return

    const userText = input
    setInput("")

    const userMsg: Message = {
      id: Date.now(),
      role: "user",
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
    setMessages((prev) => [...prev, userMsg])
    setIsTyping(true)

    try {
      const res = await fetch(`/api/v1/patient/chat/${conversationId}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: userText })
      })

      if (res.ok) {
        const data = await res.json()

        // Add AI response
        const aiMsg: Message = {
          id: data.ai_message.id,
          role: "ai",
          content: data.ai_message.content,
          timestamp: new Date(data.ai_message.timestamp || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }

        // Add emotion badge to user message if provided
        if (data.emotion && data.emotion.dominant_emotion) {
          setMessages(prev => prev.map(m =>
            m.id === userMsg.id ? { ...m, emotion: data.emotion.dominant_emotion } : m
          ))

          setCurrentEmotion({
            emotion: data.emotion.dominant_emotion,
            score: Math.round(data.emotion.confidence * 100)
          })

          setEmotionTimeline(prev => [...prev, {
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            emotion: data.emotion.dominant_emotion,
            intensity: Math.round(data.emotion.confidence * 100)
          }])
        }

        setMessages((prev) => [...prev, aiMsg])
      } else {
        // Fallback error message
        setMessages((prev) => [...prev, {
          id: Date.now(),
          role: "ai",
          content: "Sorry, I'm having trouble connecting to the server. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsTyping(false)
    }
  }

  if (!isAuthenticated) return null

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-screen">
      {/* Chat Area */}
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              AI Companion
            </h1>
            <p className="text-xs text-muted-foreground">
              Empathetic chat support with real-time emotion analysis
            </p>
          </div>
          <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">
            {conversationId ? "Session Active" : "Connecting..."}
          </Badge>
        </div>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="max-w-2xl mx-auto space-y-4 pb-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${msg.role === "ai"
                    ? "bg-muted text-foreground"
                    : "bg-foreground text-background"
                    }`}
                >
                  {msg.role === "ai" ? (
                    <Bot className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={`flex flex-col gap-1 max-w-[80%] ${msg.role === "user" ? "items-end" : ""}`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "ai"
                      ? "bg-muted text-foreground rounded-tl-md"
                      : "bg-foreground text-background rounded-tr-md"
                      }`}
                  >
                    {msg.content}
                  </div>
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[10px] text-muted-foreground">
                      {msg.timestamp}
                    </span>
                    {msg.emotion && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] h-4 px-1.5"
                      >
                        {msg.emotion}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl px-4 py-4 text-sm bg-muted text-foreground rounded-tl-md flex items-center gap-1">
                  <div className="h-1.5 w-1.5 bg-foreground/50 rounded-full animate-bounce" />
                  <div className="h-1.5 w-1.5 bg-foreground/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="h-1.5 w-1.5 bg-foreground/50 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="border-t border-border px-6 py-4">
          <div className="max-w-2xl mx-auto flex gap-3">
            <Input
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1"
              disabled={!conversationId || isTyping}
            />
            <Button size="icon" onClick={handleSend} disabled={!input.trim() || !conversationId || isTyping}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Emotion Analysis Panel (Desktop Only) */}
      <aside className="hidden lg:flex w-80 flex-col border-l border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">
            Live Emotion Analysis
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time emotional tracking
          </p>
        </div>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {/* Overall State */}
            {overallState && (
              <Card className="bg-muted/50 border-muted">
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Overall State (Average)
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-foreground capitalize">
                      {overallState.emotion}
                    </span>
                    <Badge variant="outline" className="text-xs bg-background">
                      {overallState.score} / 100
                    </Badge>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-background overflow-hidden">
                    <div
                      className="h-full rounded-full bg-foreground/50 transition-all duration-500"
                      style={{ width: `${overallState.score}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Current State */}
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Current State
                </p>
                {currentEmotion ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-foreground capitalize">
                        {currentEmotion.emotion}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {currentEmotion.score} / 100
                      </Badge>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-foreground transition-all duration-500"
                        style={{ width: `${currentEmotion.score}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Waiting for messages...</p>
                )}
              </CardContent>
            </Card>

            {overallState && overallState.score > 90 && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-destructive mb-1">
                    High Stress Detected
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    Your stress levels seem consistently high. Consider speaking with a professional.
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => router.push("/patient/book-professional")}
                  >
                    Escalate to Therapist
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Emotion Timeline */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Session Timeline
              </p>
              <div className="space-y-3">
                {emotionTimeline.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No data yet</p>
                ) : (
                  emotionTimeline.map((entry, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg border border-border p-3"
                    >
                      <span className="text-xs text-muted-foreground font-mono w-10">
                        {entry.time}
                      </span>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-foreground capitalize">
                          {entry.emotion}
                        </p>
                        <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-foreground"
                            style={{ width: `${entry.intensity}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {entry.intensity}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Escalate to Therapist Permanent Button */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-primary mb-1">
                  Need Professional Support?
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  You can securely share this session and connect with a human therapist at any time.
                </p>
                <Button
                  onClick={() => router.push("/patient/book-professional")}
                  className="w-full text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Escalate to Therapist
                </Button>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </aside>
    </div>
  )
}
