"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CalendarDays, Clock, Video, FileText, Loader2, Star } from "lucide-react"
import Link from "next/link"

type Appointment = {
    id: string
    doctor_id: string
    doctor_name: string
    specialty: string
    scheduled_at: string | null
    status: string
    type: string
    duration_minutes: number
}

export default function PatientAppointmentsPage() {
    const { token, logout } = useAuth()
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedDoctor, setSelectedDoctor] = useState<Appointment | null>(null)

    const fetchAppointments = async () => {
        if (!token) return
        setLoading(true)
        try {
            const res = await fetch("/api/v1/patient/appointments", {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setAppointments(data)
            } else if (res.status === 401) {
                logout()
            }
        } catch (err) {
            console.error("Failed to fetch appointments", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAppointments()
    }, [token])

    // WebSocket: auto-refresh when a doctor accepts the request
    useEffect(() => {
        if (!token) return
        // Parse user ID from JWT payload
        let userId: string | null = null
        try {
            const payload = JSON.parse(atob(token.split('.')[1]))
            userId = payload.sub
        } catch { return }
        if (!userId) return

        const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
        const wsUrl = `${wsProtocol}://127.0.0.1:8000/api/v1/ws/patient/${userId}`
        let ws: WebSocket | null = null
        let reconnectTimeout: NodeJS.Timeout | null = null

        const connectWs = () => {
            ws = new WebSocket(wsUrl)

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data)
                    // The backend sends 'request_accepted', we should re-fetch to see the new appointment
                    if (msg.type === 'request_accepted') {
                        fetchAppointments()
                    }
                } catch (e) { console.error("WS parse error", e) }
            }

            ws.onclose = () => {
                reconnectTimeout = setTimeout(connectWs, 3000)
            }

            ws.onerror = () => {
                ws?.close()
            }
        }

        connectWs()

        return () => {
            if (reconnectTimeout) clearTimeout(reconnectTimeout)
            ws?.close()
        }
    }, [token])

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your connected mental health professionals and upcoming sessions.
                </p>
            </div>

            {appointments.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-lg border border-border">
                    <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No active connections yet</h3>
                    <p className="text-muted-foreground mt-1 mb-6">
                        You haven't connected with a professional yet. Visit the directory to find a therapist.
                    </p>
                    <Button asChild>
                        <Link href="/patient/book-professional">Browse Directory</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {appointments.map((appt) => (
                        <Card key={appt.id} className="border-border hover:border-primary/50 transition-colors">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                {appt.doctor_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle className="text-lg cursor-pointer hover:underline" onClick={() => setSelectedDoctor(appt)}>
                                                Dr. {appt.doctor_name}
                                            </CardTitle>
                                            <CardDescription className="text-primary font-medium">
                                                {appt.specialty}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Badge variant={appt.status === "confirmed" ? "default" : "secondary"}>
                                        {appt.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 pb-4">
                                {appt.scheduled_at ? (
                                    <div className="bg-muted p-3 rounded-lg space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">
                                                {new Date(appt.scheduled_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                            <span>
                                                {new Date(appt.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} ({appt.duration_minutes} min)
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-muted p-3 rounded-lg text-sm text-center text-muted-foreground">
                                        Pending scheduling
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="flex gap-2 pt-0">
                                <Button className="w-full flex-1" onClick={() => setSelectedDoctor(appt)}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Details
                                </Button>
                                {appt.status === 'confirmed' && (
                                    <Button variant="outline" className="flex-none" asChild>
                                        <Link href="/patient/video">
                                            <Video className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {/* Doctor Info Modal */}
            <Dialog open={!!selectedDoctor} onOpenChange={() => setSelectedDoctor(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    {selectedDoctor && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center gap-4 mb-4">
                                    <Avatar className="h-16 w-16">
                                        <AvatarFallback className="text-xl bg-primary/10 text-primary">
                                            {selectedDoctor.doctor_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <DialogTitle className="text-xl">Dr. {selectedDoctor.doctor_name}</DialogTitle>
                                        <DialogDescription className="text-primary font-medium mt-1">
                                            {selectedDoctor.specialty}
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="space-y-6 py-2">
                                <div className="flex items-center gap-6 text-sm">
                                    <div className="flex items-center gap-1.5">
                                        <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                                        <span className="font-semibold">4.8</span>
                                        <span className="text-muted-foreground">(120+ reviews)</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm">Connection Status</h4>
                                    <div className="bg-muted p-3 rounded-lg flex items-center justify-between">
                                        <span className="text-sm font-medium">Current Status</span>
                                        <Badge variant={selectedDoctor.status === "confirmed" ? "default" : "secondary"}>
                                            {selectedDoctor.status.toUpperCase()}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm">Upcoming Session</h4>
                                    {selectedDoctor.scheduled_at ? (
                                        <div className="border border-border p-3 rounded-lg">
                                            <p className="font-medium">
                                                {new Date(selectedDoctor.scheduled_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {new Date(selectedDoctor.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} • {selectedDoctor.duration_minutes} minutes
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No sessions scheduled yet.</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm">Session History</h4>
                                    <div className="text-sm text-muted-foreground border border-border border-dashed p-4 rounded-lg text-center">
                                        No past sessions recorded with this professional.
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
