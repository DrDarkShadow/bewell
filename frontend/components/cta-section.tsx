"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

export default function CTASection() {
  return (
    <section className="py-24 md:py-32 bg-foreground">
      <div className="container px-4 md:px-6">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold tracking-tight text-background sm:text-4xl text-balance">
            Ready to begin?
          </h2>
          <p className="mt-4 text-background/70 leading-relaxed text-pretty">
            Whether you are seeking support or providing it, BeWell meets you
            where you are with intelligence that respects your role.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto gap-2"
              asChild
            >
              <Link href="/patient">
                Continue as Patient
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto gap-2 border-background/20 text-background hover:bg-background/10 hover:text-background"
              asChild
            >
              <Link href="/professional">
                Continue as Professional
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
