import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termos de Uso | VIOS LABS',
  description: 'Termos e condições de uso da VIOS LABS.',
};

export default function TermosPage() {
  return (
    <main className="bg-brand-offwhite min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        <h1 className="text-3xl md:text-4xl font-light uppercase tracking-tighter mb-8 text-brand-softblack">
          Termos de Uso
        </h1>
        
        <div className="text-sm md:text-base font-light text-brand-softblack/80 leading-relaxed space-y-6">
          <section>
            <h2 className="text-xl font-medium uppercase tracking-[0.1em] mb-4 text-brand-softblack mt-8">
              1. Introdução
            </h2>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
            <p>
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
              Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium uppercase tracking-[0.1em] mb-4 text-brand-softblack mt-8">
              2. Aceitação dos Termos
            </h2>
            <p>
              Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, 
              totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
            </p>
            <p>
              Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos 
              qui ratione voluptatem sequi nesciunt.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium uppercase tracking-[0.1em] mb-4 text-brand-softblack mt-8">
              3. Uso do Site
            </h2>
            <p>
              Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, 
              sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.
            </p>
            <p>
              Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, 
              nisi ut aliquid ex ea commodi consequatur.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium uppercase tracking-[0.1em] mb-4 text-brand-softblack mt-8">
              4. Produtos e Preços
            </h2>
            <p>
              Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, 
              vel illum qui dolorem eum fugiat quo voluptas nulla pariatur.
            </p>
            <p>
              At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti 
              atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium uppercase tracking-[0.1em] mb-4 text-brand-softblack mt-8">
              5. Propriedade Intelectual
            </h2>
            <p>
              Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. 
              Et harum quidem rerum facilis est et expedita distinctio.
            </p>
            <p>
              Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat 
              facere possimus, omnis voluptas assumenda est, omnis dolor repellendus.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium uppercase tracking-[0.1em] mb-4 text-brand-softblack mt-8">
              6. Limitação de Responsabilidade
            </h2>
            <p>
              Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates 
              repudiandae sint et molestiae non recusandae.
            </p>
            <p>
              Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias 
              consequatur aut perferendis doloribus asperiores repellat.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium uppercase tracking-[0.1em] mb-4 text-brand-softblack mt-8">
              7. Alterações nos Termos
            </h2>
            <p>
              Onsectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.
            </p>
            <p>
              Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, 
              nisi ut aliquid ex ea commodi consequatur.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium uppercase tracking-[0.1em] mb-4 text-brand-softblack mt-8">
              8. Lei Aplicável
            </h2>
            <p>
              Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, 
              totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
            </p>
          </section>

          <section className="pt-8 border-t border-gray-200 mt-12">
            <p className="text-xs text-brand-softblack/60 italic">
              Última atualização: Janeiro 2026
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
