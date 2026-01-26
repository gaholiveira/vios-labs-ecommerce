import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Loading específico para página de Contato
 * Replica o layout: Hero + Cards de Contato + Formulário
 */
export default function ContatoLoading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Skeleton */}
      <div className="relative bg-brand-softblack text-brand-offwhite py-24 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <Skeleton className="h-12 w-96 mx-auto bg-brand-offwhite/20" variant="rectangular" />
          <Skeleton className="h-5 w-[600px] mx-auto bg-brand-offwhite/20" variant="text" />
          <Skeleton className="h-4 w-[500px] mx-auto bg-brand-offwhite/20" variant="text" />
        </div>
      </div>

      {/* Cards de Contato Skeleton */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-sm p-8 md:p-10">
              <div className="flex items-start gap-6">
                <Skeleton className="h-12 w-12 rounded-full" variant="circular" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-3 w-20" variant="text" />
                  <Skeleton className="h-8 w-full" variant="rectangular" />
                  <Skeleton className="h-4 w-3/4" variant="text" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Formulário Skeleton */}
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12 space-y-4">
            <Skeleton className="h-10 w-80 mx-auto" variant="rectangular" />
            <Skeleton className="h-5 w-96 mx-auto" variant="text" />
          </div>
          <div className="bg-white border border-gray-100 rounded-sm p-8 md:p-12 space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" variant="text" />
              <Skeleton className="h-12 w-full" variant="rectangular" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" variant="text" />
              <Skeleton className="h-12 w-full" variant="rectangular" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-32" variant="text" />
              <Skeleton className="h-32 w-full" variant="rectangular" />
            </div>
            <Skeleton className="h-12 w-full" variant="rectangular" />
          </div>
        </div>
      </div>
    </div>
  );
}
