import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-40" />
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-16 w-full max-w-lg rounded-lg" />
      <Skeleton className="h-9 w-full max-w-md" />
      <Skeleton className="h-56 w-full max-w-sm rounded-lg" />
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  );
}
