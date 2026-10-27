import { toast } from "@/lib/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile, useUpdateProfile } from "@/features/settings/hooks/useProfile";
import ProfileAvatar from "@/features/settings/components/ProfileAvatar";
import ProfileForm from "@/features/settings/components/ProfileForm";


function AccountSection() {
  const { data: profile, isLoading, isError } = useProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (isError || !profile) {
    return <p className="text-sm text-destructive">Couldn't load your profile. Try refreshing the page.</p>;
  }

  return (
    <section className="glass p-4 md:p-6">
      <div className="flex items-center gap-4">
        <ProfileAvatar />
        <div>
          <p className="text-base font-medium text-foreground">{profile.name}</p>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
        </div>
      </div>

      <div className="mt-6 border-t border-border pt-6">
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
    </section>
  );
}

export default AccountSection;