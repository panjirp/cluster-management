import { Badge } from "@/components/ui/badge";
import type { PermitStatus } from "@/app/generated/prisma/client";

const statusConfig: Record<PermitStatus, { label: string; className: string }> = {
  PENDING: { label: "Menunggu", className: "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  APPROVED: { label: "Disetujui", className: "border-transparent bg-green-500/15 text-green-700 dark:text-green-400" },
  REJECTED: { label: "Ditolak", className: "border-transparent bg-red-500/15 text-red-700 dark:text-red-400" },
};

export function PermitStatusBadge({ status }: { status: PermitStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
