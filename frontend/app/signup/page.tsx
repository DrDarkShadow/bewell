"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Shield, UserRound, Stethoscope, ArrowLeft, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth, type UserRole } from "@/lib/auth-context"

/* ------------------------------------------------------------------ */
/*  Branding logo SVG                                                   */
/* ------------------------------------------------------------------ */

function BewellLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 21C12 21 4 15.5 4 10C4 7.5 6 5 8.5 5C10 5 11.5 6 12 7.5C12.5 6 14 5 15.5 5C18 5 20 7.5 20 10C20 15.5 12 21 12 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 12H10L11 10L13 14L14 12H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Signup inner                                                         */
/* ------------------------------------------------------------------ */

function SignupInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signup } = useAuth()

  const paramRole = searchParams.get("role") as UserRole | null
  const validRole = paramRole === "patient" || paramRole === "professional" ? paramRole : null

  // Step 1 = role selection, Step 2 = account details
  const [step, setStep] = useState<1 | 2>(validRole ? 2 : 1)
  const [role, setRole] = useState<UserRole>(validRole || "patient")

  // Shared fields
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  // Professional-only fields
  const [specialization, setSpecialization] = useState("")
  const [clinicName, setClinicName] = useState("")

  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const selectRole = (r: UserRole) => {
    setRole(r)
    setStep(2)
  }

  const goBack = () => {
    setStep(1)
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) { setError("Passwords do not match."); return }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return }
    if (!agreedToTerms) { setError("You must agree to the Terms and Privacy Policy."); return }

    setIsLoading(true)
    const result = await signup(name, email, password, role)
    if (result.success) {
      router.push("/login")
    } else {
      setError(result.error || "Signup failed. Please try again.")
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left – Branding panel */}
      <div className="relative hidden lg:flex flex-col justify-between bg-foreground p-12 text-background">
        <div className="relative z-20">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-background/10 backdrop-blur-sm flex items-center justify-center">
              <BewellLogo className="w-5 h-5 text-background" />
            </div>
            <span className="text-lg font-semibold text-background">BeWell</span>
          </Link>
        </div>

        <div className="relative z-20 flex flex-col gap-8">
          <h2 className="text-3xl font-bold text-balance leading-tight">
            AI that listens first.
            <br />
            <span className="text-background/60">Your mental health, your terms.</span>
          </h2>
          <div className="flex flex-col gap-5">
            {[
              { title: "Consent-first", desc: "Nothing is shared without your explicit permission" },
              { title: "End-to-end encrypted", desc: "Your conversations stay between you and your AI" },
              { title: "HIPAA-aligned", desc: "Built to healthcare-grade privacy standards" },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <div className="mt-0.5 rounded-md bg-background/10 p-1.5">
                  <Shield className="h-4 w-4 text-background" />
                </div>
                <div>
                  <p className="text-sm font-medium text-background">{item.title}</p>
                  <p className="text-sm text-background/50">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-20 flex items-center gap-8 text-sm text-background/50">
          <Link href="/" className="hover:text-background transition-colors">Home</Link>
          <a href="#" className="hover:text-background transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-background transition-colors">Terms of Service</a>
        </div>
      </div>

      {/* Right – Signup form */}
      <div className="flex items-center justify-center p-8 bg-background min-h-screen">
        <div className="w-full max-w-[480px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 text-lg font-semibold mb-10">
            <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
              <BewellLogo className="w-5 h-5 text-background" />
            </div>
            <span className="text-foreground">BeWell</span>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            <div className={cn("h-1.5 flex-1 rounded-full transition-colors", step >= 1 ? "bg-foreground" : "bg-muted")} />
            <div className={cn("h-1.5 flex-1 rounded-full transition-colors", step >= 2 ? "bg-foreground" : "bg-muted")} />
          </div>

          {/* ── Step 1 – Role selection ── */}
          {step === 1 && (
            <div>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">Create your account</h1>
                <p className="text-muted-foreground text-sm">Who are you joining as?</p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Patient card */}
                <button
                  type="button"
                  onClick={() => selectRole("patient")}
                  className="group flex flex-col items-center gap-4 rounded-xl border-2 border-border bg-background p-8 text-center transition-all duration-200 hover:border-foreground hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted group-hover:bg-foreground/10 transition-colors">
                    <UserRound className="h-7 w-7 text-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-base">Patient</p>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">I'm looking for emotional support and mental wellness tools</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors mt-auto">
                    Get started <ArrowRight className="h-3 w-3" />
                  </div>
                </button>

                {/* Professional card */}
                <button
                  type="button"
                  onClick={() => selectRole("professional")}
                  className="group flex flex-col items-center gap-4 rounded-xl border-2 border-border bg-background p-8 text-center transition-all duration-200 hover:border-foreground hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted group-hover:bg-foreground/10 transition-colors">
                    <Stethoscope className="h-7 w-7 text-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-base">Mental Health Professional</p>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">I support patients and need clinical insight tools</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors mt-auto">
                    Register <ArrowRight className="h-3 w-3" />
                  </div>
                </button>
              </div>

              <div className="text-center text-sm text-muted-foreground mt-8">
                {"Already have an account? "}
                <Link href="/login" className="text-foreground font-medium hover:underline">Sign in</Link>
              </div>
            </div>
          )}

          {/* ── Step 2 – Registration form ── */}
          {step === 2 && (
            <div>
              <div className="mb-8">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Change role
                </button>

                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    {role === "patient" ? <UserRound className="h-4 w-4 text-foreground" /> : <Stethoscope className="h-4 w-4 text-foreground" />}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground">
                      {role === "patient" ? "Patient Account" : "Professional Account"}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {role === "patient" ? "Access your personalised wellness tools" : "Manage patients with clinical-grade AI insights"}
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Shared fields */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Full name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder={role === "patient" ? "Alex Morgan" : "Dr. Sarah Chen"}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-12 bg-background border-border/60 focus:border-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={role === "patient" ? "you@example.com" : "doctor@clinic.com"}
                    value={email}
                    autoComplete="off"
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 bg-background border-border/60 focus:border-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 pr-10 bg-background border-border/60 focus:border-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm" className="text-sm font-medium">Confirm password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-12 bg-background border-border/60 focus:border-foreground"
                  />
                </div>

                {/* Professional-only fields */}
                {role === "professional" && (
                  <div className="pt-2 space-y-4">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                      <div className="relative flex justify-center">
                        <span className="bg-background px-3 text-xs text-muted-foreground">Professional details</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="specialization" className="text-sm font-medium">Specialization</Label>
                      <Input
                        id="specialization"
                        type="text"
                        placeholder="e.g. Anxiety & Depression, CBT"
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        className="h-12 bg-background border-border/60 focus:border-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clinic" className="text-sm font-medium">Clinic / Practice name</Label>
                      <Input
                        id="clinic"
                        type="text"
                        placeholder="e.g. Serenity Mental Health Clinic"
                        value={clinicName}
                        onChange={(e) => setClinicName(e.target.value)}
                        className="h-12 bg-background border-border/60 focus:border-foreground"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2 pt-1">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(v) => setAgreedToTerms(v === true)}
                    className="mt-0.5"
                  />
                  <Label htmlFor="terms" className="text-sm font-normal cursor-pointer leading-relaxed">
                    {"I agree to BeWell's "}
                    <a href="#" className="text-foreground font-medium hover:underline">Terms of Service</a>
                    {" and "}
                    <a href="#" className="text-foreground font-medium hover:underline">Privacy Policy</a>
                  </Label>
                </div>

                {error && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full h-12 text-base font-medium" size="lg" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create account"}
                </Button>
              </form>

              <div className="text-center text-sm text-muted-foreground mt-6">
                {"Already have an account? "}
                <Link href="/login" className="text-foreground font-medium hover:underline">Sign in</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" /></div>}>
      <SignupInner />
    </Suspense>
  )
}
