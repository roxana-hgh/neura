import { UserRound } from "lucide-react";

function initials(name?: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((p) => [...p][0]).join("").toUpperCase();
}

function ProfileAvatar({ name, image }: { name?: string | null; image?: string | null }) {
  const letters = initials(name);

  if (image) {
    return <img src={image} alt="" className="size-14 rounded-full object-cover md:size-16" />;
  }

  return (
    <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary md:size-16 dark:bg-primary/20">
      {letters || <UserRound className="size-7" strokeWidth={1.5} />}
    </div>
  );
}

export default ProfileAvatar;
