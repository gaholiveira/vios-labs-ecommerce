"use client";

interface Ingredient {
  name: string;
  benefit: string;
  icon?: string; // Opcional: caminho para ícone/imagem
}

interface KeyIngredientsProps {
  ingredients: Ingredient[];
}

/**
 * Ícone de ingrediente-chave
 * SVG adaptado ao padrão visual da VIOS Labs
 */
function IngredientIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 16 16"
      className="w-6 h-6 text-brand-green"
      fill="none"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="m3.5 8l6.3-6.3c.4-.4 1-.7 1.7-.7s1.3.3 1.8.7c1 1 1 2.6 0 3.5L10.5 8h1.4l2-2c1.4-1.4 1.4-3.6 0-4.9c-.7-.7-1.6-1-2.5-1S9.7.3 9 1L2.7 7.4c-.3.2-.5.5-.7.9c.5-.2 1-.3 1.5-.3z"
      />
      <path
        fill="currentColor"
        d="M7.3 5.6L4.9 8h4.7zM12.5 9h-9C1.6 9 0 10.6 0 12.5S1.6 16 3.5 16h9c1.9 0 3.5-1.6 3.5-3.5S14.4 9 12.5 9zm0 6H8v-4H3.5c-1.1 0-2 .6-2.5 1.2C1.2 11 2.2 10 3.5 10h9c1.4 0 2.5 1.1 2.5 2.5S13.9 15 12.5 15z"
      />
    </svg>
  );
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
            {/* Ícone de Ingrediente */}
            <div className="w-16 h-16 rounded-full bg-brand-green/10 border border-brand-green/20 mb-4 flex items-center justify-center">
              <IngredientIcon />
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
              className="shrink-0 w-48 flex flex-col items-center text-center p-6 bg-gray-50 border border-gray-200 rounded-sm last:mr-6"
            >
              {/* Ícone de Ingrediente */}
              <div className="w-16 h-16 rounded-full bg-brand-green/10 border border-brand-green/20 mb-4 flex items-center justify-center">
                <IngredientIcon />
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
