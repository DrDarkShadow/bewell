"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  CalendarDays,
  FileText,
  ArrowRight,
  BellRing
} from "lucide-react"
import Link from "next/link"

// We keep flaggedPatients empty until the DB actually supports finding real flags.
const flaggedPatients: any[] = []

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

export default function ProfessionalDashboard() {
  const { token, user } = useAuth()
  const [urgentRequests, setUrgentRequests] = useState<any[]>([])
  const [recentPatients, setRecentPatients] = useState<any[]>([])
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([])
  const [stats, setStats] = useState({
    activePatientsCount: 0,
    sessionsThisWeek: 0,
    flaggedAlerts: 0,
    aiSummariesReady: 0
  })

  useEffect(() => {
    const fetchRequests = async () => {
      if (!token) return
      try {
        const res = await fetch("/api/v1/doctor/escalate/requests", {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setUrgentRequests(data)
        }
      } catch (err) {
        console.error("Failed to fetch urgent requests", err)
      }
    }

    const fetchDashboard = async () => {
      if (!token) return
      try {
        const res = await fetch("/api/v1/doctor/dashboard", {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setRecentPatients(data.recentPatients || [])
          setUpcomingSessions(data.upcomingSessions || [])
          setStats({
            activePatientsCount: data.activePatientsCount || 0,
            sessionsThisWeek: data.sessionsThisWeek || 0,
            flaggedAlerts: data.flaggedAlerts || 0,
            aiSummariesReady: data.aiSummariesReady || 0
          })
        }
      } catch (err) { }
    }

    fetchRequests()
    fetchDashboard()

    // Fallback polling for requests just in case
    const interval = setInterval(fetchRequests, 10000)

    // Connect to WebSocket if we have the user info
    let ws: WebSocket | null = null
    if (user?.id) {
      ws = new WebSocket(`ws://127.0.0.1:8000/api/v1/ws/doctor/${user.id}`)
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'new_request') {
            toast.error(`⚠️ URGENT REQUEST from ${data.patient_name}`)
            fetchRequests() // re-fetch requests right away
          }
        } catch (e) { }
      }
    }

    return () => {
      clearInterval(interval)
      if (ws) ws.close()
    }
  }, [token, user])

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const res = await fetch(`/api/v1/doctor/escalate/request/${requestId}/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        toast.success("Request accepted! A new appointment has been scheduled.")
        setUrgentRequests(prev => prev.filter(r => r.request_id !== requestId))
      } else {
        toast.error("Failed to accept request or it was already taken.")
        setUrgentRequests(prev => prev.filter(r => r.request_id !== requestId))
      }
    } catch (err) {
      toast.error("An error occurred.")
      console.error(err)
    }
  }

  return (
    <div className="space-y-8">
      {/* Urgent Requests Banner */}
      {urgentRequests.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <h2 className="text-xl font-bold flex items-center gap-2 text-destructive">
            <BellRing className="h-5 w-5 animate-bounce" />
            Incoming Urgent Requests ({urgentRequests.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {urgentRequests.map(req => (
              <Card key={req.request_id} className="border-destructive/50 bg-destructive/5 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-destructive/20 text-destructive text-xs">
                          {req.patient_name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {req.patient_name}
                    </CardTitle>
                    <Badge variant="destructive" className="animate-pulse">Urgent</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="text-sm bg-background/50 rounded-md p-3 border border-border/50">
                    <p className="font-semibold text-xs text-muted-foreground mb-1">Patient Note:</p>
                    <p className="line-clamp-3 italic">"{req.note || 'No additional note provided.'}"</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-3">
                    Received: {new Date(req.created_at).toLocaleTimeString()}
                  </p>
                  <Button
                    className="w-full mt-4 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    onClick={() => handleAcceptRequest(req.request_id)}
                  >
                    Accept Request immediately
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Patient Insights</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your active patients, flagged alerts, and upcoming sessions.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Users className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Patients</p>
                <p className="text-2xl font-semibold">{stats.activePatientsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Flagged Alerts</p>
                <p className="text-2xl font-semibold">{stats.flaggedAlerts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <CalendarDays className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sessions This Week</p>
                <p className="text-2xl font-semibold">{stats.sessionsThisWeek}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <FileText className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">AI Summaries Ready</p>
                <p className="text-2xl font-semibold">{stats.aiSummariesReady}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flagged Alerts */}
      {flaggedPatients.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Flagged Patients
                </CardTitle>
                <CardDescription>Patients requiring immediate attention based on AI analysis</CardDescription>
              </div>
              <Badge variant="destructive">{flaggedPatients.length} alerts</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {flaggedPatients.map((patient) => (
                <div
                  key={patient.name}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs bg-destructive/10 text-destructive">
                        {patient.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{patient.name}</p>
                      <p className="text-xs text-muted-foreground">{patient.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">Last: {patient.lastSession}</span>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/professional/patients">
                        View
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Patient List */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Patients</CardTitle>
                <CardDescription>Stress scores and session activity</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/professional/patients">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
                <span className="col-span-4">Patient</span>
                <span className="col-span-2 text-center">Stress</span>
                <span className="col-span-2 text-center">Trend</span>
                <span className="col-span-2 text-center">Sessions</span>
                <span className="col-span-2 text-right">Next</span>
              </div>
              {recentPatients.map((patient) => (
                <div
                  key={patient.name}
                  className="grid grid-cols-12 items-center gap-2 rounded-lg px-3 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="col-span-4 flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">{patient.initials}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{patient.name}</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className={`text-sm font-semibold ${getScoreColor(patient.stressScore)}`}>
                      {patient.stressScore}
                    </span>
                  </div>
                  <div className="col-span-2 flex justify-center">{getTrendIcon(patient.trend)}</div>
                  <div className="col-span-2 text-center text-sm text-muted-foreground">
                    {patient.sessions}
                  </div>
                  <div className="col-span-2 text-right text-xs text-muted-foreground">
                    {patient.nextSession.replace(", 2026", "")}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Sessions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
            <CardDescription>Your schedule for the next 48 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingSessions.map((session, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Avatar className="h-8 w-8 mt-0.5">
                    <AvatarFallback className="text-xs">{session.initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{session.patient}</p>
                      <Badge variant="secondary" className="text-[10px]">
                        {session.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {session.date} at {session.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
