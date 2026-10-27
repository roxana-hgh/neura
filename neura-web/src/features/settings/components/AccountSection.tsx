import { format } from "date-fns";
import { toast } from "@/lib/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile, useUpdateProfile } from "@/features/settings/hooks/useProfile";
import ProfileAvatar from "@/features/settings/components/ProfileAvatar";
import ProfileForm from "@/features/settings/components/ProfileForm";
import SettingsSection from "@/features/settings/components/SettingsSection";

function AccountSection() {
  const { data: profile, isLoading, isError } = useProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  return (
    <SettingsSection
      title="Profile"
      description="Your name and a few details the assistant uses to tailor its suggestions."
    >
      {isLoading ? (
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <Skeleton className="size-14 rounded-full md:size-16" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        </div>
      ) : isError || !profile ? (
        <p className="text-sm text-destructive">Couldn't load your profile. Try refreshing the page.</p>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <ProfileAvatar name={profile.name} image={profile.image} />
            <div className="min-w-0">
              <p dir="auto" className="truncate font-medium">{profile.name}</p>
              <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
              {profile.createdAt && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Member since {format(new Date(profile.createdAt), "MMMM yyyy")}
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 border-t border-border pt-5">
            <ProfileForm
              profile={profile}
              isSubmitting={isPending}
              onSubmit={(values) =>
                updateProfile(
                  {
                    name: values.name,
                    age: values.age ? Number(values.age) : null,
                    job: values.job || null,
                    gender: values.gender || null,
                  },
                  {
                    onSuccess: () => toast.success("Profile updated"),
                    onError: () => toast.error("Failed to update profile"),
                  }
                )
              }
            />
          </div>
        </>
      )}
    </SettingsSection>
  );
}

export default AccountSection;
