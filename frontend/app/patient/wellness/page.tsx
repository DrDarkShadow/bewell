"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wind, Eye, Waves, Mountain, Play, Pause, RotateCcw } from "lucide-react"

const techniques = [
  {
    id: "breathing",
    name: "Box Breathing",
    description: "Inhale, hold, exhale, hold -- each for 4 seconds. A proven technique to calm the nervous system.",
    icon: Wind,
    duration: "4 min",
    steps: ["Inhale for 4 seconds", "Hold for 4 seconds", "Exhale for 4 seconds", "Hold for 4 seconds"],
  },
  {
    id: "grounding",
    name: "5-4-3-2-1 Grounding",
    description: "Name 5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste.",
    icon: Eye,
    duration: "5 min",
    steps: ["5 things you can see", "4 things you can touch", "3 things you can hear", "2 things you can smell", "1 thing you can taste"],
  },
  {
    id: "waves",
    name: "Body Scan",
    description: "Progressively relax each muscle group from head to toe. Release tension you are holding.",
    icon: Waves,
    duration: "8 min",
    steps: ["Relax your forehead", "Relax your jaw", "Drop your shoulders", "Relax your hands", "Relax your legs"],
  },
  {
    id: "visualization",
    name: "Safe Place Visualization",
    description: "Imagine a place where you feel completely safe and at peace. Engage all your senses.",
    icon: Mountain,
    duration: "6 min",
    steps: ["Close your eyes", "Picture your safe place", "Notice the sounds", "Feel the temperature", "Stay here as long as you need"],
  },
]

export default function WellnessPage() {
  const [activeTechnique, setActiveTechnique] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [timer, setTimer] = useState(4)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const active = techniques.find((t) => t.id === activeTechnique)

  useEffect(() => {
    if (isRunning && active) {
      intervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCurrentStep((step) => {
              if (step >= active.steps.length - 1) {
                setIsRunning(false)
                return 0
              }
              return step + 1
            })
            return 4
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, active])

  const handleStart = (id: string) => {
    setActiveTechnique(id)
    setCurrentStep(0)
    setTimer(4)
    setIsRunning(true)
  }

  const handleReset = () => {
    setIsRunning(false)
    setCurrentStep(0)
    setTimer(4)
  }

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Wellness Tools
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Guided exercises to help you feel grounded and calm
        </p>
      </div>

      {/* Active Exercise */}
      {activeTechnique && active && (
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-6">
                {isRunning ? (
                  <span className="text-3xl font-bold text-foreground font-mono">
                    {timer}
                  </span>
                ) : (
                  <active.icon className="h-8 w-8 text-foreground" />
                )}
              </div>

              <h2 className="text-lg font-semibold text-foreground">
                {active.name}
              </h2>
              <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-md">
                {active.steps[currentStep]}
              </p>

              {/* Step Indicators */}
              <div className="flex items-center gap-2 mb-6">
                {active.steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-8 rounded-full transition-all ${
                      i <= currentStep ? "bg-foreground" : "bg-muted"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRunning(!isRunning)}
                >
                  {isRunning ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Resume
                    </>
                  )}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setActiveTechnique(null)
                    handleReset()
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Technique Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {techniques.map((technique) => (
          <Card
            key={technique.id}
            className={`transition-all ${
              activeTechnique === technique.id
                ? "ring-2 ring-foreground"
                : ""
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <technique.icon className="h-5 w-5 text-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-foreground">
                      {technique.name}
                    </h3>
                    <Badge variant="secondary" className="text-[10px]">
                      {technique.duration}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    {technique.description}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => handleStart(technique.id)}
                  >
                    <Play className="h-3 w-3 mr-1.5" />
                    Start Exercise
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
