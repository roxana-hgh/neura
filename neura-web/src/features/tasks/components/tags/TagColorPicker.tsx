import { Check } from "lucide-react";
import type { colors } from "@/types/color";
import { TAG_COLORS, TAG_STYLES } from "@/features/tasks/utils/taskTags";
import { cn } from "@/lib/utils";

interface IProps {
  value: colors;
  onChange: (color: colors) => void;
  size?: "sm" | "md";
  className?: string;
}

/** Row of round color swatches; the selected one shows a check. */
function TagColorPicker({ value, onChange, size = "md", className }: IProps) {
  return (
    <div role="radiogroup" aria-label="Tag color" className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {TAG_COLORS.map((color) => {
        const selected = color === value;
        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={TAG_STYLES[color].label}
            title={TAG_STYLES[color].label}
            onClick={() => onChange(color)}
            className={cn(
              "flex cursor-pointer items-center justify-center rounded-full text-white transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              size === "sm" ? "size-5" : "size-6",
              TAG_STYLES[color].dot,
              selected && "ring-2 ring-foreground/30 ring-offset-2 ring-offset-background",
            )}
          >
            {selected && <Check className={size === "sm" ? "size-3" : "size-3.5"} strokeWidth={3} />}
          </button>
        );
      })}
    </div>
  );
}

export default TagColorPicker;
