"use client"

import { motion } from "framer-motion"
import {
  MessageSquare,
  BarChart3,
  Mic,
  Leaf,
  BookOpen,
  FileText,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Users,
} from "lucide-react"

export default function JourneySection() {
  return (
    <>
      <section id="patients" className="py-24 md:py-32 bg-background">
        <div className="container px-4 md:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
              <motion.div
                className="lg:sticky lg:top-24"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <p className="text-sm font-medium text-muted-foreground mb-3 tracking-wide uppercase">
                  Patient Journey
                </p>
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
                  A safe space to be heard
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed text-pretty">
                  Your portal is designed for emotional safety and personal growth.
                  Every feature is built around consent, privacy, and your pace.
                </p>
                <div className="mt-8 rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-2 w-2 rounded-full bg-chart-2" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Live Stress Score
                    </span>
                  </div>
                  <div className="flex items-end gap-4">
                    <span className="text-4xl font-bold text-foreground">34</span>
                    <span className="text-sm text-muted-foreground pb-1">/ 100</span>
                    <span className="ml-auto text-xs text-chart-2 font-medium flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Improving
                    </span>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-foreground"
                      initial={{ width: 0 }}
                      whileInView={{ width: "34%" }}
                      transition={{ duration: 1, delay: 0.3 }}
                      viewport={{ once: true }}
                    />
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Based on conversational patterns over the last 7 days
                  </p>
                </div>
              </motion.div>

              <div className="space-y-5">
                <JourneyCard
                  icon={<MessageSquare className="h-5 w-5" />}
                  title="AI Companion"
                  description="Chat interface with real-time emotion analysis. Your AI companion adapts its tone and suggestions based on how you are feeling."
                  delay={0}
                />
                <JourneyCard
                  icon={<Mic className="h-5 w-5" />}
                  title="Listening Agent"
                  description="Voice transcription paired with AI-generated summaries. Speak freely and get structured reflections of your thoughts."
                  delay={0.1}
                />
                <JourneyCard
                  icon={<BarChart3 className="h-5 w-5" />}
                  title="Emotional Dashboard"
                  description="Visual trend tracking of your emotional patterns over time. See progress, identify triggers, and celebrate growth."
                  delay={0.2}
                />
                <JourneyCard
                  icon={<Leaf className="h-5 w-5" />}
                  title="Wellness Tools"
                  description="Guided breathing exercises, grounding techniques, and calming activities to support you in the moment."
                  delay={0.3}
                />
                <JourneyCard
                  icon={<BookOpen className="h-5 w-5" />}
                  title="Journal"
                  description="Private, reflective space to write and process your thoughts. AI-assisted prompts available when you need direction."
                  delay={0.4}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="professionals" className="py-24 md:py-32 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
              <div className="space-y-5 order-2 lg:order-1">
                <JourneyCard
                  icon={<BarChart3 className="h-5 w-5" />}
                  title="Patient Insights Dashboard"
                  description="Aggregated view of patient emotional data with trend lines, risk indicators, and session-over-session comparisons."
                  delay={0}
                />
                <JourneyCard
                  icon={<FileText className="h-5 w-5" />}
                  title="AI-Generated Session Summaries"
                  description="Structured clinical notes derived from patient AI conversations. Key themes, emotional shifts, and action items extracted automatically."
                  delay={0.1}
                />
                <JourneyCard
                  icon={<TrendingUp className="h-5 w-5" />}
                  title="Stress Trend Visualization"
                  description="Longitudinal emotional data charted for clinical review. Identify patterns that emerge across weeks and months."
                  delay={0.2}
                />
                <JourneyCard
                  icon={<AlertTriangle className="h-5 w-5" />}
                  title="Flagged Patient Alerts"
                  description="AI-detected risk signals surfaced with context. Prioritized by severity to support timely clinical response."
                  delay={0.3}
                />
                <JourneyCard
                  icon={<Calendar className="h-5 w-5" />}
                  title="Session Management"
                  description="Full appointment and session scheduling with patient-consented context pre-loaded for each visit."
                  delay={0.4}
                />
              </div>

              <motion.div
                className="lg:sticky lg:top-24 order-1 lg:order-2"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <p className="text-sm font-medium text-muted-foreground mb-3 tracking-wide uppercase">
                  Professional Workflow
                </p>
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
                  Clinical clarity at scale
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed text-pretty">
                  Your portal delivers structured, actionable intelligence. Every
                  feature is designed to enhance clinical efficiency without
                  replacing professional judgment.
                </p>
                <div className="mt-8 rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-2 w-2 rounded-full bg-destructive" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Active Alerts
                    </span>
                  </div>
                  <div className="space-y-4">
                    <AlertItem
                      name="Sarah M."
                      status="High stress detected"
                      level="high"
                    />
                    <AlertItem
                      name="James K."
                      status="Consent for escalation"
                      level="medium"
                    />
                    <AlertItem
                      name="Dr. Chen follow-up"
                      status="Summary ready"
                      level="low"
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function JourneyCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode
  title: string
  description: string
  delay: number
}) {
  return (
    <motion.div
      className="rounded-xl border border-border bg-card p-6"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      viewport={{ once: true }}
    >
      <div className="flex gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

function AlertItem({
  name,
  status,
  level,
}: {
  name: string
  status: string
  level: "high" | "medium" | "low"
}) {
  const dotColor =
    level === "high"
      ? "bg-destructive"
      : level === "medium"
        ? "bg-chart-4"
        : "bg-chart-2"

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
          <Users className="h-4 w-4 text-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">{status}</p>
        </div>
      </div>
      <div className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
    </div>
  )
}
