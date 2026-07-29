import { Badge } from "@/components/ui/badge";
import type { ComplaintStatus } from "@/app/generated/prisma/client";

const statusConfig: Record<ComplaintStatus, { label: string; className: string }> = {
  OPEN: { label: "Pending", className: "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  IN_PROGRESS: { label: "Diproses", className: "border-transparent bg-blue-500/15 text-blue-700 dark:text-blue-400" },
  RESOLVED: { label: "Selesai", className: "border-transparent bg-green-500/15 text-green-700 dark:text-green-400" },
};

export function ComplaintStatusBadge({ status }: { status: ComplaintStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
