"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { PenLine, Sparkles, Save, BookOpen } from "lucide-react"

const pastEntries = [
  {
    id: 1,
    date: "Feb 20, 2026",
    preview:
      "Today was better than yesterday. I managed to take a walk in the morning and it really shifted my mood. The fresh air helped me think more clearly about the things that have been weighing on me...",
    mood: "Hopeful",
    wordCount: 245,
  },
  {
    id: 2,
    date: "Feb 19, 2026",
    preview:
      "Struggled to get out of bed this morning. The anxiety about next week's presentation is building. I know I need to prepare, but every time I sit down to work on it, my mind goes blank...",
    mood: "Anxious",
    wordCount: 312,
  },
  {
    id: 3,
    date: "Feb 18, 2026",
    preview:
      "Had a really good conversation with my sister today. She reminded me that it's okay to take things one step at a time. Sometimes I forget that progress doesn't have to be linear...",
    mood: "Grateful",
    wordCount: 198,
  },
  {
    id: 4,
    date: "Feb 17, 2026",
    preview:
      "Tried the box breathing exercise from BeWell before my meeting today. It actually helped a lot. My hands weren't shaking and I was able to articulate my points more clearly...",
    mood: "Accomplished",
    wordCount: 276,
  },
]

const prompts = [
  "What is one thing you are grateful for today?",
  "Describe a moment when you felt at peace recently.",
  "What would you tell your future self right now?",
  "What is one small thing you can do for yourself today?",
]

export default function JournalPage() {
  const [entry, setEntry] = useState("")
  const [currentPrompt, setCurrentPrompt] = useState(0)

  const rotatePrompt = () => {
    setCurrentPrompt((prev) => (prev + 1) % prompts.length)
  }

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Journal
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          A private space to reflect, process, and grow
        </p>
      </div>

      {/* Writing Area */}
      <Card className="mb-8">
        <CardContent className="p-6">
          {/* AI Prompt */}
          <div className="flex items-start gap-3 mb-5 rounded-lg bg-muted p-4">
            <Sparkles className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-medium text-foreground mb-0.5">
                Today{"'"}s prompt
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {prompts[currentPrompt]}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs shrink-0"
              onClick={rotatePrompt}
            >
              New prompt
            </Button>
          </div>

          <div className="relative">
            <Textarea
              placeholder="Start writing..."
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              className="min-h-[200px] resize-none text-sm leading-relaxed border-none shadow-none focus-visible:ring-0 p-0"
            />
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {entry.split(/\s+/).filter(Boolean).length} words
              </span>
              {entry.length > 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  Unsaved
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setEntry("")}
                disabled={!entry}
              >
                Clear
              </Button>
              <Button size="sm" className="text-xs" disabled={!entry.trim()}>
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Save Entry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Past Entries */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">
            Previous Entries
          </h2>
        </div>
        <div className="space-y-3">
          {pastEntries.map((e) => (
            <Card key={e.id} className="cursor-pointer hover:bg-muted/30 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <PenLine className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">
                      {e.date}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {e.mood}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {e.wordCount} words
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {e.preview}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
