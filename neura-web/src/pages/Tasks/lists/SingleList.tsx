import { Link, useNavigate, useParams } from "react-router-dom";
import { useTasksByList } from "../../../components/features/Tasks/utils/taskSelectors";
import AddNewTask from "../../../components/features/Tasks/components/AddTask";
import TasksList from "../../../components/features/Tasks/components/TasksList/TasksList";
import { useTasksStore } from "../../../components/features/Tasks/stores/tasks";
import { getListColorClass } from "../../../components/features/Tasks/utils/colorMapper";
import EditList from "../../../components/features/Tasks/components/Lists/editList";
import { Button } from "../../../components/ui/button";
import { Trash } from "lucide-react";
import AlertDialog from "../../../components/utils/AlertDialog";
import { useMemo, useState } from "react";
import {
  useDeleteList,
  useTaskList,
} from "../../../components/features/Tasks/hooks/useTasks";
import Loader from "../../../components/ui/loader";
import { sortTasksByDueStatus } from "../../../components/features/Tasks/utils/sortTasksByDueStatus";

function SingleList() {
  const params = useParams();
  const listId = params.id ?? "";

  const navigate = useNavigate();

  const { data: list, isPending : isLoading } = useTaskList(listId);
  const { data: Tasks,  isPending :isTasksLoading } = useTasksByList(listId);

    const sortedTasks = useMemo(
    () => (Tasks ? sortTasksByDueStatus(Tasks) : []),
    [Tasks],
  );


  const [alertOpen, setAlertOpen] = useState(false);


  const { mutate: deleteList } = useDeleteList();
  const removeFromStore = useTasksStore((s) => s.removeList);

  const deleteHandler = () => {
    if (!list || !params.id) return;
    deleteList(list.id, {
      onSuccess: () => {
        removeFromStore(list.id);
        navigate("/lists");   
      },
    });
  };

  return (
    <>
      <div className="tasks-page container mx-auto ">
        {!isLoading && list ? (
          <>
            <div className="flex items-start justify-between  mb-3">
              <div className="flex items-start gap-2">
                <span
                  className={`p-2 rounded-full mt-2 ${getListColorClass(list?.color ?? "gray")}`}
                ></span>
                <div className="">
                  <div className="mb-1 flex items-center gap-4">
                    <h3 className="font-bold text-xl  ">{list?.name}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {list.description ?? ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <AddNewTask defaultListId={list?.id} />
                {list && <EditList list={list} />}
                <Button
                  className="text-red-500 bg-red-200/10 border border-red-400/60 hover:bg-red-400/30 cursor-pointer"
                  type="button"
                  size="icon-sm"
                  onClick={() => setAlertOpen(true)}
                >
                  <Trash />
                </Button>
              </div>
            </div>
            <div className="mb-3">
              
              {!isTasksLoading ? (
                <TasksList tasks={sortedTasks} label={list?.name ?? " "} />) 
              : (
                <div className="py-5">
                  <Loader />
                </div>
              )
              }
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-2">List Not Found</h2>
            <p className="text-muted-foreground">
              The list you're looking for doesn't exist. It may have been
              deleted.
            </p>
            <div className="mt-4">
              <Link to="/tasks">
                <Button variant="outline">Back to all Tasks</Button>
              </Link>
            </div>
          </div>
        )}

        {isLoading && <Loader screen />}
      </div>

      {alertOpen && (
        <AlertDialog
          title="Remove Note"
          description={`Are you Sure you want to Remove '${list?.name}' ? `}
          acceptButtonText="Remove"
          AcceptButtonVariant="danger"
          open={alertOpen}
          setOpen={setAlertOpen}
          onConfirm={deleteHandler}
        />
      )}
    </>
  );
}

export default SingleList;
