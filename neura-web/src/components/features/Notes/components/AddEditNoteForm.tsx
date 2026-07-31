import { Controller, useForm } from "react-hook-form";
import type { Note } from "../../../../types/Note";
import { zodResolver } from "@hookform/resolvers/zod";
import { NoteSchema, type NoteFormValues } from "../schema/note.schema";
import type { colors } from "../../../../types/Tasks";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";
import { Input } from "../../../ui/input";
import RichEditor from "../../../utils/Editor/Editor";
import { InputAlt } from "../../../ui/inputAlt";

interface Iprops {
  note?: Note;
  onSubmit: (data: NoteFormValues) => void;
  submitLabel?: string;
}

const COLOR_OPTIONS: { value: colors; bgClass: string; label: string }[] = [
  { value: "blue", bgClass: "bg-blue-400", label: "Blue" },
  { value: "green", bgClass: "bg-green-400", label: "Green" },
  { value: "red", bgClass: "bg-red-400", label: "Red" },
  { value: "yellow", bgClass: "bg-yellow-400", label: "Yellow" },
  { value: "orange", bgClass: "bg-orange-400", label: "Orange" },
  { value: "pink", bgClass: "bg-pink-400", label: "Pink" },
  { value: "purple", bgClass: "bg-purple-400", label: "Purple" },
  { value: "gray", bgClass: "bg-gray-400", label: "Gray" },
];

function AddEditNoteForm({ note, onSubmit, submitLabel = "save" }: Iprops) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<NoteFormValues>({
    resolver: zodResolver(NoteSchema),
    defaultValues: {
      title: note ? note.title : "",
      description: note ? note.description : "",
      color: note ? note.color : "blue",
    },
  });

  const editorContent = note?.description ?? "";

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="flex items-center justify-between flex-wrap gap-1 mb-4">
        <div className="grow">
          <div className=" ">
            <h3 className="font-bold text-xl mb-1">
              {note ? `Edit Note` : "Add Note"}
            </h3>
          </div>
        </div>
        <div className="shrink-0 ">
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              size="sm"
              className="px-6 cursor-pointer flex items-center text-emerald-600 bg-emerald-200/10 border border-emerald-300/60 hover:bg-emerald-200/15"
              disabled={isSubmitting}
            >
              {submitLabel}
            </Button>
          </div>
        </div>
      </div>
      <div className="py-3 flex flex-col gap-5">
        {/* ── Name ── */}
        <div>
          <Label className="mb-3 block">Name</Label>
          <Input {...register("title")} placeholder="Title…" />
          {errors.title && (
            <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
          )}
        </div>
        {/* ── Description ── */}
        <div className="">
          <Label className="mb-3 block">Content</Label>

          <RichEditor
        content={editorContent}
        placeholder="Write your note..."
        onChange={(html) => {
          // Empty editor returns "<p></p>", normalize that to null
          const isEmpty = html === "<p></p>" || html.trim() === "";
          setValue("description", isEmpty ? null : html, {
            shouldValidate: true,
          });
        }}
      />
          {errors.description && (
            <p className="text-sm text-red-500 mt-1">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* ── Color picker ── */}
        <div className="px-2">
          <Label className="mb-3 block">Color</Label>
          <Controller
            name="color"
            control={control}
            render={({ field }) => (
              <div className="flex flex-wrap gap-2 mt-2 py-2">
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
                      ${
                        isSelected
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
      </div>
    </form>
  );
}

export default AddEditNoteForm;
