'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <Image
                src="/turbcast-logo.png"
                alt="TurbCast"
                width={240}
                height={160}
                priority
                className="h-10 w-auto transform group-hover:scale-[1.03] transition-transform duration-200"
              />
              <span className="sr-only">TurbCast</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-gray-700 hover:text-blue-600 transition-colors font-semibold text-lg"
            >
              Home
            </Link>
            <Link
              href="/faq"
              className="text-gray-700 hover:text-blue-600 transition-colors font-semibold text-lg"
            >
              FAQ
            </Link>
            <Link
              href="/about"
              className="text-gray-700 hover:text-blue-600 transition-colors font-semibold text-lg"
            >
              About
            </Link>
            <Link
              href="/#search"
              className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Search Flights
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-blue-600"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <nav className="flex flex-col space-y-3">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 hover:text-blue-600 transition-colors font-semibold text-lg py-2 px-3 rounded-lg hover:bg-gray-50"
              >
                Home
              </Link>
              <Link
                href="/faq"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 hover:text-blue-600 transition-colors font-semibold text-lg py-2 px-3 rounded-lg hover:bg-gray-50"
              >
                FAQ
              </Link>
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 hover:text-blue-600 transition-colors font-semibold text-lg py-2 px-3 rounded-lg hover:bg-gray-50"
              >
                About
              </Link>
              <Link
                href="/#search"
                onClick={() => setMobileMenuOpen(false)}
                className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg text-center"
              >
                Search Flights
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
