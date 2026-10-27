import { useEffect } from "react";
import { useTasksStore } from "@/features/tasks/stores/tasksStore";
import AddNewList from "@/features/tasks/components/lists/AddNewList";
import ListCardItem from "@/features/tasks/components/lists/ListCardItem";
import NoList from "@/features/tasks/components/lists/NoList";
import { useTaskLists } from "@/features/tasks/hooks/useTasks";
import PageHeader from "@/components/shared/PageHeader";

function AllLists() {
  const { data: lists, isPending } = useTaskLists();
  const setLists = useTasksStore((s) => s.setLists);

  useEffect(() => {
    if (lists) setLists(lists);
  }, [lists, setLists]);

  return (
    <div className="lists-page container mx-auto space-y-5">
      <PageHeader
        eyebrow="Tasks"
        title="Lists"
        description={
          lists?.length
            ? `${lists.length} ${lists.length === 1 ? "list" : "lists"} to keep your tasks organised.`
            : "Keep related tasks together."
        }
        actions={<AddNewList />}
      />

      {isPending ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      ) : lists && lists.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {lists.map((list) => (
            <ListCardItem key={list.id} list={list} />
          ))}
        </div>
      ) : (
        <NoList />
      )}
    </div>
  );
}

export default AllLists;
