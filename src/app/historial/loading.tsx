import { Skeleton } from "@/components/Skeleton";

export default function HistorialLoading() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-10 pt-6">
      <div className="mb-6 flex items-center justify-between gap-2">
        <Skeleton className="h-9 w-56 rounded-full" />
        <Skeleton className="h-4 w-10" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
