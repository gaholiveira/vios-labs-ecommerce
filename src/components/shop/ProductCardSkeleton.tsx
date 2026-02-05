import { Skeleton } from "@/components/ui/Skeleton";

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col">
      {/* Imagem – mesmo aspect ratio e espaçamento do ProductCard */}
      <Skeleton className="relative w-full aspect-[3/4] rounded-none mb-6" />

      {/* Título */}
      <Skeleton className="h-5 w-3/4 mt-4" />

      {/* Preço */}
      <Skeleton className="h-4 w-1/4 mt-2" />
    </div>
  );
}
