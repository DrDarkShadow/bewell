"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  ChevronRight,
  AlertTriangle,
} from "lucide-react"

const patients = [
  {
    name: "Alex M.",
    initials: "AM",
    age: 28,
    stressScore: 78,
    trend: "up" as const,
    sessions: 12,
    lastSession: "Feb 20, 2026",
    nextSession: "Feb 24, 2026",
    status: "flagged" as const,
    concern: "Stress spike detected",
    tags: ["Anxiety", "Work Stress"],
  },
  {
    name: "Jordan K.",
    initials: "JK",
    age: 34,
    stressScore: 45,
    trend: "down" as const,
    sessions: 8,
    lastSession: "Feb 17, 2026",
    nextSession: "Feb 25, 2026",
    status: "flagged" as const,
    concern: "Missed check-ins",
    tags: ["Depression", "Sleep"],
  },
  {
    name: "Sam T.",
    initials: "ST",
    age: 22,
    stressScore: 52,
    trend: "stable" as const,
    sessions: 15,
    lastSession: "Feb 21, 2026",
    nextSession: "Feb 28, 2026",
    status: "flagged" as const,
    concern: "Journal sentiment shift",
    tags: ["Grief", "Adjustment"],
  },
  {
    name: "Casey R.",
    initials: "CR",
    age: 41,
    stressScore: 31,
    trend: "down" as const,
    sessions: 6,
    lastSession: "Feb 19, 2026",
    nextSession: "Feb 26, 2026",
    status: "active" as const,
    concern: "",
    tags: ["Relationship", "Self-esteem"],
  },
  {
    name: "Morgan L.",
    initials: "ML",
    age: 37,
    stressScore: 63,
    trend: "up" as const,
    sessions: 10,
    lastSession: "Feb 18, 2026",
    nextSession: "Feb 27, 2026",
    status: "active" as const,
    concern: "",
    tags: ["Burnout", "Anxiety"],
  },
  {
    name: "Taylor P.",
    initials: "TP",
    age: 29,
    stressScore: 25,
    trend: "down" as const,
    sessions: 20,
    lastSession: "Feb 22, 2026",
    nextSession: "Mar 1, 2026",
    status: "active" as const,
    concern: "",
    tags: ["PTSD", "Recovery"],
  },
  {
    name: "Riley D.",
    initials: "RD",
    age: 45,
    stressScore: 38,
    trend: "stable" as const,
    sessions: 4,
    lastSession: "Feb 20, 2026",
    nextSession: "Mar 3, 2026",
    status: "active" as const,
    concern: "",
    tags: ["Career", "Stress"],
  },
]

function getTrendIcon(trend: "up" | "down" | "stable") {
  if (trend === "up") return <TrendingUp className="h-4 w-4 text-destructive" />
  if (trend === "down") return <TrendingDown className="h-4 w-4 text-green-600" />
  return <Minus className="h-4 w-4 text-muted-foreground" />
}

function getScoreColor(score: number) {
  if (score >= 70) return "text-destructive"
  if (score >= 50) return "text-amber-600"
  return "text-green-600"
}

function getScoreBg(score: number) {
  if (score >= 70) return "bg-destructive/10"
  if (score >= 50) return "bg-amber-50"
  return "bg-green-50"
}

export default function PatientsPage() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "flagged" | "active">("all")

  const filtered = patients.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === "all" || p.status === filter
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Patients</h1>
        <p className="text-muted-foreground mt-1">
          Manage your patient roster, view stress trends, and access AI-generated insights.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All ({patients.length})
          </Button>
          <Button
            variant={filter === "flagged" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("flagged")}
          >
            <AlertTriangle className="mr-1 h-3 w-3" />
            Flagged ({patients.filter((p) => p.status === "flagged").length})
          </Button>
          <Button
            variant={filter === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("active")}
          >
            Active ({patients.filter((p) => p.status === "active").length})
          </Button>
        </div>
      </div>

      {/* Patient Cards */}
      <div className="grid gap-4">
        {filtered.map((patient) => (
          <Card key={patient.name} className="group hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback className={patient.status === "flagged" ? "bg-destructive/10 text-destructive" : ""}>
                      {patient.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{patient.name}</h3>
                      <span className="text-xs text-muted-foreground">Age {patient.age}</span>
                      {patient.status === "flagged" && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                          Flagged
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {patient.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                      {patient.concern && (
                        <span className="text-xs text-destructive">{patient.concern}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-8">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Stress Score</p>
                    <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${getScoreBg(patient.stressScore)}`}>
                      <span className={`text-sm font-semibold ${getScoreColor(patient.stressScore)}`}>
                        {patient.stressScore}
                      </span>
                      {getTrendIcon(patient.trend)}
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Sessions</p>
                    <p className="text-sm font-medium">{patient.sessions}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Next Session</p>
                    <p className="text-sm">{patient.nextSession.replace(", 2026", "")}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
