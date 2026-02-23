"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react"
import Link from "next/link"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"

const weeklyMoodData = [
  { day: "Mon", score: 42 },
  { day: "Tue", score: 38 },
  { day: "Wed", score: 55 },
  { day: "Thu", score: 48 },
  { day: "Fri", score: 35 },
  { day: "Sat", score: 30 },
  { day: "Sun", score: 34 },
]

const emotionDistribution = [
  { emotion: "Calm", value: 35 },
  { emotion: "Anxious", value: 22 },
  { emotion: "Hopeful", value: 18 },
  { emotion: "Sad", value: 12 },
  { emotion: "Neutral", value: 13 },
]

const recentSessions = [
  {
    date: "Feb 20, 2026",
    type: "AI Companion",
    duration: "24 min",
    mood: "Improving",
    trend: "up",
  },
  {
    date: "Feb 18, 2026",
    type: "Listening Agent",
    duration: "18 min",
    mood: "Stable",
    trend: "neutral",
  },
  {
    date: "Feb 16, 2026",
    type: "AI Companion",
    duration: "32 min",
    mood: "Declining",
    trend: "down",
  },
  {
    date: "Feb 14, 2026",
    type: "Journal Entry",
    duration: "12 min",
    mood: "Improving",
    trend: "up",
  },
]

export default function PatientDashboard() {
  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Emotional Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your emotional patterns and wellness overview
        </p>
      </div>

      {/* Stress Score + Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Stress Score
              </p>
              <Badge variant="secondary" className="text-xs">Live</Badge>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-foreground">34</span>
              <span className="text-sm text-muted-foreground pb-0.5">/ 100</span>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-foreground" style={{ width: "34%" }} />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingDown className="h-3 w-3 text-chart-2" />
              <span className="text-xs text-chart-2">8% lower than last week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Sessions This Week
            </p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-foreground">5</span>
              <span className="text-sm text-muted-foreground pb-0.5">sessions</span>
            </div>
            <div className="flex items-center gap-1 mt-4">
              <TrendingUp className="h-3 w-3 text-chart-2" />
              <span className="text-xs text-muted-foreground">
                2 more than last week
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Dominant Emotion
            </p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-foreground">Calm</span>
            </div>
            <div className="flex items-center gap-1 mt-4">
              <Minus className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Consistent for 3 days
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Journal Streak
            </p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-foreground">7</span>
              <span className="text-sm text-muted-foreground pb-0.5">days</span>
            </div>
            <div className="flex items-center gap-1 mt-4">
              <TrendingUp className="h-3 w-3 text-chart-2" />
              <span className="text-xs text-muted-foreground">
                Personal best
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Weekly Stress Trend
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Lower is better. Based on conversational analysis.
            </p>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyMoodData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--foreground))"
                    fill="hsl(var(--muted))"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Emotion Distribution
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Breakdown of detected emotions this week.
            </p>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={emotionDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="emotion"
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    width={60}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill="hsl(var(--foreground))"
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              Recent Sessions
            </CardTitle>
            <Link
              href="/patient/companion"
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              Start New Session
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentSessions.map((session, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {session.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session.date} &middot; {session.duration}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {session.trend === "up" && (
                    <TrendingUp className="h-3.5 w-3.5 text-chart-2" />
                  )}
                  {session.trend === "down" && (
                    <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                  )}
                  {session.trend === "neutral" && (
                    <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className="text-xs font-medium text-muted-foreground">
                    {session.mood}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
