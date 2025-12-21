'use client'

import { useEffect, useMemo, useState } from 'react'
import Lottie from 'lottie-react'

type LottieAnimationProps = {
  /** Public path to a Lottie JSON file */
  src?: string
  className?: string
  loop?: boolean
}

const DEFAULT_SRC = '/lottie/airplane%20logistics.json'

export function LottieAnimation({
  src = DEFAULT_SRC,
  className,
  loop = true,
}: LottieAnimationProps) {
  const resolvedSrc = useMemo(() => {
    // Ensure spaces etc. are encoded. If the caller already encoded, this is a no-op.
    return src.includes(' ') ? encodeURI(src) : src
  }, [src])

  const [animationData, setAnimationData] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(resolvedSrc, { cache: 'force-cache' })
        if (!res.ok) throw new Error(`Failed to load Lottie: ${res.status}`)
        const json = (await res.json()) as Record<string, unknown>
        if (!cancelled) setAnimationData(json)
      } catch (e) {
        // If this fails for any reason, we just render nothing and let the caller fallback.
        if (!cancelled) setAnimationData(null)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [resolvedSrc])

  if (!animationData) return null

  return (
    <Lottie
      animationData={animationData}
      loop={loop}
      autoplay
      className={className}
    />
  )
}


