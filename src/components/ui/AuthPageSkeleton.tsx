import { Skeleton } from "./Skeleton";

/**
 * Skeleton específico para páginas de autenticação
 * (Login, Register, Forgot Password, etc)
 */
export default function AuthPageSkeleton() {
  return (
    <div className="min-h-screen bg-brand-offwhite flex items-center justify-center px-6 py-24">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-100 rounded-sm p-8 md:p-12 space-y-8">
          {/* Logo/Header */}
          <div className="text-center space-y-4">
            <Skeleton className="h-8 w-32 mx-auto" variant="rectangular" />
            <Skeleton className="h-5 w-64 mx-auto" variant="rectangular" />
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" variant="rectangular" />
              <Skeleton className="h-12 w-full" variant="rectangular" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" variant="rectangular" />
              <Skeleton className="h-12 w-full" variant="rectangular" />
            </div>
            <Skeleton className="h-12 w-full" variant="rectangular" />
          </div>

          {/* Links/Footer */}
          <div className="space-y-3 text-center">
            <Skeleton className="h-4 w-48 mx-auto" variant="text" />
            <Skeleton className="h-4 w-40 mx-auto" variant="text" />
          </div>
        </div>
      </div>
    </div>
  );
}
