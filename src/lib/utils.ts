import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parses a tuple string like "(28, 28, 1)" or "(784,)" into a number array
 * Shared utility used by shape computation modules
 */
export function parseShape(shapeStr: string): number[] | null {
  try {
    const cleaned = shapeStr.replace(/[()]/g, '').trim()
    if (!cleaned) return []
    
    return cleaned.split(',').map(s => {
      const num = parseInt(s.trim())
      if (isNaN(num)) throw new Error(`Invalid dimension: ${s}`)
      return num
    })
  } catch {
    return null
  }
}
