import type { colors } from "../../../../types/Tasks"


export const listColorMap: Record<colors, string> = {
  blue:   "bg-blue-400",
  green:  "bg-green-400",
  red:    "bg-red-400",
  yellow: "bg-yellow-400",
  orange: "bg-orange-400",
  pink:   "bg-pink-400",
  purple: "bg-purple-400",
  gray:   "bg-gray-400",
}

export const listCardColorMap: Record<colors, string> = {
  blue:   "text-blue-400",
  green:  "text-green-400",
  red:    "text-red-400",
  yellow: "text-yellow-400",
  orange: "text-orange-400",
  pink:   "text-pink-400",
  purple: "text-purple-400",
  gray:   "text-gray-400",
}

export const getListColorClass = (color: colors): string => listColorMap[color]
export const getListCardIconColorClass = (color: colors): string => listCardColorMap[color]