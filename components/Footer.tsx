'use client'

import Link from 'next/link'
import { FaLinkedin, FaTwitter, FaEnvelope } from 'react-icons/fa'

export default function Footer() {
  return (
    <footer className="bg-teal-800 text-white py-8 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Left: Text Links */}
        <div className="text-sm space-x-6 text-center md:text-left">
          <Link href="/contact-us" className="hover:underline">
            Contact Us
          </Link>
          <Link href="/about" className="hover:underline">
            About Us
          </Link>
          <span className="block md:inline text-gray-300 mt-2 md:mt-0">
            © {new Date().getFullYear()} Naranja Ltd.
          </span>
        </div>

        {/* Right: Socials */}
        <div className="flex space-x-5 text-xl">
          <a
            href="https://www.linkedin.com/company/naranja"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="hover:text-orange-300 hover:scale-110 transition-transform"
          >
            <FaLinkedin />
          </a>
          <a
            href="https://twitter.com/naranjateam"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Twitter"
            className="hover:text-orange-300 hover:scale-110 transition-transform"
          >
            <FaTwitter />
          </a>
          <a
            href="mailto:support@naranja.co.uk"
            aria-label="Email"
            className="hover:text-orange-300 hover:scale-110 transition-transform"
          >
            <FaEnvelope />
          </a>
        </div>
      </div>
    </footer>
  )
}
