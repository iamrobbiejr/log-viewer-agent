import { Skeleton } from "./ui/Skeleton";

export default function MachineCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 p-4 rounded-sm flex flex-col">
      {/* Top row */}
      <div className="flex items-start gap-2">
        <div className="mt-1.5 flex-shrink-0 flex justify-center w-3">
          <Skeleton className="w-1.5 h-1.5 rounded-full" />
        </div>
        <Skeleton className="w-24 h-3 rounded" />
      </div>

      {/* Middle row */}
      <div className="mt-2 ml-5 space-y-1.5 flex-1">
        <Skeleton className="w-32 h-2.5 rounded" />
        <Skeleton className="w-20 h-2.5 rounded" />
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <Skeleton className="w-12 h-4 rounded" />
        <Skeleton className="w-10 h-3 rounded" />
      </div>
    </div>
  );
}
