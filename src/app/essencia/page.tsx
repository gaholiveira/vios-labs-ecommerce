import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "A Essência | VIOS LABS",
  description:
    "A VIOS não trabalha com respostas imediatas, mas com ajuste gradual. Descubra nossa filosofia de equilíbrio e funcionamento natural do organismo.",
};

export default function EssenciaPage() {
  return (
    <main className="bg-brand-offwhite">
      {/* Hero */}
      <section className="relative py-24 md:py-32 px-6 bg-brand-softblack">
        <div className="max-w-4xl mx-auto text-center">
          <span className="block uppercase tracking-[0.5em] text-[10px] mb-4 text-brand-gold opacity-90">
            Nossa filosofia
          </span>
          <h1 className="text-4xl md:text-6xl font-extralight uppercase tracking-tighter text-brand-offwhite mb-6">
            A Essência
          </h1>
          <p className="text-brand-offwhite/70 text-sm md:text-base font-light tracking-wide max-w-2xl mx-auto">
            O que está por trás de cada produto VIOS
          </p>
        </div>
      </section>

      {/* Conteúdo principal */}
      <article className="max-w-3xl mx-auto px-6 py-20 md:py-28">
        {/* Introdução */}
        <p className="text-brand-softblack/80 text-base md:text-lg font-light leading-relaxed tracking-wide mb-12">
          A VIOS não foi criada para oferecer soluções isoladas, mas para melhorar
          o funcionamento do organismo como um todo.
        </p>

        <div className="space-y-8 text-brand-softblack/70 text-sm md:text-base font-light leading-relaxed tracking-wide">
          <p>
            Grande parte da suplementação moderna tenta resolver cada sintoma
            separadamente: mais energia para o cansaço, mais estímulo para a
            concentração, mais ativos para a aparência, mais intervenção para o
            desconforto. O resultado costuma ser um ciclo de compensações —
            melhora pontual seguida de nova necessidade.
          </p>

          <p>
            <strong className="font-medium text-brand-softblack">
              Nós seguimos outro princípio.
            </strong>
          </p>

          <p>
            O corpo não precisa de empurrões constantes.
            <br />
            Precisa operar em equilíbrio.
          </p>

          <p>
            Por isso, nossos produtos não partem da lógica do efeito imediato, e
            sim da regularidade fisiológica. O objetivo não é provocar sensação
            intensa após o uso, mas reduzir oscilações ao longo dos dias.
          </p>
        </div>

        {/* Nosso ponto de partida */}
        <section className="mt-20 pt-16 border-t border-brand-softblack/10">
          <span className="text-brand-green uppercase tracking-[0.4em] text-[10px] font-semibold mb-4 block">
            Nosso ponto de partida
          </span>
          <h2 className="text-brand-softblack text-2xl md:text-3xl font-light uppercase tracking-tighter leading-tight mb-8">
            Em vez de perguntar &quot;como intensificar uma função&quot;,
            perguntamos: o que está impedindo o funcionamento natural?
          </h2>

          <div className="space-y-6 text-brand-softblack/70 text-sm md:text-base font-light leading-relaxed tracking-wide">
            <p>
              Muitas vezes o desgaste diário não vem da falta de algo, mas do
              excesso de estímulos, interrupções e irregularidade.
            </p>
            <p>
              Quando o organismo volta a operar dentro do próprio ritmo, energia,
              foco, recuperação e aparência deixam de depender de compensações
              pontuais.
            </p>
          </div>
        </section>

        {/* Como isso se traduz nos produtos */}
        <section className="mt-20 pt-16 border-t border-brand-softblack/10">
          <span className="text-brand-green uppercase tracking-[0.4em] text-[10px] font-semibold mb-4 block">
            Como isso se traduz nos produtos
          </span>
          <h2 className="text-brand-softblack text-2xl md:text-3xl font-light uppercase tracking-tighter leading-tight mb-8">
            Cada formulação VIOS é pensada para uso contínuo e compatibilidade
            com a rotina real.
          </h2>

          <p className="text-brand-softblack/70 text-sm md:text-base font-light leading-relaxed tracking-wide mb-8">
            Antes de qualquer escolha estética, consideramos:
          </p>

          <ul className="space-y-4 text-brand-softblack/70 text-sm md:text-base font-light leading-relaxed tracking-wide">
            <li className="flex gap-3">
              <span className="text-brand-green shrink-0">•</span>
              possibilidade de manter o uso no dia a dia
            </li>
            <li className="flex gap-3">
              <span className="text-brand-green shrink-0">•</span>
              percepção progressiva, não abrupta
            </li>
            <li className="flex gap-3">
              <span className="text-brand-green shrink-0">•</span>
              tolerabilidade ao longo do tempo
            </li>
            <li className="flex gap-3">
              <span className="text-brand-green shrink-0">•</span>
              equilíbrio entre função e adaptação do organismo
            </li>
          </ul>

          <p className="mt-10 text-brand-softblack/80 font-medium">
            O objetivo não é intensificar o corpo, é permitir que ele funcione com
            menos esforço.
          </p>
        </section>

        {/* Como escolher por onde começar */}
        <section className="mt-20 pt-16 border-t border-brand-softblack/10">
          <span className="text-brand-green uppercase tracking-[0.4em] text-[10px] font-semibold mb-4 block">
            Como escolher por onde começar
          </span>
          <h2 className="text-brand-softblack text-2xl md:text-3xl font-light uppercase tracking-tighter leading-tight mb-8">
            Não existe ordem obrigatória.
          </h2>

          <div className="space-y-6 text-brand-softblack/70 text-sm md:text-base font-light leading-relaxed tracking-wide">
            <p>
              O melhor início é sempre o ponto onde você sente maior desgaste
              hoje — seja descanso insuficiente, energia irregular, dificuldade de
              constância ou recuperação lenta.
            </p>
            <p>
              Os produtos não competem entre si. Eles atuam em frentes diferentes
              do mesmo sistema.
            </p>
          </div>
        </section>

        {/* Em resumo */}
        <section className="mt-20 pt-16 border-t border-brand-softblack/10">
          <span className="text-brand-green uppercase tracking-[0.4em] text-[10px] font-semibold mb-4 block">
            Em resumo
          </span>

          <div className="space-y-8 text-brand-softblack/70 text-sm md:text-base font-light leading-relaxed tracking-wide">
            <p>
              A VIOS não trabalha com respostas imediatas, mas com ajuste
              gradual.
            </p>
            <p>
              Você pode não sentir um &quot;pico&quot;. Mas tende a perceber menos
              necessidade de compensar.
            </p>
          </div>
        </section>
      </article>

      {/* CTA */}
      <section className="bg-brand-softblack py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-brand-offwhite text-2xl md:text-3xl font-light uppercase tracking-tighter leading-tight mb-8">
            Descubra nossos produtos
          </h2>
          <p className="text-brand-offwhite/70 text-sm md:text-base font-light leading-relaxed tracking-wide mb-10">
            Cada formulação pensada para equilíbrio e uso contínuo.
          </p>

          <span className="block text-brand-gold uppercase tracking-[0.5em] text-[10px] font-semibold mb-6">
            Rigor
          </span>
          <div className="space-y-6 text-brand-offwhite/80 text-sm md:text-base font-light leading-relaxed tracking-wide mb-12 text-left max-w-2xl mx-auto">
            <p>
              Cada formulação VIOS nasce de análise técnica e seleção criteriosa
              de ativos reconhecidos na literatura científica nutricional.
            </p>
            <p>
              Não buscamos superdosagens nem fórmulas infladas. Buscamos
              compatibilidade com o funcionamento do organismo ao longo do tempo.
            </p>
            <p>
              O resultado não é uma resposta agressiva ao corpo, mas um suporte
              consistente à sua fisiologia.
            </p>
          </div>

          <Link
            href="/"
            className="inline-block border border-brand-offwhite rounded-sm px-10 py-4 text-[10px] uppercase tracking-widest text-brand-offwhite font-light hover:bg-brand-offwhite hover:text-brand-softblack transition-all duration-500"
          >
            Explorar Loja
          </Link>
        </div>
      </section>
    </main>
  );
}
