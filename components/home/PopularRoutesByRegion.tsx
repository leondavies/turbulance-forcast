'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { TopRouteGroup } from '@/lib/seo/topRoutes'
import { toRouteSlug } from '@/lib/seo/topRoutes'

type Props = {
  groups: TopRouteGroup[]
  // how many region cards to show on desktop before "Show all regions"
  initialRegionCount?: number
  // how many routes per region before "Show more"
  initialRouteCount?: number
}

export function PopularRoutesByRegion({
  groups,
  initialRegionCount = 4,
  initialRouteCount = 6,
}: Props) {
  const [showAllRegions, setShowAllRegions] = useState(false)
  const [expandedRegions, setExpandedRegions] = useState<Record<string, boolean>>({})
  const [mobileRegion, setMobileRegion] = useState(groups[0]?.title ?? '')

  const selectedGroup = useMemo(
    () => groups.find((g) => g.title === mobileRegion) ?? groups[0],
    [groups, mobileRegion]
  )

  return (
    <div className="mx-auto max-w-6xl">
      {/* Mobile: pick a region first (dramatically less scroll) */}
      <div className="sm:hidden">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Region
            </label>
            <select
              value={mobileRegion}
              onChange={(e) => setMobileRegion(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base font-medium text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            >
              {groups.map((g) => (
                <option key={g.title} value={g.title}>
                  {g.title}
                </option>
              ))}
            </select>
            {selectedGroup?.description ? (
              <p className="mt-2 text-sm text-gray-600">{selectedGroup.description}</p>
            ) : null}
          </div>

          {selectedGroup ? (
            <>
              <div className="grid gap-2">
                {selectedGroup.routes.slice(0, 10).map((r, idx) => {
                  const slug = toRouteSlug(r.origin, r.destination)
                  const expanded = !!expandedRegions[selectedGroup.title]
                  const hidden = !expanded && idx >= initialRouteCount
                  return (
                    <Link
                      key={`${selectedGroup.title}-${slug}`}
                      href={`/routes/${slug}`}
                      className={[
                        'group flex items-center justify-between rounded-xl border bg-white px-4 py-3 hover:bg-muted/30 transition-colors',
                        hidden ? 'hidden' : '',
                      ].join(' ')}
                    >
                      <span className="font-semibold text-gray-900">
                        {r.origin} → {r.destination}
                      </span>
                      <span className="text-sm text-primary font-medium group-hover:underline">
                        View
                      </span>
                    </Link>
                  )
                })}
              </div>

              {selectedGroup.routes.length > initialRouteCount ? (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedRegions((prev) => ({
                        ...prev,
                        [selectedGroup.title]: !prev[selectedGroup.title],
                      }))
                    }
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    {expandedRegions[selectedGroup.title] ? 'Show less' : 'Show more'}
                  </button>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      {/* Desktop/tablet: grid of region cards + per-region "show more" */}
      <div className="hidden sm:grid gap-6 md:grid-cols-2">
        {groups.map((group, idx) => {
          const regionVisible = showAllRegions || idx < initialRegionCount
          const expanded = !!expandedRegions[group.title]
          const topRoutes = group.routes.slice(0, 10)

          return (
            <div
              key={group.title}
              className={regionVisible ? 'rounded-2xl border bg-white p-5 sm:p-6 shadow-sm' : 'hidden'}
            >
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900">{group.title}</h3>
                {group.description ? (
                  <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                ) : null}
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {topRoutes.map((r, routeIdx) => {
                  const slug = toRouteSlug(r.origin, r.destination)
                  const hidden = !expanded && routeIdx >= initialRouteCount
                  return (
                    <Link
                      key={`${group.title}-${slug}`}
                      href={`/routes/${slug}`}
                      className={[
                        'group flex items-center justify-between rounded-xl border bg-white px-4 py-3 hover:bg-muted/30 transition-colors',
                        hidden ? 'hidden' : '',
                      ].join(' ')}
                    >
                      <span className="font-semibold text-gray-900">
                        {r.origin} → {r.destination}
                      </span>
                      <span className="text-sm text-primary font-medium group-hover:underline">
                        View
                      </span>
                    </Link>
                  )
                })}
              </div>

              {group.routes.length > initialRouteCount ? (
                <div className="mt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedRegions((prev) => ({
                        ...prev,
                        [group.title]: !prev[group.title],
                      }))
                    }
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    {expanded ? 'Show less' : 'Show more'}
                  </button>
                  <span className="text-xs text-gray-500">
                    Showing {expanded ? Math.min(10, group.routes.length) : Math.min(initialRouteCount, group.routes.length)} of {Math.min(10, group.routes.length)}
                  </span>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      {/* Desktop/tablet: Show all regions toggle */}
      {groups.length > initialRegionCount ? (
        <div className="hidden sm:flex justify-center mt-8">
          <button
            type="button"
            onClick={() => setShowAllRegions((v) => !v)}
            className="rounded-xl border bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-muted/30 transition-colors"
          >
            {showAllRegions ? 'Show fewer regions' : 'Show all regions'}
          </button>
        </div>
      ) : null}
    </div>
  )
}


