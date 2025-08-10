// app/layout.tsx
import "./globals.css";
import type { ReactNode } from "react";
import GlobalHeader from "@/components/GlobalHeader";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="antialiased">
      <body className="page">
        {/* Full-width hero header */}
        <header className="hero-header-neon">
          <GlobalHeader />
        </header>
        {/* Everything under the hero header */}
        <main className="after-hero">
          <div className="page-content">
            {children}
          </div>
        </main>

        {/* Full-width footer */}
        <footer className="global-footer">
          <div className="inner max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Left: Text Links */}
            <div className="text-sm space-x-6 text-center md:text-left">
              <a href="/contact-us" className="hover:underline text-neon">
                Contact Us
              </a>
              <a href="/about" className="hover:underline text-neon">
                About Us
              </a>
              <span className="block md:inline text-gray-300 mt-2 md:mt-0">
                © {new Date().getFullYear()} Naranja Ltd.
              </span>
            </div>
            {/* Right: Socials */}
            <div className="flex space-x-5 text-xl">
              <a
                href="https://www.linkedin.com/company/naranja"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="hover:text-orange-300 hover:scale-110 transition-transform"
              >
                {/* LinkedIn SVG */}
                <svg width="1.25em" height="1.25em" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 
                  5v14c0 2.761 2.239 5 5 5h14c2.762 0 
                  5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 
                  19h-3v-10h3v10zm-1.5-11.268c-.966 
                  0-1.75-.784-1.75-1.75s.784-1.75 
                  1.75-1.75 1.75.784 1.75 1.75-.784 
                  1.75-1.75 1.75zm15.5 
                  11.268h-3v-5.604c0-1.337-.025-3.063-1.868-3.063-1.868 
                  0-2.154 1.459-2.154 2.967v5.7h-3v-10h2.881v1.367h.041c.401-.761 
                  1.379-1.563 2.841-1.563 3.039 0 
                  3.6 2.001 3.6 4.601v5.595z" />
                </svg>
              </a>
              <a
                href="https://twitter.com/naranjateam"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="hover:text-orange-300 hover:scale-110 transition-transform"
              >
                {/* Twitter SVG */}
                <svg width="1.25em" height="1.25em" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 4.557a9.93 9.93 0 0 
                  1-2.828.775 4.932 4.932 0 0 0 
                  2.165-2.724c-.951.564-2.005.974-3.127 
                  1.195a4.916 4.916 0 0 
                  0-8.38 4.482c-4.083-.205-7.697-2.162-10.125-5.138a4.822 
                  4.822 0 0 0-.664 2.475c0 1.708.87 
                  3.216 2.188 4.099a4.904 4.904 0 0 
                  1-2.229-.616c-.054 2.281 1.581 
                  4.415 3.949 4.89a4.936 4.936 0 0 
                  1-2.224.084c.627 1.956 2.444 
                  3.377 4.6 3.417a9.867 9.867 0 0 
                  1-6.102 2.104c-.396 0-.787-.023-1.175-.069a13.945 
                  13.945 0 0 0 7.548 2.212c9.057 
                  0 14.009-7.513 14.009-14.009 
                  0-.213-.005-.425-.014-.636a10.012 
                  10.012 0 0 0 2.457-2.548z" />
                </svg>
              </a>
              <a
                href="mailto:support@naranja.co.uk"
                aria-label="Email"
                className="hover:text-orange-300 hover:scale-110 transition-transform"
              >
                {/* Email SVG */}
                <svg width="1.25em" height="1.25em" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 13.065l-11.985-8.065h23.97zm11.985-9.065h-23.97c-.555 
                  0-1.015.445-1.015 1v16c0 .555.46 
                  1 1.015 1h23.97c.555 0 1.015-.445 
                  1.015-1v-16c0-.555-.46-1-1.015-1zm-11.985 
                  10.935l-12-8.065v14.13c0 .555.46 
                  1 1.015 1h23.97c.555 0 1.015-.445 
                  1.015-1v-14.13z" />
                </svg>
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
