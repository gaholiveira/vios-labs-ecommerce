import { Skeleton } from "./Skeleton";

/**
 * Skeleton específico para página de perfil
 */
export default function ProfilePageSkeleton() {
  return (
    <div className="min-h-screen bg-brand-offwhite py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" variant="rectangular" />
          <Skeleton className="h-5 w-96" variant="rectangular" />
        </div>

        {/* Profile Card */}
        <div className="bg-white border border-gray-100 rounded-sm p-8 space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-40" variant="rectangular" />
            
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" variant="circular" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" variant="text" />
                <Skeleton className="h-4 w-48" variant="text" />
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" variant="rectangular" />
                <Skeleton className="h-12 w-full" variant="rectangular" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" variant="rectangular" />
                <Skeleton className="h-12 w-full" variant="rectangular" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-28" variant="rectangular" />
                <Skeleton className="h-12 w-full" variant="rectangular" />
              </div>
              <Skeleton className="h-12 w-48" variant="rectangular" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
