"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react"

const days = ["Mon", "Tue", "Wed", "Thu", "Fri"]
const currentWeek = "Feb 23 - 27, 2026"

type Session = {
  patient: string
  initials: string
  time: string
  duration: string
  type: "follow-up" | "initial" | "review" | "crisis"
  mode: "video" | "in-person"
  notes?: string
}

const weekSchedule: Record<string, Session[]> = {
  Mon: [
    {
      patient: "Alex M.",
      initials: "AM",
      time: "10:00 AM",
      duration: "50 min",
      type: "follow-up",
      mode: "video",
      notes: "Review stress management techniques",
    },
    {
      patient: "Casey R.",
      initials: "CR",
      time: "2:30 PM",
      duration: "50 min",
      type: "follow-up",
      mode: "in-person",
    },
  ],
  Tue: [
    {
      patient: "Jordan K.",
      initials: "JK",
      time: "9:00 AM",
      duration: "50 min",
      type: "review",
      mode: "video",
      notes: "Discuss missed check-ins, reassess treatment plan",
    },
    {
      patient: "Sam T.",
      initials: "ST",
      time: "11:30 AM",
      duration: "50 min",
      type: "follow-up",
      mode: "video",
    },
    {
      patient: "Riley D.",
      initials: "RD",
      time: "3:00 PM",
      duration: "50 min",
      type: "initial",
      mode: "in-person",
    },
  ],
  Wed: [
    {
      patient: "Morgan L.",
      initials: "ML",
      time: "10:00 AM",
      duration: "50 min",
      type: "follow-up",
      mode: "video",
      notes: "Check on burnout indicators",
    },
    {
      patient: "Taylor P.",
      initials: "TP",
      time: "1:00 PM",
      duration: "50 min",
      type: "review",
      mode: "video",
    },
  ],
  Thu: [
    {
      patient: "Alex M.",
      initials: "AM",
      time: "10:00 AM",
      duration: "30 min",
      type: "crisis",
      mode: "video",
      notes: "Urgent: stress score above 75",
    },
    {
      patient: "Casey R.",
      initials: "CR",
      time: "2:00 PM",
      duration: "50 min",
      type: "follow-up",
      mode: "in-person",
    },
  ],
  Fri: [
    {
      patient: "Sam T.",
      initials: "ST",
      time: "9:30 AM",
      duration: "50 min",
      type: "follow-up",
      mode: "video",
    },
    {
      patient: "Jordan K.",
      initials: "JK",
      time: "11:00 AM",
      duration: "50 min",
      type: "follow-up",
      mode: "video",
    },
  ],
}

function getTypeBadge(type: Session["type"]) {
  switch (type) {
    case "crisis":
      return <Badge variant="destructive" className="text-[10px]">Crisis</Badge>
    case "initial":
      return <Badge className="text-[10px] bg-blue-100 text-blue-700 hover:bg-blue-100">Initial</Badge>
    case "review":
      return <Badge className="text-[10px] bg-amber-100 text-amber-700 hover:bg-amber-100">Review</Badge>
    default:
      return <Badge variant="secondary" className="text-[10px]">Follow-up</Badge>
  }
}

export default function SessionsPage() {
  const [selectedDay, setSelectedDay] = useState("Mon")

  const totalSessions = Object.values(weekSchedule).flat().length
  const todaySessions = weekSchedule[selectedDay]?.length || 0

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sessions</h1>
          <p className="text-muted-foreground mt-1">
            Manage your weekly schedule, view session details, and prepare for upcoming appointments.
          </p>
        </div>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" />
          New Session
        </Button>
      </div>

      {/* Week Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-semibold">{totalSessions} sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Video className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Video Sessions</p>
                <p className="text-2xl font-semibold">
                  {Object.values(weekSchedule).flat().filter((s) => s.mode === "video").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In-Person Sessions</p>
                <p className="text-2xl font-semibold">
                  {Object.values(weekSchedule).flat().filter((s) => s.mode === "in-person").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Week Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Weekly Schedule</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">{currentWeek}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day Tabs */}
          <div className="flex gap-2 mb-6">
            {days.map((day) => {
              const count = weekSchedule[day]?.length || 0
              const isSelected = day === selectedDay
              return (
                <Button
                  key={day}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDay(day)}
                  className="flex-1"
                >
                  <span>{day}</span>
                  <Badge
                    variant={isSelected ? "secondary" : "outline"}
                    className="ml-1.5 text-[10px] px-1.5 py-0"
                  >
                    {count}
                  </Badge>
                </Button>
              )
            })}
          </div>

          {/* Session List */}
          <div className="space-y-3">
            {weekSchedule[selectedDay]?.map((session, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className={session.type === "crisis" ? "bg-destructive/10 text-destructive text-xs" : "text-xs"}>
                      {session.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium">{session.patient}</h3>
                      {getTypeBadge(session.type)}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {session.time} ({session.duration})
                      </span>
                      <span className="flex items-center gap-1">
                        {session.mode === "video" ? (
                          <Video className="h-3 w-3" />
                        ) : (
                          <MapPin className="h-3 w-3" />
                        )}
                        {session.mode === "video" ? "Video call" : "In-person"}
                      </span>
                    </div>
                    {session.notes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">{session.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    Prepare
                  </Button>
                  {session.mode === "video" && (
                    <Button size="sm">
                      <Video className="mr-1 h-3 w-3" />
                      Join
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
