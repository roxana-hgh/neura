import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { User } from "@/features/settings/types/user";
import { profileFormSchema, type ProfileFormValues } from "@/features/settings/schemas/profile.schema";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";


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
    },
  });

  const gender = watch("gender");

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

      <div className="flex justify-end">
        <Button type="submit" disabled={!isDirty || isSubmitting}>
          {isSubmitting ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

export default ProfileForm;