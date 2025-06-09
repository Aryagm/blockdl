import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parses a tuple string like "(28, 28, 1)" or "(784,)" into a number array
 * Shared utility used by shape computation modules
 */
export function parseShape(shapeStr: string): number[] | null {
  try {
    const cleaned = shapeStr.replace(/[()]/g, "").trim();
    if (!cleaned) return [];

    return cleaned.split(",").map((s) => {
      const num = parseInt(s.trim());
      if (isNaN(num)) throw new Error(`Invalid dimension: ${s}`);
      return num;
    });
  } catch {
    return null;
  }
}

/**
 * Parses tuple or number input like "(3,3)" or "3" into a tuple [number, number]
 * Used for kernel sizes, strides, etc. in layer parameters
 */
export function parseTupleOrNumber(input: string): [number, number] | null {
  try {
    // Handle single number case like "2"
    if (!/[(),]/.test(input)) {
      const num = parseInt(input.trim());
      if (!isNaN(num)) return [num, num];
    }

    // Handle tuple case like "(2,2)"
    const cleaned = input.replace(/[()]/g, "").trim();
    const parts = cleaned.split(",").map((s) => parseInt(s.trim()));

    if (parts.length === 2 && !parts.some(isNaN)) {
      return [parts[0], parts[1]];
    }
  } catch {
    // ignore
  }
  return null;
}
