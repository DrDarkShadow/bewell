"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, UserRound, Stethoscope } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

/* ------------------------------------------------------------------ */
/*  Eye animation helpers                                               */
/* ------------------------------------------------------------------ */

interface PupilProps {
  size?: number
  maxDistance?: number
  pupilColor?: string
  forceLookX?: number
  forceLookY?: number
}

function Pupil({ size = 12, maxDistance = 5, pupilColor = "black", forceLookX, forceLookY }: PupilProps) {
  const [mouseX, setMouseX] = useState(0)
  const [mouseY, setMouseY] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { setMouseX(e.clientX); setMouseY(e.clientY) }
    window.addEventListener("mousemove", handler)
    return () => window.removeEventListener("mousemove", handler)
  }, [])

  const pos = (() => {
    if (!ref.current) return { x: 0, y: 0 }
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY }
    const r = ref.current.getBoundingClientRect()
    const dx = mouseX - (r.left + r.width / 2)
    const dy = mouseY - (r.top + r.height / 2)
    const dist = Math.min(Math.sqrt(dx ** 2 + dy ** 2), maxDistance)
    const angle = Math.atan2(dy, dx)
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist }
  })()

  return (
    <div
      ref={ref}
      className="rounded-full"
      style={{ width: size, height: size, backgroundColor: pupilColor, transform: `translate(${pos.x}px, ${pos.y}px)`, transition: "transform 0.1s ease-out" }}
    />
  )
}

interface EyeBallProps {
  size?: number; pupilSize?: number; maxDistance?: number
  eyeColor?: string; pupilColor?: string; isBlinking?: boolean
  forceLookX?: number; forceLookY?: number
}

function EyeBall({ size = 48, pupilSize = 16, maxDistance = 10, eyeColor = "white", pupilColor = "black", isBlinking = false, forceLookX, forceLookY }: EyeBallProps) {
  const [mouseX, setMouseX] = useState(0)
  const [mouseY, setMouseY] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { setMouseX(e.clientX); setMouseY(e.clientY) }
    window.addEventListener("mousemove", handler)
    return () => window.removeEventListener("mousemove", handler)
  }, [])

  const pos = (() => {
    if (!ref.current) return { x: 0, y: 0 }
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY }
    const r = ref.current.getBoundingClientRect()
    const dx = mouseX - (r.left + r.width / 2)
    const dy = mouseY - (r.top + r.height / 2)
    const dist = Math.min(Math.sqrt(dx ** 2 + dy ** 2), maxDistance)
    const angle = Math.atan2(dy, dx)
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist }
  })()

  return (
    <div
      ref={ref}
      className="rounded-full flex items-center justify-center transition-all duration-150"
      style={{ width: size, height: isBlinking ? 2 : size, backgroundColor: eyeColor, overflow: "hidden" }}
    >
      {!isBlinking && (
        <div
          className="rounded-full"
          style={{ width: pupilSize, height: pupilSize, backgroundColor: pupilColor, transform: `translate(${pos.x}px, ${pos.y}px)`, transition: "transform 0.1s ease-out" }}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Login page inner                                                    */
/* ------------------------------------------------------------------ */

function LoginInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isAuthenticated, user } = useAuth()

  const redirectTo = searchParams.get("redirect") || undefined

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Eye animation state
  const [mouseX, setMouseX] = useState(0)
  const [mouseY, setMouseY] = useState(0)
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false)
  const [isBlackBlinking, setIsBlackBlinking] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false)
  const [isPurplePeeking, setIsPurplePeeking] = useState(false)

  const purpleRef = useRef<HTMLDivElement>(null)
  const blackRef = useRef<HTMLDivElement>(null)
  const yellowRef = useRef<HTMLDivElement>(null)
  const orangeRef = useRef<HTMLDivElement>(null)

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(redirectTo || `/${user.role}`)
    }
  }, [isAuthenticated, user, router, redirectTo])

  useEffect(() => {
    const handler = (e: MouseEvent) => { setMouseX(e.clientX); setMouseY(e.clientY) }
    window.addEventListener("mousemove", handler)
    return () => window.removeEventListener("mousemove", handler)
  }, [])

  // Blinking
  useEffect(() => {
    const schedule = (setter: (v: boolean) => void) => {
      const t = setTimeout(() => {
        setter(true)
        setTimeout(() => { setter(false); schedule(setter) }, 150)
      }, Math.random() * 4000 + 3000)
      return t
    }
    const t1 = schedule(setIsPurpleBlinking)
    const t2 = schedule(setIsBlackBlinking)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  useEffect(() => {
    if (isTyping) {
      setIsLookingAtEachOther(true)
      const t = setTimeout(() => setIsLookingAtEachOther(false), 800)
      return () => clearTimeout(t)
    }
    setIsLookingAtEachOther(false)
  }, [isTyping])

  useEffect(() => {
    if (password.length > 0 && showPassword) {
      const t = setTimeout(() => {
        setIsPurplePeeking(true)
        setTimeout(() => setIsPurplePeeking(false), 800)
      }, Math.random() * 3000 + 2000)
      return () => clearTimeout(t)
    }
    setIsPurplePeeking(false)
  }, [password, showPassword, isPurplePeeking])

  const calcPos = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 }
    const r = ref.current.getBoundingClientRect()
    const dx = mouseX - (r.left + r.width / 2)
    const dy = mouseY - (r.top + r.height / 3)
    return {
      faceX: Math.max(-15, Math.min(15, dx / 20)),
      faceY: Math.max(-10, Math.min(10, dy / 30)),
      bodySkew: Math.max(-6, Math.min(6, -dx / 120)),
    }
  }

  const purplePos = calcPos(purpleRef)
  const blackPos = calcPos(blackRef)
  const yellowPos = calcPos(yellowRef)
  const orangePos = calcPos(orangeRef)

  const pwVisible = password.length > 0 && showPassword
  const pwHidden = password.length > 0 && !showPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    const result = await login(email, password)
    if (!result.success) {
      setError(result.error || "Authentication failed.")
      setIsLoading(false)
    }
    // On success: the useEffect watching isAuthenticated+user handles the redirect
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left – Animated characters panel */}
      <div className="relative hidden lg:flex flex-col justify-between bg-foreground p-12 text-background">
        <div className="relative z-20">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-background/10 backdrop-blur-sm flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-background">
                <path d="M12 21C12 21 4 15.5 4 10C4 7.5 6 5 8.5 5C10 5 11.5 6 12 7.5C12.5 6 14 5 15.5 5C18 5 20 7.5 20 10C20 15.5 12 21 12 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 12H10L11 10L13 14L14 12H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-background">BeWell</span>
          </Link>
        </div>

        {/* Animated characters */}
        <div className="relative z-20 flex items-end justify-center h-[500px]">
          <div className="relative" style={{ width: 550, height: 400 }}>
            {/* Purple */}
            <div
              ref={purpleRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: 70, width: 180,
                height: (isTyping || pwHidden) ? 440 : 400,
                backgroundColor: "hsl(var(--chart-2))",
                borderRadius: "10px 10px 0 0", zIndex: 1,
                transform: pwVisible ? "skewX(0deg)" : (isTyping || pwHidden) ? `skewX(${(purplePos.bodySkew || 0) - 12}deg) translateX(40px)` : `skewX(${purplePos.bodySkew || 0}deg)`,
                transformOrigin: "bottom center",
              }}
            >
              <div className="absolute flex gap-8 transition-all duration-700 ease-in-out" style={{ left: pwVisible ? 20 : isLookingAtEachOther ? 55 : 45 + purplePos.faceX, top: pwVisible ? 35 : isLookingAtEachOther ? 65 : 40 + purplePos.faceY }}>
                <EyeBall size={18} pupilSize={7} maxDistance={5} eyeColor="white" pupilColor="hsl(var(--foreground))" isBlinking={isPurpleBlinking} forceLookX={pwVisible ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined} forceLookY={pwVisible ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined} />
                <EyeBall size={18} pupilSize={7} maxDistance={5} eyeColor="white" pupilColor="hsl(var(--foreground))" isBlinking={isPurpleBlinking} forceLookX={pwVisible ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined} forceLookY={pwVisible ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined} />
              </div>
            </div>

            {/* Black */}
            <div
              ref={blackRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: 240, width: 120, height: 310,
                backgroundColor: "hsl(var(--muted-foreground))",
                borderRadius: "8px 8px 0 0", zIndex: 2,
                transform: pwVisible ? "skewX(0deg)" : isLookingAtEachOther ? `skewX(${(blackPos.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)` : (isTyping || pwHidden) ? `skewX(${(blackPos.bodySkew || 0) * 1.5}deg)` : `skewX(${blackPos.bodySkew || 0}deg)`,
                transformOrigin: "bottom center",
              }}
            >
              <div className="absolute flex gap-6 transition-all duration-700 ease-in-out" style={{ left: pwVisible ? 10 : isLookingAtEachOther ? 32 : 26 + blackPos.faceX, top: pwVisible ? 28 : isLookingAtEachOther ? 12 : 32 + blackPos.faceY }}>
                <EyeBall size={16} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="hsl(var(--foreground))" isBlinking={isBlackBlinking} forceLookX={pwVisible ? -4 : isLookingAtEachOther ? 0 : undefined} forceLookY={pwVisible ? -4 : isLookingAtEachOther ? -4 : undefined} />
                <EyeBall size={16} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="hsl(var(--foreground))" isBlinking={isBlackBlinking} forceLookX={pwVisible ? -4 : isLookingAtEachOther ? 0 : undefined} forceLookY={pwVisible ? -4 : isLookingAtEachOther ? -4 : undefined} />
              </div>
            </div>

            {/* Orange */}
            <div
              ref={orangeRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{ left: 0, width: 240, height: 200, zIndex: 3, backgroundColor: "hsl(var(--chart-5))", borderRadius: "120px 120px 0 0", transform: pwVisible ? "skewX(0deg)" : `skewX(${orangePos.bodySkew || 0}deg)`, transformOrigin: "bottom center" }}
            >
              <div className="absolute flex gap-8 transition-all duration-200 ease-out" style={{ left: pwVisible ? 50 : 82 + (orangePos.faceX || 0), top: pwVisible ? 85 : 90 + (orangePos.faceY || 0) }}>
                <Pupil size={12} maxDistance={5} pupilColor="hsl(var(--foreground))" forceLookX={pwVisible ? -5 : undefined} forceLookY={pwVisible ? -4 : undefined} />
                <Pupil size={12} maxDistance={5} pupilColor="hsl(var(--foreground))" forceLookX={pwVisible ? -5 : undefined} forceLookY={pwVisible ? -4 : undefined} />
              </div>
            </div>

            {/* Yellow */}
            <div
              ref={yellowRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{ left: 310, width: 140, height: 230, backgroundColor: "hsl(var(--chart-4))", borderRadius: "70px 70px 0 0", zIndex: 4, transform: pwVisible ? "skewX(0deg)" : `skewX(${yellowPos.bodySkew || 0}deg)`, transformOrigin: "bottom center" }}
            >
              <div className="absolute flex gap-6 transition-all duration-200 ease-out" style={{ left: pwVisible ? 20 : 52 + (yellowPos.faceX || 0), top: pwVisible ? 35 : 40 + (yellowPos.faceY || 0) }}>
                <Pupil size={12} maxDistance={5} pupilColor="hsl(var(--foreground))" forceLookX={pwVisible ? -5 : undefined} forceLookY={pwVisible ? -4 : undefined} />
                <Pupil size={12} maxDistance={5} pupilColor="hsl(var(--foreground))" forceLookX={pwVisible ? -5 : undefined} forceLookY={pwVisible ? -4 : undefined} />
              </div>
              <div className="absolute w-20 h-[4px] rounded-full transition-all duration-200 ease-out" style={{ backgroundColor: "hsl(var(--foreground))", left: pwVisible ? 10 : 40 + (yellowPos.faceX || 0), top: pwVisible ? 88 : 88 + (yellowPos.faceY || 0) }} />
            </div>
          </div>
        </div>

        <div className="relative z-20 flex items-center gap-8 text-sm text-background/50">
          <Link href="/" className="hover:text-background transition-colors">Home</Link>
          <a href="#" className="hover:text-background transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-background transition-colors">Terms of Service</a>
        </div>
      </div>

      {/* Right – Login form */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 text-lg font-semibold mb-12">
            <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-background">
                <path d="M12 21C12 21 4 15.5 4 10C4 7.5 6 5 8.5 5C10 5 11.5 6 12 7.5C12.5 6 14 5 15.5 5C18 5 20 7.5 20 10C20 15.5 12 21 12 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 12H10L11 10L13 14L14 12H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-foreground">BeWell</span>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">Welcome back</h1>
            <p className="text-muted-foreground text-sm">Sign in to your BeWell account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
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
                  placeholder="Enter your password"
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

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(v) => setRememberMe(v === true)}
                />
                <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">Remember for 30 days</Label>
              </div>
              <a href="#" className="text-sm text-foreground hover:underline font-medium">Forgot password?</a>
            </div>

            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-base font-medium" size="lg" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 rounded-lg border border-border bg-muted/50 p-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Demo credentials</p>
            <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">Patient</p>
                <p>patient@bewell.app</p>
                <p>Patient123</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Professional</p>
                <p>doctor@bewell.app</p>
                <p>Doctor123</p>
              </div>
            </div>
          </div>

          {/* Divider + Signup CTAs */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs text-muted-foreground">
                <span className="bg-background px-3">New to BeWell?</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link href="/signup?role=patient">
                <Button variant="outline" className="w-full h-11 flex items-center gap-2 text-sm border-border/60 hover:bg-muted/50">
                  <UserRound className="size-4 shrink-0" />
                  <span>Patient Account</span>
                </Button>
              </Link>
              <Link href="/signup?role=professional">
                <Button variant="outline" className="w-full h-11 flex items-center gap-2 text-sm border-border/60 hover:bg-muted/50">
                  <Stethoscope className="size-4 shrink-0" />
                  <span>Professional</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" /></div>}>
      <LoginInner />
    </Suspense>
  )
}
