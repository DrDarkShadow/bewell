"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, MapPin, Star, Clock, CheckCircle2, Loader2, ArrowLeft } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

type Professional = {
    id: string
    name: string
    specialty: string
    fee: number
    rating: number
    next_available: string
}

export default function BookProfessionalPage() {
    const router = useRouter()
    const { token } = useAuth()

    const [professionals, setProfessionals] = useState<Professional[]>([])
    const [loading, setLoading] = useState(true)

    // Escalation State
    const [activeRequestId, setActiveRequestId] = useState<string | null>(null)
    const [requestedDoctorIds, setRequestedDoctorIds] = useState<string[]>([])
    const [acceptedDoctorId, setAcceptedDoctorId] = useState<string | null>(null)

    // Consent Dialog State
    const [isConsentOpen, setIsConsentOpen] = useState(false)
    const [pendingDoctorId, setPendingDoctorId] = useState<string | null>(null)
    const [consentGiven, setConsentGiven] = useState(false)
    const [patientNote, setPatientNote] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Filter States
    const [searchQuery, setSearchQuery] = useState("")

    // Polling Status Interval
    useEffect(() => {
        let interval: NodeJS.Timeout

        if (activeRequestId && !acceptedDoctorId) {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`http://127.0.0.1:8000/api/v1/patient/escalate/request/${activeRequestId}/status`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                    if (res.ok) {
                        const data = await res.json()
                        if (data.status === "fulfilled" && data.accepted_by) {
                            setAcceptedDoctorId(data.accepted_by)
                            clearInterval(interval)
                        }
                    }
                } catch (err) {
                    console.error("Failed to poll status", err)
                }
            }, 3000) // Poll every 3 seconds
        }

        return () => clearInterval(interval)
    }, [activeRequestId, acceptedDoctorId, token])

    useEffect(() => {
        const fetchProfessionals = async () => {
            try {
                const res = await fetch("http://127.0.0.1:8000/api/v1/patient/professionals", {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    setProfessionals(data)
                }
            } catch (err) {
                console.error("Failed to fetch professionals", err)
            } finally {
                setLoading(false)
            }
        }

        if (token) {
            fetchProfessionals()
        }
    }, [token])

    const handleSendRequestClick = (doctorId: string) => {
        if (!activeRequestId) {
            // First time requesting in this session, need consent and create master request
            setPendingDoctorId(doctorId)
            setIsConsentOpen(true)
        } else {
            // Already have a master request, just add the doctor to the active race
            addDoctorToActiveRequest(doctorId)
        }
    }

    const submitInitialRequest = async () => {
        if (!pendingDoctorId || !consentGiven) return

        setIsSubmitting(true)
        try {
            const res = await fetch("http://127.0.0.1:8000/api/v1/patient/escalate/request", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    doctor_ids: [parseInt(pendingDoctorId)],
                    note: patientNote
                })
            })

            if (res.ok) {
                const data = await res.json()
                setActiveRequestId(data.request_id)
                setRequestedDoctorIds([pendingDoctorId])
                setIsConsentOpen(false)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setIsSubmitting(false)
        }
    }

    const addDoctorToActiveRequest = async (doctorId: string) => {
        if (!activeRequestId) return

        // Optimistic UI update
        setRequestedDoctorIds(prev => [...prev, doctorId])

        try {
            await fetch(`http://127.0.0.1:8000/api/v1/patient/escalate/request/${activeRequestId}/add-doctor`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    doctor_id: parseInt(doctorId)
                })
            })
        } catch (err) {
            console.error(err)
            // Revert on failure
            setRequestedDoctorIds(prev => prev.filter(id => id !== doctorId))
        }
    }

    const filteredProfessionals = professionals.filter(doc =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.specialty.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Success UI State
    if (acceptedDoctorId) {
        const doctor = professionals.find(p => p.id === acceptedDoctorId)
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
                <div className="h-24 w-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="h-12 w-12" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Appointment Confirmed!</h1>
                <p className="text-muted-foreground max-w-md mb-8">
                    Dr. {doctor?.name} has accepted your urgent request. The doctor is currently reviewing your session notes and will join shortly.
                </p>
                <div className="flex gap-4">
                    <Button onClick={() => router.push("/patient")}>Return to Dashboard</Button>
                    <Button variant="outline" onClick={() => router.push("/patient/video")}>Join Meeting Room</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="container max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2 cursor-pointer text-muted-foreground hover:text-foreground transition-colors" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-sm font-medium">Back to Chat</span>
                    </div>
                    <h1 className="text-3xl font-bold text-foreground">Escalate to Professional</h1>
                    <p className="text-muted-foreground mt-1 text-sm md:text-base">
                        Request an urgent session. You can request multiple doctors at once to find help faster.
                    </p>
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or specialty..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Directory Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProfessionals.map((doctor) => {
                        const isRequested = requestedDoctorIds.includes(doctor.id)

                        return (
                            <Card key={doctor.id} className={`overflow-hidden transition-all duration-300 ${isRequested ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'hover:border-primary/50'}`}>
                                <CardHeader className="pb-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">Dr. {doctor.name}</CardTitle>
                                            <CardDescription className="flex items-center gap-1 mt-1 text-sm font-medium text-primary">
                                                {doctor.specialty}
                                            </CardDescription>
                                        </div>
                                        <Badge variant="secondary" className="font-semibold px-2.5 py-1">
                                            ${doctor.fee}/hr
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-3 pb-6">
                                    <div className="flex items-center gap-2 text-sm text-foreground">
                                        <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                                        <span className="font-medium">{doctor.rating}</span>
                                        <span className="text-muted-foreground">(120+ reviews)</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Clock className="h-4 w-4" />
                                        <span>Available: <strong>{doctor.next_available}</strong></span>
                                    </div>
                                </CardContent>

                                <CardFooter className="pt-0">
                                    <Button
                                        variant={isRequested ? "outline" : "default"}
                                        className={`w-full transition-all duration-300 ${isRequested ? 'bg-background border-primary text-primary hover:bg-background' : ''}`}
                                        onClick={() => handleSendRequestClick(doctor.id)}
                                        disabled={isRequested}
                                    >
                                        {isRequested ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Pending Acceptance...
                                            </>
                                        ) : (
                                            "Send Request"
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
            )}

            {filteredProfessionals.length === 0 && !loading && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">No professionals found matching your criteria.</p>
                </div>
            )}

            {/* Initial Consent Modal */}
            <Dialog open={isConsentOpen} onOpenChange={setIsConsentOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Urgent Care Request</DialogTitle>
                        <DialogDescription>
                            To help the professional understand your situation quickly, our AI can share a summary of your recent conversation.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        <div className="flex items-start space-x-3 bg-muted/50 p-4 rounded-lg border border-border">
                            <Checkbox
                                id="consent"
                                checked={consentGiven}
                                onCheckedChange={(checked) => setConsentGiven(checked as boolean)}
                                className="mt-1"
                            />
                            <div className="grid gap-1.5 leading-none">
                                <label
                                    htmlFor="consent"
                                    className="text-sm font-medium leading-tight cursor-pointer"
                                >
                                    I consent to sharing a clinical summary of my AI chat history.
                                </label>
                                <p className="text-xs text-muted-foreground">
                                    This summary remains encrypted and is only visible to the doctor *after* they accept your request.
                                </p>
                            </div>
                        </div>

                        <div className="gap-2 grid">
                            <label htmlFor="note" className="text-sm font-medium">Add an optional note (Private)</label>
                            <Textarea
                                id="note"
                                placeholder="E.g., I am feeling extremely overwhelmed right now and need strategies to calm down."
                                className="h-24 resize-none"
                                value={patientNote}
                                onChange={(e) => setPatientNote(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConsentOpen(false)}>Cancel</Button>
                        <Button
                            onClick={submitInitialRequest}
                            disabled={!consentGiven || isSubmitting}
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Urgent Request
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    )
}
