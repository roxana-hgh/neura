import { Link } from "react-router-dom";
import { useTasksStore } from "@/features/tasks/stores/tasksStore";
import { getListColorClass } from "@/features/tasks/utils/colorMapper";
import AddNewList from "@/features/tasks/components/lists/AddNewList";
import { useTaskLists } from "@/features/tasks/hooks/useTasks";
import { useEffect } from "react";
import NoList from "@/features/tasks/components/lists/NoList";

function AllLists() {
  const { data: lists } = useTaskLists();
  const setLists = useTasksStore((s) => s.setLists);

  useEffect(() => {
    if (lists) setLists(lists);
  }, [lists, setLists]);

  return (
    <div className="lists-page container mx-auto ">
      <div className="flex items-center justify-between mb-3">
        <div className=" ">
          <h3 className="font-bold text-xl mb-1">Your Lists</h3>
          <p className="text-muted-foreground text-sm">
            You can see all your Tasks List here
          </p>
        </div>
        <AddNewList />
      </div>
      <div className="mb-3 py-4">
        <ul className="">
          {lists &&
            lists.length > 0 &&
            lists?.map((list) => (
              <li key={list.id} className="py-2 ">
                <Link to={`/list/${list.id}`}>
                  <div className=" flex items-center gap-3">
                    <span
                      className={`p-2 rounded-full ${getListColorClass(list.color)}`}
                    ></span>
                    <h6 className="text-base font-medium ">{list.name}</h6>
                  </div>
                </Link>
              </li>
            ))}
          {lists && lists.length < 1 && <NoList />}
        </ul>
      </div>
    </div>
  );
}

export default AllLists;
