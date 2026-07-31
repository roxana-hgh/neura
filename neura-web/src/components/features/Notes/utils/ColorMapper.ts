import type { colors } from "../../../../types/Tasks"


export const NotesColorMap: Record<colors, string> = {
  blue:   "bg-blue-100/5 text-blue-600 border-blue-200/20",
  green:  "bg-green-100/8 text-green-600 border-green-200/20",
  red:    "bg-red-100/8 text-red-600 border-red-200/20",
  yellow: "bg-yellow-100/8 text-yellow-600 border-yellow-200/20",
  orange: "bg-orange-100/8 text-orange-600 border-orange-200/20",
  pink:   "bg-pink-100/8 text-pink-600 border-pink-200/20",
  purple: "bg-purple-100/5 text-purple-700 border-purple-200/20",
  gray:   "bg-gray-100/8 text-gray-600 border-gray-200/20",
}

export const getNoteColorClass = (color: colors): string => NotesColorMap[color]