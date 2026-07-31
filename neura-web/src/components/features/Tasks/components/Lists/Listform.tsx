import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { colors } from "../../../../../types/Tasks";
import { ListSchema, type ListFormValues } from "../../schema/list.schema";
import { Label } from "../../../../ui/label";
import { Button } from "../../../../ui/button";
import { Input } from "../../../../ui/input";
import { Textarea } from "../../../../ui/textarea";


// All available colors with their Tailwind bg class written out explicitly
// (Tailwind needs full class strings present at build time — no dynamic interpolation)
const COLOR_OPTIONS: { value: colors; bgClass: string; label: string }[] = [
  { value: "blue",   bgClass: "bg-blue-400",   label: "Blue"   },
  { value: "green",  bgClass: "bg-green-400",  label: "Green"  },
  { value: "red",    bgClass: "bg-red-400",    label: "Red"    },
  { value: "yellow", bgClass: "bg-yellow-400", label: "Yellow" },
  { value: "orange", bgClass: "bg-orange-400", label: "Orange" },
  { value: "pink",   bgClass: "bg-pink-400",   label: "Pink"   },
  { value: "purple", bgClass: "bg-purple-400", label: "Purple" },
  { value: "gray",   bgClass: "bg-gray-400",   label: "Gray"   },
];

interface IProps {
  initialValues?: Partial<ListFormValues>;
  onSubmit: (data: ListFormValues) => void;
  submitLabel: string;
}

function ListForm({ initialValues, onSubmit, submitLabel }: IProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ListFormValues>({
    resolver: zodResolver(ListSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      color: initialValues?.color ?? "blue",
      description: initialValues?.description ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

      {/* ── Name ── */}
      <div>
        <Label className="mb-2">Name</Label>
        <Input {...register("name")} placeholder="e.g. Work, Shopping, Ideas…" />
        {errors.name && (
          <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
        )}
      </div>

      {/* ── Color picker ── */}
      <div>
        <Label className="mb-3">Color</Label>
        <Controller
          name="color"
          control={control}
          render={({ field }) => (
            <div className="flex flex-wrap gap-2 mt-2">
              {COLOR_OPTIONS.map(({ value, bgClass, label }) => {
                const isSelected = field.value === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-label={label}
                    title={label}
                    onClick={() => field.onChange(value)}
                    className={`
                      w-7 h-7 rounded-full transition-all duration-150 cursor-pointer
                      ${bgClass}
                      ${isSelected
                        ? "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110"
                        : "opacity-70 hover:opacity-100 hover:scale-105"
                      }
                    `}
                  />
                );
              })}
            </div>
          )}
        />
        {errors.color && (
          <p className="text-sm text-red-500 mt-1">{errors.color.message}</p>
        )}
      </div>

      {/* ── Description ── */}
      <div>
        <Label className="mb-2">Description (optional)</Label>
        <Textarea {...register("description")} placeholder="Add a description for this list…" className="resize-none" rows={3} />
        {errors.description && (
          <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  );
}

export default ListForm;