import type { FocusSessionTag } from "@/features/focus/types/focusSession";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TAG_LABELS } from "@/features/focus/utils/time";


const TAGS: FocusSessionTag[] = ["work", "personal", "study", "break", "other"];

interface Props {
  name: string;
  onNameChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  tag: FocusSessionTag | undefined;
  onTagChange: (v: FocusSessionTag | undefined) => void;
}

function SessionFormFields({ name, onNameChange, description, onDescriptionChange, tag, onTagChange }: Props) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <label htmlFor="session-name" className="text-sm font-medium text-stone-700 dark:text-neutral-200">
  Session name
</label>
        <Input id="session-name" value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="e.g. Deep work on Neura API" />
      </div>

      <div className="grid gap-2">
        <label htmlFor="session-tag" className="text-sm font-medium">Category</label>
        <Select value={tag ?? "none"} onValueChange={(v) => onTagChange(v === "none" ? undefined : (v as FocusSessionTag))}>
          <SelectTrigger id="session-tag"><SelectValue placeholder="Select a category..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {TAGS.map((t) => <SelectItem key={t} value={t}>{TAG_LABELS[t]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <label htmlFor="session-description" className="text-sm font-medium">Description (optional)</label>
        <Textarea id="session-description" value={description} onChange={(e) => onDescriptionChange(e.target.value)} placeholder="What did you work on?" rows={3} />
      </div>
    </div>
  );
}

export default SessionFormFields;