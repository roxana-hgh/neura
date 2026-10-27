import type { colors } from "@/types/color";

interface NoteColorStyle {
  label: string;
  /** Solid dot used in pickers and color tags */
  swatch: string;
}

export const NOTE_COLORS: Record<colors, NoteColorStyle> = {
  gray: {
    label: "Default",
    swatch: "bg-zinc-400",
  },
  yellow: {
    label: "Yellow",
    swatch: "bg-yellow-400",
  },
  orange: {
    label: "Orange",
    swatch: "bg-orange-400",
  },
  red: {
    label: "Red",
    swatch: "bg-red-400",
  },
  pink: {
    label: "Pink",
    swatch: "bg-pink-400",
  },
  purple: {
    label: "Purple",
    swatch: "bg-purple-400",
  },
  blue: {
    label: "Blue",
    swatch: "bg-blue-400",
  },
  green: {
    label: "Green",
    swatch: "bg-green-400",
  },
};

export const NOTE_COLOR_OPTIONS = Object.keys(NOTE_COLORS) as colors[];

/** Older notes may carry "default" or an unknown value from the API */
export const getNoteColor = (color: string | null | undefined): NoteColorStyle =>
  NOTE_COLORS[color as colors] ?? NOTE_COLORS.gray;
