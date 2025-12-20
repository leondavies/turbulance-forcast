import { prisma } from './db'

const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes

/**
 * Get cached forecast data if it exists and is not expired
 */
export async function getCachedForecast(cacheKey: string) {
  try {
    const cached = await prisma.forecastCache.findUnique({
      where: { cacheKey }
    })

    if (!cached) return null

    // Check if expired
    if (cached.expiresAt < new Date()) {
      // Delete expired cache
      await prisma.forecastCache.delete({
        where: { cacheKey }
      })
      return null
    }

    // Return parsed payload
    return JSON.parse(cached.payload)
  } catch (error) {
    console.error('Cache read error:', error)
    return null
  }
}

/**
 * Store forecast data in cache
 */
export async function setCachedForecast(cacheKey: string, data: any) {
  try {
    const expiresAt = new Date(Date.now() + CACHE_TTL_MS)

    await prisma.forecastCache.upsert({
      where: { cacheKey },
      update: {
        payload: JSON.stringify(data),
        expiresAt,
        createdAt: new Date()
      },
      create: {
        cacheKey,
        payload: JSON.stringify(data),
        expiresAt
      }
    })
  } catch (error) {
    console.error('Cache write error:', error)
    // Don't throw - caching is optional
  }
}

/**
 * Clean up expired cache entries (run periodically)
 */
export async function cleanExpiredCache() {
  try {
    const result = await prisma.forecastCache.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    })
    return result.count
  } catch (error) {
    console.error('Cache cleanup error:', error)
    return 0
  }
}
