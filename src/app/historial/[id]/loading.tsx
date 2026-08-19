import { Skeleton } from "@/components/Skeleton";

export default function EditTransactionLoading() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-10 pt-6">
      <div className="mb-6 flex items-center justify-between gap-2">
        <Skeleton className="h-9 w-56 rounded-full" />
        <Skeleton className="h-4 w-10" />
      </div>
      <Skeleton className="mb-4 h-4 w-32" />
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
        <Skeleton className="h-14 w-full rounded-lg" />
      </div>
    </div>
  );
}
