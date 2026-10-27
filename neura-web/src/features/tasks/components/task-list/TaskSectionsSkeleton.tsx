function TaskSectionsSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-5 w-24 animate-pulse rounded bg-muted" />
      <div className="space-y-1 rounded-xl border border-border bg-card p-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 px-3 py-2.5">
            <div className="size-4 animate-pulse rounded bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/5 animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TaskSectionsSkeleton;
