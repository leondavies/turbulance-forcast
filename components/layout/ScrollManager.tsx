'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

function scrollToHashOrTop() {
  const hash = window.location.hash
  if (hash && hash.length > 1) {
    const el = document.getElementById(hash.slice(1))
    if (el) {
      el.scrollIntoView({ block: 'start' })
      return
    }
  }
  window.scrollTo({ top: 0, left: 0 })
}

export function ScrollManager() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Route changes: always start at top, unless there's a hash.
  useEffect(() => {
    // Disable browser scroll restoration (prevents "refresh jumps to footer")
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    // Let layout settle, then scroll.
    requestAnimationFrame(() => {
      scrollToHashOrTop()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams?.toString()])

  // In-page hash navigation (e.g. clicking href="#search")
  useEffect(() => {
    const onHashChange = () => scrollToHashOrTop()
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return null
}


