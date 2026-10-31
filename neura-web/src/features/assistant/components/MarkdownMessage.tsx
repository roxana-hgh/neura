import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

// Every block gets dir="auto" so Persian and English lines each pick their own direction
export function MarkdownMessage({ content, className }: MarkdownMessageProps) {
  return (
    <div className={cn("space-y-2 wrap-break-word text-sm leading-relaxed", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p dir="auto" className="my-0">{children}</p>,
          h1: ({ children }) => <h3 dir="auto" className="pt-1 text-base font-semibold">{children}</h3>,
          h2: ({ children }) => <h3 dir="auto" className="pt-1 text-base font-semibold">{children}</h3>,
          h3: ({ children }) => <h4 dir="auto" className="pt-1 text-sm font-semibold">{children}</h4>,
          h4: ({ children }) => <h4 dir="auto" className="text-sm font-semibold">{children}</h4>,
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          ul: ({ children }) => (
            <ul dir="auto" className="my-1 space-y-1 ps-5 [&>li]:list-disc [&>li]:marker:text-muted-foreground">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol dir="auto" className="my-1 space-y-1 ps-5 [&>li]:list-decimal [&>li]:marker:text-muted-foreground">
              {children}
            </ol>
          ),
          li: ({ children }) => <li dir="auto" className="ps-0.5">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote dir="auto" className="border-s-2 border-border ps-3 text-muted-foreground">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-3 border-border" />,
          pre: ({ children }) => (
            <pre dir="ltr" className="no-scrollbar overflow-x-auto rounded-xl bg-muted p-3.5 text-xs leading-relaxed [&_code]:bg-transparent [&_code]:p-0">
              {children}
            </pre>
          ),
          code: ({ children }) => (
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{children}</code>
          ),
          table: ({ children }) => (
            <div className="no-scrollbar my-1 overflow-x-auto rounded-xl border">
              <table dir="auto" className="w-full border-collapse text-xs">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
          th: ({ children }) => (
            <th className="border-b px-3 py-2 text-start font-semibold">{children}</th>
          ),
          td: ({ children }) => <td className="border-b px-3 py-2 align-top">{children}</td>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline decoration-muted-foreground/50 underline-offset-2 transition-colors hover:decoration-foreground"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
