import { Skeleton } from "./Skeleton";

interface PageSkeletonProps {
  /** Número de linhas de texto no conteúdo principal */
  contentLines?: number;
  /** Se deve mostrar um formulário skeleton */
  showForm?: boolean;
  /** Se deve mostrar um card skeleton */
  showCard?: boolean;
  /** Classe adicional para o container */
  className?: string;
}

/**
 * Skeleton genérico para páginas
 * Usado como fallback durante o carregamento de dados
 */
export default function PageSkeleton({
  contentLines = 3,
  showForm = false,
  showCard = false,
  className = "",
}: PageSkeletonProps) {
  return (
    <div className={`min-h-screen bg-brand-offwhite py-12 px-6 ${className}`}>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" variant="rectangular" />
          <Skeleton className="h-5 w-96" variant="rectangular" />
        </div>

        {/* Card Skeleton (opcional) */}
        {showCard && (
          <div className="bg-white border border-gray-100 rounded-sm p-6 space-y-4">
            <Skeleton className="h-8 w-48" variant="rectangular" />
            <Skeleton className="h-4 w-full" variant="text" />
            <Skeleton className="h-4 w-3/4" variant="text" />
          </div>
        )}

        {/* Form Skeleton (opcional) */}
        {showForm && (
          <div className="bg-white border border-gray-100 rounded-sm p-6 space-y-6">
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
        )}

        {/* Content Lines */}
        <div className="space-y-3">
          {Array.from({ length: contentLines }).map((_, i) => (
            <Skeleton
              key={i}
              className={`h-4 ${i === contentLines - 1 ? "w-3/4" : "w-full"}`}
              variant="text"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
