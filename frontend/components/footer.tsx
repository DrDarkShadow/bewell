import Link from "next/link"

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="relative w-7 h-7 rounded-md bg-foreground flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-background"
                >
                  <path
                    d="M12 21C12 21 4 15.5 4 10C4 7.5 6 5 8.5 5C10 5 11.5 6 12 7.5C12.5 6 14 5 15.5 5C18 5 20 7.5 20 10C20 15.5 12 21 12 21Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 12H10L11 10L13 14L14 12H16"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-base font-semibold text-foreground">
                BeWell
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Consent-first AI mental health platform. Real-time emotional
              intelligence for patients. Structured clinical insight for
              professionals.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">
              Platform
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/patient"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Patient Portal
                </Link>
              </li>
              <li>
                <Link
                  href="/professional"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Professional Portal
                </Link>
              </li>
              <li>
                <Link
                  href="#platform"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dual-Agent Architecture
                </Link>
              </li>
              <li>
                <Link
                  href="#trust"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Trust & Security
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">
              Resources
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clinical Guidelines
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">
              Compliance
            </h3>
            <ul className="space-y-3">
              <li className="text-sm text-muted-foreground">HIPAA-Aligned</li>
              <li className="text-sm text-muted-foreground">SOC 2 Type II</li>
              <li className="text-sm text-muted-foreground">
                AES-256 Encryption
              </li>
              <li className="text-sm text-muted-foreground">
                Consent-first Architecture
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} BeWell. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            BeWell is not a substitute for professional medical advice,
            diagnosis, or treatment.
          </p>
        </div>
      </div>
    </footer>
  )
}
