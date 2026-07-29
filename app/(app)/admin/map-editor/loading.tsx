import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-10 w-full max-w-lg rounded-lg" />
      <Skeleton className="aspect-[907/1734] max-h-[70vh] w-full rounded-xl" />
    </div>
  );
}
