"use client";

interface Ingredient {
  name: string;
  benefit: string;
  icon?: string; // Opcional: caminho para ícone/imagem
}

interface KeyIngredientsProps {
  ingredients: Ingredient[];
}

export default function KeyIngredients({ ingredients }: KeyIngredientsProps) {
  return (
    <section className="w-full py-12 md:py-16 border-t border-gray-200 mt-12">
      <h2 className="text-xl font-light uppercase tracking-[0.2em] text-brand-softblack mb-8 text-center">
        Ingredientes-chave
      </h2>

      {/* Desktop: Grid de 3 colunas */}
      <div className="hidden md:grid md:grid-cols-3 gap-6 max-w-5xl mx-auto px-6">
        {ingredients.map((ingredient, index) => (
          <div
            key={index}
            className="flex flex-col items-center text-center p-6 bg-gray-50 border border-gray-200 rounded-sm"
          >
            {/* Ícone Abstrato - Circle com Textura */}
            <div className="w-16 h-16 rounded-full bg-brand-green/10 border border-brand-green/20 mb-4 flex items-center justify-center relative overflow-hidden">
              {/* Textura circular interna */}
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-brand-green/5 to-transparent"></div>
              <div className="w-2 h-2 rounded-full bg-brand-green/30"></div>
            </div>

            {/* Nome do Ativo */}
            <h3 className="text-sm font-medium text-brand-softblack mb-2 uppercase tracking-[0.05em] leading-tight">
              {ingredient.name}
            </h3>

            {/* Benefício */}
            <p className="text-xs font-light text-brand-softblack/60 leading-relaxed">
              {ingredient.benefit}
            </p>
          </div>
        ))}
      </div>

      {/* Mobile: Carrossel Horizontal */}
      <div className="md:hidden overflow-x-auto scrollbar-hide -mx-6 px-6 pb-4">
        <div className="flex gap-4" style={{ width: "max-content" }}>
          {ingredients.map((ingredient, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-48 flex flex-col items-center text-center p-6 bg-gray-50 border border-gray-200 rounded-sm"
            >
              {/* Ícone Abstrato - Circle com Textura */}
              <div className="w-16 h-16 rounded-full bg-brand-green/10 border border-brand-green/20 mb-4 flex items-center justify-center relative overflow-hidden">
                {/* Textura circular interna */}
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-brand-green/5 to-transparent"></div>
                <div className="w-2 h-2 rounded-full bg-brand-green/30"></div>
              </div>

              {/* Nome do Ativo */}
              <h3 className="text-sm font-medium text-brand-softblack mb-2 uppercase tracking-[0.05em] leading-tight">
                {ingredient.name}
              </h3>

              {/* Benefício */}
              <p className="text-xs font-light text-brand-softblack/60 leading-relaxed">
                {ingredient.benefit}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
