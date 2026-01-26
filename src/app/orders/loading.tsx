import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Loading específico para página de Pedidos
 * Replica o layout: Header + Lista de Pedidos
 */
export default function OrdersLoading() {
  return (
    <div className="min-h-screen bg-brand-offwhite pt-32 md:pt-40 px-6 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <Skeleton className="h-10 w-48 mb-2" variant="rectangular" />
          <Skeleton className="h-4 w-64" variant="text" />
        </div>
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-stone-100 rounded-xl shadow-sm p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-6 pb-4 border-b border-stone-100">
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" variant="text" />
                  <Skeleton className="h-3 w-24" variant="text" />
                </div>
                <Skeleton className="h-6 w-24" variant="rectangular" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" variant="text" />
                <Skeleton className="h-4 w-5/6" variant="text" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
