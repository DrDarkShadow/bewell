"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts"

const aggregateTrend = [
  { week: "Jan 6", avg: 48, high: 72, low: 25 },
  { week: "Jan 13", avg: 51, high: 75, low: 28 },
  { week: "Jan 20", avg: 46, high: 68, low: 22 },
  { week: "Jan 27", avg: 49, high: 70, low: 26 },
  { week: "Feb 3", avg: 52, high: 74, low: 30 },
  { week: "Feb 10", avg: 47, high: 78, low: 25 },
  { week: "Feb 17", avg: 50, high: 80, low: 24 },
  { week: "Feb 24", avg: 48, high: 78, low: 22 },
]

const patientTrends = [
  {
    name: "Alex M.",
    initials: "AM",
    current: 78,
    previous: 42,
    trend: "up" as const,
    data: [
      { session: "S7", score: 55 },
      { session: "S8", score: 62 },
      { session: "S9", score: 58 },
      { session: "S10", score: 48 },
      { session: "S11", score: 42 },
      { session: "S12", score: 78 },
    ],
  },
  {
    name: "Jordan K.",
    initials: "JK",
    current: 45,
    previous: 62,
    trend: "down" as const,
    data: [
      { session: "S3", score: 70 },
      { session: "S4", score: 65 },
      { session: "S5", score: 58 },
      { session: "S6", score: 55 },
      { session: "S7", score: 50 },
      { session: "S8", score: 45 },
    ],
  },
  {
    name: "Sam T.",
    initials: "ST",
    current: 52,
    previous: 55,
    trend: "stable" as const,
    data: [
      { session: "S10", score: 60 },
      { session: "S11", score: 55 },
      { session: "S12", score: 58 },
      { session: "S13", score: 53 },
      { session: "S14", score: 55 },
      { session: "S15", score: 52 },
    ],
  },
  {
    name: "Casey R.",
    initials: "CR",
    current: 31,
    previous: 48,
    trend: "down" as const,
    data: [
      { session: "S1", score: 52 },
      { session: "S2", score: 48 },
      { session: "S3", score: 42 },
      { session: "S4", score: 38 },
      { session: "S5", score: 35 },
      { session: "S6", score: 31 },
    ],
  },
  {
    name: "Morgan L.",
    initials: "ML",
    current: 63,
    previous: 55,
    trend: "up" as const,
    data: [
      { session: "S5", score: 50 },
      { session: "S6", score: 48 },
      { session: "S7", score: 52 },
      { session: "S8", score: 55 },
      { session: "S9", score: 58 },
      { session: "S10", score: 63 },
    ],
  },
  {
    name: "Taylor P.",
    initials: "TP",
    current: 25,
    previous: 35,
    trend: "down" as const,
    data: [
      { session: "S15", score: 40 },
      { session: "S16", score: 38 },
      { session: "S17", score: 35 },
      { session: "S18", score: 30 },
      { session: "S19", score: 28 },
      { session: "S20", score: 25 },
    ],
  },
]

const distributionData = [
  { range: "0-20", count: 2 },
  { range: "21-40", count: 6 },
  { range: "41-60", count: 9 },
  { range: "61-80", count: 5 },
  { range: "81-100", count: 2 },
]

function getScoreColor(score: number) {
  if (score >= 70) return "text-destructive"
  if (score >= 50) return "text-amber-600"
  return "text-green-600"
}

function getLineColor(trend: "up" | "down" | "stable") {
  if (trend === "up") return "hsl(var(--destructive))"
  if (trend === "down") return "#16a34a"
  return "hsl(var(--muted-foreground))"
}

export default function TrendsPage() {
  const avgStress = Math.round(
    patientTrends.reduce((sum, p) => sum + p.current, 0) / patientTrends.length
  )
  const improving = patientTrends.filter((p) => p.trend === "down").length
  const worsening = patientTrends.filter((p) => p.trend === "up").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Stress Trends</h1>
        <p className="text-muted-foreground mt-1">
          Aggregate and per-patient stress score visualizations over time.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Avg. Stress Score</p>
            <p className={`text-3xl font-semibold mt-1 ${getScoreColor(avgStress)}`}>{avgStress}</p>
            <p className="text-xs text-muted-foreground mt-1">Across {patientTrends.length} active patients</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Improving</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-3xl font-semibold text-green-600">{improving}</p>
              <ArrowDownRight className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Stress trending downward</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Needs Attention</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-3xl font-semibold text-destructive">{worsening}</p>
              <ArrowUpRight className="h-5 w-5 text-destructive" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Stress trending upward</p>
          </CardContent>
        </Card>
      </div>

      {/* Aggregate Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Aggregate Stress Trend</CardTitle>
          <CardDescription>
            Average, high, and low stress scores across all patients over the past 8 weeks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={aggregateTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="week" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis domain={[0, 100]} className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
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
                  dataKey="high"
                  stroke="hsl(var(--destructive))"
                  fill="hsl(var(--destructive))"
                  fillOpacity={0.08}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  name="High"
                />
                <Area
                  type="monotone"
                  dataKey="avg"
                  stroke="hsl(var(--foreground))"
                  fill="hsl(var(--foreground))"
                  fillOpacity={0.05}
                  strokeWidth={2}
                  name="Average"
                />
                <Area
                  type="monotone"
                  dataKey="low"
                  stroke="#16a34a"
                  fill="#16a34a"
                  fillOpacity={0.08}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  name="Low"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Score Distribution</CardTitle>
            <CardDescription>Current patient stress score ranges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="range" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Bar dataKey="count" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Per-patient sparklines */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Per-Patient Trends</CardTitle>
            <CardDescription>Individual stress score trajectories over recent sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {patientTrends.map((patient) => (
                <div key={patient.name} className="flex items-center gap-3 rounded-lg border p-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs">{patient.initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{patient.name}</span>
                      <div className="flex items-center gap-1">
                        <span className={`text-sm font-semibold ${getScoreColor(patient.current)}`}>
                          {patient.current}
                        </span>
                        {patient.trend === "up" && <TrendingUp className="h-3 w-3 text-destructive" />}
                        {patient.trend === "down" && <TrendingDown className="h-3 w-3 text-green-600" />}
                        {patient.trend === "stable" && <Minus className="h-3 w-3 text-muted-foreground" />}
                      </div>
                    </div>
                    <div className="h-10">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={patient.data}>
                          <Line
                            type="monotone"
                            dataKey="score"
                            stroke={getLineColor(patient.trend)}
                            strokeWidth={1.5}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
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
