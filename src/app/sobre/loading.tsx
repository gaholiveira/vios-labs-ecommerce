import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Loading específico para página Sobre
 * Replica o layout: Hero + Conteúdo + Cards de Valores + Fundadores
 */
export default function SobreLoading() {
  return (
    <main className="bg-brand-offwhite">
      {/* Hero Skeleton */}
      <section className="relative h-[60svh] md:h-[70svh] w-full flex items-center justify-center overflow-hidden bg-brand-softblack">
        <div className="absolute inset-0 bg-brand-softblack/80 animate-pulse" />
        <div className="relative z-10 text-center px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-3 w-40 mx-auto" variant="text" />
            <Skeleton className="h-20 w-96 mx-auto" variant="rectangular" />
            <Skeleton className="h-5 w-80 mx-auto" variant="text" />
          </div>
        </div>
      </section>

      {/* História da Marca Skeleton */}
      <section className="max-w-4xl mx-auto px-6 py-24">
        <div className="text-center mb-16 space-y-4">
          <Skeleton className="h-3 w-24 mx-auto" variant="text" />
          <Skeleton className="h-10 w-96 mx-auto" variant="rectangular" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              className={`h-4 ${i === 3 ? "w-3/4" : "w-full"}`}
              variant="text"
            />
          ))}
        </div>
      </section>

      {/* Valores Skeleton */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <Skeleton className="h-3 w-32 mx-auto" variant="text" />
            <Skeleton className="h-10 w-80 mx-auto" variant="rectangular" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="text-center space-y-4 p-6">
                <Skeleton className="h-12 w-12 mx-auto rounded-full" variant="circular" />
                <Skeleton className="h-6 w-32 mx-auto" variant="rectangular" />
                <Skeleton className="h-4 w-full" variant="text" />
                <Skeleton className="h-4 w-5/6 mx-auto" variant="text" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fundadores Skeleton */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16 space-y-4">
          <Skeleton className="h-3 w-28 mx-auto" variant="text" />
          <Skeleton className="h-10 w-80 mx-auto" variant="rectangular" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="text-center space-y-6">
              <Skeleton className="h-48 w-48 mx-auto rounded-full" variant="circular" />
              <Skeleton className="h-6 w-40 mx-auto" variant="rectangular" />
              <Skeleton className="h-3 w-32 mx-auto" variant="text" />
              <div className="space-y-3 text-left">
                <Skeleton className="h-4 w-full" variant="text" />
                <Skeleton className="h-4 w-5/6" variant="text" />
                <Skeleton className="h-4 w-4/6" variant="text" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
