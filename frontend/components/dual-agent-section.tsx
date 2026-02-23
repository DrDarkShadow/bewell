"use client"

import { motion } from "framer-motion"
import { MessageSquare, BarChart3, FileText, AlertTriangle, HeartPulse, BrainCircuit } from "lucide-react"

export default function DualAgentSection() {
  return (
    <section id="platform" className="py-24 md:py-32 bg-muted/30">
      <div className="container px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <p className="text-sm font-medium text-muted-foreground mb-3 tracking-wide uppercase">
            Dual-Agent Architecture
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            Two specialized AI agents. One unified platform.
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed text-pretty">
            BeWell operates on a dual-agent model designed to serve both sides of
            the therapeutic relationship with purpose-built intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <motion.div
            className="rounded-2xl border border-border bg-card p-8 md:p-10"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-6">
              <HeartPulse className="h-6 w-6 text-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Patient AI Agent
            </h3>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              An empathetic companion that listens, tracks, and supports without judgment.
            </p>
            <div className="space-y-5">
              <AgentFeature
                icon={<MessageSquare className="h-4 w-4" />}
                title="Empathetic Chat Support"
                description="Context-aware conversations that adapt to emotional state in real time."
              />
              <AgentFeature
                icon={<BarChart3 className="h-4 w-4" />}
                title="Stress Pattern Tracking"
                description="Continuous monitoring of emotional indicators across sessions."
              />
              <AgentFeature
                icon={
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    <path d="M9 12h6" />
                    <path d="M12 9v6" />
                  </svg>
                }
                title="Wellness Tools"
                description="Guided breathing, grounding exercises, and journaling prompts."
              />
              <AgentFeature
                icon={
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                }
                title="Consent-based Escalation"
                description="Suggests therapist connection only with explicit patient approval."
              />
            </div>
          </motion.div>

          <motion.div
            className="rounded-2xl border border-border bg-card p-8 md:p-10"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-6">
              <BrainCircuit className="h-6 w-6 text-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Professional AI Assistant
            </h3>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              Structured clinical intelligence that amplifies, never replaces, professional judgment.
            </p>
            <div className="space-y-5">
              <AgentFeature
                icon={<FileText className="h-4 w-4" />}
                title="Session Summaries"
                description="Auto-generated structured summaries from patient conversations."
              />
              <AgentFeature
                icon={<BarChart3 className="h-4 w-4" />}
                title="Stress Trend Visualization"
                description="Longitudinal emotional data presented for clinical review."
              />
              <AgentFeature
                icon={<AlertTriangle className="h-4 w-4" />}
                title="Risk Signal Detection"
                description="Flagged patterns and alerts to support clinical awareness."
              />
              <AgentFeature
                icon={
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                }
                title="Session Management"
                description="Appointment oversight with patient-consented context pre-loaded."
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function AgentFeature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  )
}
