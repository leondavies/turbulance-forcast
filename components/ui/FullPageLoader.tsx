'use client'

import { LottieAnimation } from '@/components/ui/LottieAnimation'

type FullPageLoaderProps = {
  label?: string
  sublabel?: string
  animationPosition?: 'top' | 'bottom'
}

export function FullPageLoader({
  label = 'Loading…',
  sublabel,
  animationPosition = 'top',
}: FullPageLoaderProps) {
  const Animation = <LottieAnimation className="w-full max-w-sm" />
  const Copy = (
    <div className="text-center">
      <div className="text-base font-semibold text-gray-900 dark:text-gray-50">
        {label}
      </div>
      {sublabel ? (
        <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          {sublabel}
        </div>
      ) : null}
    </div>
  )

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white dark:bg-gray-950">
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-6">
        {animationPosition === 'top' ? Animation : Copy}
        {animationPosition === 'top' ? Copy : Animation}
      </div>
    </div>
  )
}


