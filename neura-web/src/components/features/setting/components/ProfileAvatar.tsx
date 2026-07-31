import { UserRound } from "lucide-react";

function ProfileAvatar() {
  return (
    <div className="flex size-16 md:size-20 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/20">
      <UserRound className="h-9 w-9" strokeWidth={1.5} />
    </div>
  );
}

export default ProfileAvatar;