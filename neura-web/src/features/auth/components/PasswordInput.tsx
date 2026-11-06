import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { InputAlt } from "@/components/ui/inputAlt";
import { cn } from "@/lib/utils";

function PasswordInput({
  className,
  ...props
}: Omit<ComponentProps<typeof InputAlt>, "type">) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <InputAlt {...props} type={show ? "text" : "password"} className={cn("pr-10", className)} />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-neutral-500 hover:text-neutral-200 lg:text-neutral-400 lg:hover:text-neutral-700"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export default PasswordInput;