import { useState } from "react";
import { Input } from "../../../ui/input";
import { useTasksStore } from "../stores/tasks";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../../ui/collapsible";
import { Button } from "../../../ui/button";
import { SearchIcon, X } from "lucide-react";

const horizontalStyle = {
  closed: "w-0 overflow-hidden transition-[width] duration-300",
  open: "w-60 transition-[width] duration-300",
};

function TasksSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const search = useTasksStore((state) => state.search);
  const setSearch = useTasksStore((state) => state.setSearch);
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full flex items-center gap-2"
    >
      <CollapsibleTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          {isOpen ? <X/> : <SearchIcon /> }
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent
        className={`${isOpen ? horizontalStyle.open : horizontalStyle.closed} order-first `}
      >
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Task"
          className="max-w-md w-full rounded-lg outline-0 focus:ring-0"
        />
      </CollapsibleContent>
    </Collapsible>
  );
}

export default TasksSearch;
