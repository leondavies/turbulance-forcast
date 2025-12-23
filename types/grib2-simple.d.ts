/**
 * Type definitions for grib2-simple
 * This module doesn't have official TypeScript types
 */

declare module 'grib2-simple' {
  export interface GribMessage {
    discipline: number
    parameterCategory: number
    parameterNumber: number
    level: number
    nx?: number
    ny?: number
    grid?: {
      nx?: number
      ny?: number
      latitudes?: number[]
      longitudes?: number[]
    }
    values?: number[]
  }

  export interface GribData {
    messages: GribMessage[]
  }

  export default class Grib2 {
    static parse(buffer: Buffer): Promise<GribData>
  }
}
