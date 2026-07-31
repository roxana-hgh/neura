import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../../ui/collapsible";
import { SearchIcon, X } from "lucide-react";
import { Button } from "../../../ui/button";
import { useNotesStore } from "../stores/notes";
import { Input } from "../../../ui/input";

const horizontalStyle = {
  closed: "w-0 overflow-hidden transition-[width] duration-300",
  open: "w-60 transition-[width] duration-300",
};

function SearchNote() {
  const [isOpen, setIsOpen] = useState(false);
  const search = useNotesStore((state) => state.search);
  const setSearch = useNotesStore((state) => state.setSearch);

  
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
          placeholder="Search Note"
          className="max-w-md w-full rounded-lg outline-0 focus:ring-0"
        />
      </CollapsibleContent>
    </Collapsible>
  );
}

export default SearchNote;
