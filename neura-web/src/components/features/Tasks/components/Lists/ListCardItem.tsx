import { Link } from "react-router-dom";
import type { TaskList } from "../../../../../types/Tasks";
import { FolderOpen, List, ListChecksIcon } from "lucide-react";
import { getListCardIconColorClass } from "../../utils/colorMapper";
import ProgressCircle from "../../../../ui/progress-circle";
import { useTaskProgress } from "../../utils/taskProgress";


interface ListCardProps {
    list : TaskList,
    className?: string;
}



function ListCardItem({list, className} : ListCardProps ) {
        const { totalTasks, completedTasks, percentTasks } = useTaskProgress(list.id ?? 0);
    
    return ( 
       <div className={`glass p-3 ${className}`}>
            <Link to={`/list/${list.id}`}>
            <div className="flex mb-2 items-center justify-between">
                <div className="icon">
                    <span className={`${getListCardIconColorClass(list.color)} p-1 aspect-square w-fit block rounded-md `}>
                        <FolderOpen size={20} />
                    </span>
                </div>
                <span className="text-xs text-muted-foreground">
                     {/* flag , tag or date */}
                </span>
            </div>
            <h5 className="font-semibold mb-2">
                {list.name}
            </h5>
            <div className="text-sm text-muted-foreground line-clamp-2 mb-2 pb-1">
              {list.description ?? ""}
            </div>
            <div className="border-t flex items-center gap-4 pt-3 pb-1">
                <ProgressCircle percent={percentTasks} fill size={18} labelEnabled labelPosition="right" colorClass="text-black/50 dark:text-white/50" trackClass="bg-black/5 dark:bg-white/5" />
                <div className="flex items-center gap-2">
                    <ListChecksIcon size={18} /> <small className="text-xs"> {completedTasks}/{totalTasks} Tasks </small>
                </div>
            </div>
            
            </Link>
            
        </div>
     );
}

export default ListCardItem;