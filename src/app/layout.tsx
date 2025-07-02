import type { Metadata } from 'next'
import './globals.css'


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* ✅ Google Fonts CDN link for Geist */}
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400;600&family=Geist+Mono&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
