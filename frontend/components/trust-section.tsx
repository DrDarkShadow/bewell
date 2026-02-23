"use client"

import { motion } from "framer-motion"
import { Shield, Lock, Eye, UserCheck, Server, FileCheck } from "lucide-react"

export default function TrustSection() {
  return (
    <section id="trust" className="py-24 md:py-32 bg-background">
      <div className="container px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <p className="text-sm font-medium text-muted-foreground mb-3 tracking-wide uppercase">
            Trust & Security
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            Built on a foundation of trust
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed text-pretty">
            Every architectural decision in BeWell prioritizes patient privacy,
            data security, and informed consent. No exceptions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <TrustCard
            icon={<Lock className="h-5 w-5" />}
            title="End-to-End Encryption"
            description="All conversations and data are encrypted in transit and at rest using AES-256."
            delay={0}
          />
          <TrustCard
            icon={<UserCheck className="h-5 w-5" />}
            title="Explicit Consent"
            description="No data is shared with professionals without direct, informed patient approval."
            delay={0.05}
          />
          <TrustCard
            icon={<Shield className="h-5 w-5" />}
            title="HIPAA-Aligned"
            description="Architecture designed to meet HIPAA technical safeguards and privacy requirements."
            delay={0.1}
          />
          <TrustCard
            icon={<Eye className="h-5 w-5" />}
            title="Transparent AI"
            description="Patients always know when AI is analyzing their data and can opt out at any time."
            delay={0.15}
          />
          <TrustCard
            icon={<Server className="h-5 w-5" />}
            title="Data Residency"
            description="Patient data is stored in compliant, region-specific data centers."
            delay={0.2}
          />
          <TrustCard
            icon={<FileCheck className="h-5 w-5" />}
            title="Audit Logging"
            description="Complete audit trail of data access and consent changes for compliance review."
            delay={0.25}
          />
        </div>
      </div>
    </section>
  )
}

function TrustCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode
  title: string
  description: string
  delay: number
}) {
  return (
    <motion.div
      className="rounded-xl border border-border bg-card p-6"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      viewport={{ once: true }}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground mb-4">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </motion.div>
  )
}
