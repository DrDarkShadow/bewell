"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Clock,
  Brain,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"

const summaries = [
  {
    id: 1,
    patient: "Alex M.",
    initials: "AM",
    date: "Feb 20, 2026",
    sessionNumber: 12,
    duration: "52 min",
    status: "review" as const,
    moodStart: "Anxious",
    moodEnd: "Calmer",
    stressScore: { before: 72, after: 65 },
    keyTopics: ["Work deadline pressure", "Sleep disruption", "Conflict with manager"],
    aiInsights: [
      "Patient exhibits escalating work-related anxiety pattern consistent with previous episodes (sessions 8-10).",
      "Sleep disruption may be exacerbating stress response. Consider referral for sleep hygiene assessment.",
      "Avoidance behavior noted when discussing manager relationship. May benefit from assertiveness-focused CBT in next session.",
    ],
    suggestedActions: [
      "Schedule follow-up within 4 days given elevated stress trajectory",
      "Introduce progressive muscle relaxation for acute anxiety management",
      "Revisit workplace boundary-setting exercises from session 9",
    ],
    flags: ["Stress spike: 42 → 78 over 48h preceding session"],
    consent: "Patient consented to AI summary generation. Data encrypted at rest.",
  },
  {
    id: 2,
    patient: "Sam T.",
    initials: "ST",
    date: "Feb 21, 2026",
    sessionNumber: 15,
    duration: "48 min",
    status: "reviewed" as const,
    moodStart: "Low",
    moodEnd: "Reflective",
    stressScore: { before: 58, after: 50 },
    keyTopics: ["Anniversary of loss", "Identity shifts", "Support system changes"],
    aiInsights: [
      "Patient is processing grief adaptively but shows increased vulnerability around anniversary dates.",
      "Identity reconstruction progressing well. Patient articulating new self-narrative with more coherence than session 12.",
      "Journal entries show positive sentiment trajectory despite acute low mood today.",
    ],
    suggestedActions: [
      "Continue current therapeutic approach. Patient responding well to narrative therapy framework.",
      "Encourage continued journaling. AI detected improving self-compassion language patterns.",
      "Consider introducing meaning-making exercises for next session.",
    ],
    flags: ["Journal sentiment shift detected. Overall trend remains positive."],
    consent: "Patient consented to AI summary generation. Data encrypted at rest.",
  },
  {
    id: 3,
    patient: "Casey R.",
    initials: "CR",
    date: "Feb 19, 2026",
    sessionNumber: 6,
    duration: "45 min",
    status: "reviewed" as const,
    moodStart: "Neutral",
    moodEnd: "Hopeful",
    stressScore: { before: 35, after: 28 },
    keyTopics: ["Relationship communication", "Self-worth exploration", "Goal setting"],
    aiInsights: [
      "Patient demonstrating consistent progress in communication skills. Conflict frequency with partner reduced by ~40% since session 3.",
      "Self-esteem metrics improving. Patient using more self-affirming language in check-ins.",
      "Treatment goals on track. Consider transitioning to biweekly sessions within 2-3 sessions.",
    ],
    suggestedActions: [
      "Reinforce communication gains with role-play exercises",
      "Introduce values clarification exercise for long-term goal alignment",
      "Discuss session frequency adjustment at next appointment",
    ],
    flags: [],
    consent: "Patient consented to AI summary generation. Data encrypted at rest.",
  },
]

export default function SummariesPage() {
  const [expandedId, setExpandedId] = useState<number | null>(1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Session Summaries</h1>
        <p className="text-muted-foreground mt-1">
          AI-generated session summaries with clinical insights, suggested actions, and patient consent records.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="outline" className="gap-1">
          <FileText className="h-3 w-3" />
          {summaries.length} summaries
        </Badge>
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          {summaries.filter((s) => s.status === "review").length} pending review
        </Badge>
      </div>

      <div className="space-y-4">
        {summaries.map((summary) => {
          const isExpanded = expandedId === summary.id

          return (
            <Card key={summary.id}>
              <CardHeader
                className="cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : summary.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs">{summary.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {summary.patient} — Session {summary.sessionNumber}
                        {summary.status === "review" ? (
                          <Badge variant="secondary" className="text-[10px]">
                            Needs Review
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-green-600 border-green-200">
                            Reviewed
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {summary.date} &middot; {summary.duration} &middot; Mood: {summary.moodStart} → {summary.moodEnd}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Stress:</span>
                      <span className="font-medium">{summary.stressScore.before}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium text-green-600">{summary.stressScore.after}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="space-y-6 pt-0">
                  {/* Key Topics */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Key Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {summary.keyTopics.map((topic) => (
                        <Badge key={topic} variant="secondary">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* AI Insights */}
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                      <Brain className="h-4 w-4 text-muted-foreground" />
                      AI Clinical Insights
                    </h4>
                    <div className="space-y-2">
                      {summary.aiInsights.map((insight, i) => (
                        <div key={i} className="flex gap-2 text-sm">
                          <span className="text-muted-foreground mt-0.5 shrink-0">{i + 1}.</span>
                          <p className="text-muted-foreground">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Suggested Actions */}
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Suggested Actions
                    </h4>
                    <div className="space-y-2">
                      {summary.suggestedActions.map((action, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-foreground shrink-0" />
                          <p>{action}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Flags */}
                  {summary.flags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        Flags
                      </h4>
                      <div className="space-y-1">
                        {summary.flags.map((flag, i) => (
                          <p key={i} className="text-sm text-amber-700 bg-amber-50 rounded-md px-3 py-2">
                            {flag}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Consent Record */}
                  <div className="border-t pt-4">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      {summary.consent}
                    </p>
                  </div>

                  {summary.status === "review" && (
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">
                        Edit Summary
                      </Button>
                      <Button size="sm">Mark as Reviewed</Button>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
