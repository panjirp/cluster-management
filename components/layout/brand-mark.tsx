export function BrandMark() {
  return (
    <div className="mb-4 flex items-center gap-3 px-1">
      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-[0_0_20px_-4px_var(--primary)]">
        BC
      </div>
      <div>
        <p className="text-sm font-semibold leading-tight">Barcelona Cove</p>
        <p className="text-xs text-muted-foreground">Portal Cluster</p>
      </div>
    </div>
  );
}
