import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { User } from "@/features/settings/types/user";
import {
  MAX_ASSISTANT_INSTRUCTIONS,
  profileFormSchema,
  type ProfileFormValues,
} from "@/features/settings/schemas/profile.schema";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";


interface ProfileFormProps {
  profile: User;
  onSubmit: (values: ProfileFormValues) => void;
  isSubmitting: boolean;
}

function ProfileForm({ profile, onSubmit, isSubmitting }: ProfileFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: profile.name,
      age: profile.age ? String(profile.age) : "",
      job: profile.job ?? "",
      gender: (profile.gender as ProfileFormValues["gender"]) ?? undefined,
      assistantInstructions: profile.assistantInstructions ?? "",
    },
  });

  const gender = watch("gender");
  const instructionsLength = watch("assistantInstructions")?.length ?? 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      
        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input id="age" type="number" min={13} max={120} placeholder="e.g. 27" {...register("age")} />
          {errors.age && <p className="text-xs text-destructive">{errors.age.message}</p>}
        </div>

        <div className="space-y-2 w-full">
          <Label htmlFor="gender">Gender</Label>
          <Select
            value={gender}
            onValueChange={(value) =>
              setValue("gender", value as ProfileFormValues["gender"], { shouldDirty: true })
            }
          >
            <SelectTrigger id="gender">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="non_binary">Non-binary</SelectItem>
              <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>
     

      <div className="space-y-2">
        <Label htmlFor="job">Job</Label>
        <Input id="job" placeholder="e.g. Software Developer" {...register("job")} />
        {errors.job && <p className="text-xs text-destructive">{errors.job.message}</p>}
      </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <Label htmlFor="assistantInstructions">Custom instructions for the assistant</Label>
          <span
            className={cn(
              "shrink-0 text-xs tabular-nums text-muted-foreground",
              instructionsLength > MAX_ASSISTANT_INSTRUCTIONS && "text-destructive"
            )}
          >
            {instructionsLength}/{MAX_ASSISTANT_INSTRUCTIONS}
          </span>
        </div>
        <Textarea
          id="assistantInstructions"
          dir="auto"
          rows={4}
          placeholder="e.g. Always reply in Persian. Be blunt about my priorities. I work best in the morning, so suggest deep work before noon."
          {...register("assistantInstructions")}
        />
        <p className="text-xs text-muted-foreground">
          Optional. The assistant follows these in every chat: how it talks to you, what to focus on, how you like to work.
        </p>
        {errors.assistantInstructions && (
          <p className="text-xs text-destructive">{errors.assistantInstructions.message}</p>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={!isDirty || isSubmitting}>
          {isSubmitting ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

export default ProfileForm;