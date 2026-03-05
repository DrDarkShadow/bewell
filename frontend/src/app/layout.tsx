import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Anonomus - Secure Messaging',
  description: 'Identity-hidden, encrypted real-time messaging',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
