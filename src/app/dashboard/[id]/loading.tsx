import { Skeleton } from "@/components/Skeleton";

export default function CarDetailLoading() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-10 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-9 w-56 rounded-full" />
        <Skeleton className="h-4 w-10" />
      </div>
      <Skeleton className="mb-4 h-4 w-32" />
      <Skeleton className="mb-4 h-6 w-48" />
      <Skeleton className="mb-4 h-48 w-full rounded-2xl" />
      <Skeleton className="mb-4 h-16 w-full rounded-2xl" />
      <Skeleton className="mb-4 h-40 w-full rounded-2xl" />
      <div className="space-y-2">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    </div>
  );
}
