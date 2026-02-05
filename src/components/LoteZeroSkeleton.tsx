export default function LoteZeroSkeleton() {
  return (
    <main className="min-h-screen flex flex-col md:flex-row">
      {/* Coluna Esquerda (50%) - Desktop Skeleton */}
      <div className="hidden md:flex md:w-1/2 md:sticky md:top-0 md:h-screen bg-brand-green relative overflow-hidden">
        {/* Skeleton da imagem */}
        <div className="absolute inset-0 bg-brand-green/80 animate-pulse" />
        
        {/* Skeleton do conteúdo */}
        <div className="relative z-20 flex flex-col items-center justify-center px-12 w-full">
          <div className="text-center space-y-6">
            {/* Skeleton do título */}
            <div className="space-y-4">
              <div className="h-16 w-64 bg-brand-offwhite/20 rounded-sm mx-auto animate-pulse" />
              <div className="h-4 w-32 bg-brand-offwhite/10 rounded-sm mx-auto animate-pulse" />
              <div className="h-px w-16 bg-brand-offwhite/10 mx-auto" />
              <div className="h-3 w-24 bg-brand-offwhite/10 rounded-sm mx-auto animate-pulse" />
            </div>
          </div>
        </div>

        {/* Skeleton do rodapé */}
        <div className="absolute bottom-8 left-0 right-0 z-20 text-center">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="h-3 w-40 bg-brand-offwhite/10 rounded-sm mx-auto animate-pulse" />
            <div className="h-2 w-32 bg-brand-offwhite/5 rounded-sm mx-auto animate-pulse" />
          </div>
        </div>
      </div>

      {/* Versão Mobile: Hero Skeleton */}
      <div className="md:hidden relative h-[50vh] min-h-[300px] bg-brand-green overflow-hidden">
        <div className="absolute inset-0 bg-brand-green/80 animate-pulse" />
        <div className="relative z-20 flex flex-col items-center justify-center h-full px-4 py-8">
          <div className="text-center space-y-4">
            <div className="h-12 w-48 bg-brand-offwhite/20 rounded-sm mx-auto animate-pulse" />
            <div className="h-3 w-28 bg-brand-offwhite/10 rounded-sm mx-auto animate-pulse" />
            <div className="h-px w-12 bg-brand-offwhite/10 mx-auto" />
            <div className="h-2 w-20 bg-brand-offwhite/10 rounded-sm mx-auto animate-pulse" />
          </div>
        </div>
      </div>

      {/* Coluna Direita (50%) - Formulário Skeleton */}
      <div className="md:w-1/2 w-full flex-1 md:flex-none bg-stone-50">
        <div className="min-h-full flex flex-col items-center justify-center px-6 py-12 md:py-24">
          <div className="w-full max-w-md space-y-8">
            {/* Skeleton do título */}
            <div className="space-y-4 text-center">
              <div className="h-8 w-48 bg-stone-200 rounded-sm mx-auto animate-pulse" />
              <div className="h-4 w-64 bg-stone-200/60 rounded-sm mx-auto animate-pulse" />
            </div>

            {/* Skeleton do formulário */}
            <div className="space-y-6">
              {/* Campo Nome */}
              <div className="space-y-2">
                <div className="h-3 w-16 bg-stone-200/60 rounded-sm animate-pulse" />
                <div className="h-12 w-full bg-stone-200 rounded-sm animate-pulse" />
              </div>

              {/* Campo Email */}
              <div className="space-y-2">
                <div className="h-3 w-20 bg-stone-200/60 rounded-sm animate-pulse" />
                <div className="h-12 w-full bg-stone-200 rounded-sm animate-pulse" />
              </div>

              {/* Botão */}
              <div className="h-12 w-full bg-stone-200 rounded-sm animate-pulse" />
            </div>

            {/* Skeleton de informações adicionais */}
            <div className="space-y-4 pt-8">
              <div className="h-px w-full bg-stone-200" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-stone-200/60 rounded-sm animate-pulse" />
                <div className="h-3 w-3/4 bg-stone-200/60 rounded-sm animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
