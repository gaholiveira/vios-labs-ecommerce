import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Loading padrão do Next.js (fallback global)
 * Usado quando não há loading específico para a rota
 * Para a Home, usa skeleton que replica o layout
 */
export default function Loading() {
  return (
    <main className="relative">
      {/* Hero Skeleton */}
      <section className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-brand-softblack">
        <div className="absolute inset-0 bg-brand-softblack/80 animate-pulse" />
        <div className="relative z-10 text-center px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-4 w-64 mx-auto bg-brand-offwhite/20" variant="text" />
            <Skeleton className="h-20 w-96 mx-auto bg-brand-offwhite/20" variant="rectangular" />
            <Skeleton className="h-6 w-[600px] mx-auto bg-brand-offwhite/20" variant="text" />
            <Skeleton className="h-12 w-48 mx-auto bg-brand-offwhite/20" variant="rectangular" />
          </div>
        </div>
      </section>

      {/* Products Grid Skeleton */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-24">
        <div className="text-center mb-16">
          <Skeleton className="h-10 w-64 mx-auto mb-4" variant="rectangular" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-x-10 sm:gap-y-16">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-[3/4] w-full" variant="rectangular" />
              <Skeleton className="h-4 w-3/4" variant="text" />
              <Skeleton className="h-6 w-24" variant="rectangular" />
            </div>
          ))}
        </div>
      </section>

      {/* AboutSection Skeleton */}
      <section className="bg-brand-offwhite py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Skeleton className="h-3 w-32 mx-auto" variant="text" />
            <Skeleton className="h-10 w-96 mx-auto" variant="rectangular" />
            <Skeleton className="h-4 w-full" variant="text" />
            <Skeleton className="h-4 w-5/6 mx-auto" variant="text" />
            <Skeleton className="h-4 w-3/4 mx-auto" variant="text" />
          </div>
        </div>
      </section>
    </main>
  );
}
