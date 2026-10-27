import { FolderPlus } from "lucide-react";
import AddNewList from "@/features/tasks/components/lists/AddNewList";
import EmptyState from "@/components/shared/EmptyState";

function NoList() {
  return (
    <EmptyState
      icon={FolderPlus}
      title="No lists yet"
      description="Group related tasks into lists, like Work, Home or a project."
      action={<AddNewList />}
    />
  );
}

export default NoList;
