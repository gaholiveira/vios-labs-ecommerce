import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Loading específico para página de produto
 * Replica o layout: Imagem grande + Informações + Botões
 */
export default function ProductLoading() {
  return (
    <main className="min-h-screen bg-brand-offwhite">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
          {/* Coluna da Imagem */}
          <div className="space-y-4">
            <Skeleton className="aspect-[3/4] w-full" variant="rectangular" />
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-20" variant="rectangular" />
              ))}
            </div>
          </div>

          {/* Coluna de Informações */}
          <div className="space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-4 w-24" variant="text" />
              <Skeleton className="h-12 w-full" variant="rectangular" />
              <Skeleton className="h-6 w-32" variant="rectangular" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-full" variant="text" />
              <Skeleton className="h-4 w-5/6" variant="text" />
              <Skeleton className="h-4 w-4/6" variant="text" />
            </div>

            <div className="space-y-4 pt-6 border-t border-gray-200">
              <Skeleton className="h-12 w-full" variant="rectangular" />
              <Skeleton className="h-12 w-full" variant="rectangular" />
            </div>

            <div className="space-y-3 pt-6">
              <Skeleton className="h-4 w-32" variant="text" />
              <Skeleton className="h-4 w-full" variant="text" />
              <Skeleton className="h-4 w-3/4" variant="text" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
