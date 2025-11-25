import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Lesson } from "@prisma/client"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Check if a lesson is global (pre-built)
 * Global lessons have teacherId=null
 */
export function isGlobal(lesson: { teacherId: string | null }): boolean {
  return lesson.teacherId === null
}

