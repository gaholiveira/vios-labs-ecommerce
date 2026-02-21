import Image from "next/image";
import FounderImage from "@/components/FounderImage";

export default function SobrePage() {
  return (
    <main className="bg-brand-offwhite">
      {/* Hero Section */}
      <section className="group relative h-[60svh] md:h-[70svh] w-full flex items-center justify-center overflow-hidden bg-brand-softblack">
        {/* Imagem de fundo */}
        <div className="absolute inset-0 transform-gpu will-change-transform md:transition-transform md:duration-700 md:ease-out md:group-hover:scale-105">
          <Image
            src="/images/fundadores.png"
            alt="Vios Labs História"
            fill
            priority
            quality={85}
            sizes="100vw"
            className="object-cover md:object-contain object-center"
          />
        </div>

        {/* Overlay para escurecer a imagem e destacar o texto */}
        <div className="absolute inset-0 bg-black/30 z-[1] md:transition-opacity md:duration-500 md:ease-out md:group-hover:bg-black/25" />

        <div className="relative z-10 text-center px-4">
          <div className="max-w-4xl mx-auto md:transition-transform md:duration-500 md:ease-out md:group-hover:-translate-y-2">
            <span className="block uppercase tracking-[0.5em] text-[10px] mb-4 text-brand-offwhite opacity-80 md:transition-all md:duration-500 md:ease-out">
              A nossa jornada
            </span>
            <h1 className="text-5xl md:text-7xl font-extralight mb-8 uppercase tracking-tighter text-brand-offwhite">
              Nossa História
            </h1>
            <p className="text-brand-offwhite/70 text-sm md:text-base font-light tracking-wide max-w-2xl mx-auto md:transition-opacity md:duration-500 md:ease-out md:group-hover:text-brand-offwhite/90">
              A ciência da melhor versão de si mesmo
            </p>
          </div>
        </div>
      </section>

      {/* História da Marca */}
      <section className="max-w-4xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <span className="text-brand-green uppercase tracking-[0.4em] text-[10px] font-semibold mb-6 block">
            A Origem
          </span>
          <h2 className="text-brand-softblack text-3xl md:text-4xl font-light uppercase tracking-tighter leading-tight mb-8">
            Nascemos com um propósito
          </h2>
        </div>

        <div className="space-y-8 text-brand-softblack/70 text-sm md:text-base font-light leading-relaxed tracking-wide">
          <p>
            Tudo começou com uma ideia simples, mas poderosa: o corpo humano é a
            máquina mais sofisticada que existe, e a ciência é a linguagem que o
            decifra.
          </p>

          <p>
            A VIOS LABS é o encontro de duas paixões. De um lado, o olhar atento
            da Biomedicina, que entende cada célula, cada reação e o milagre da
            vida. Do outro, a visão estruturada da Tecnologia, que constrói o
            futuro e busca inovação.
          </p>

          <p>
            Desenvolvemos cada formulação a partir de critérios de estabilidade,
            biodisponibilidade e tolerabilidade para uso contínuo.
          </p>

          <p>
            Antes da escolha estética ou sensorial, avaliamos como o organismo
            reage ao longo do tempo, não apenas após o primeiro uso.
          </p>

          <p>
            Somos um casal movido pelo desejo de criar algo que não existia.
            Transformamos nosso sonho e nossos estudos em uma marca que respeita
            a sua inteligência. Não vendemos apenas suplementos; entregamos a
            arquitetura de uma vida mais plena, desenhada a quatro mãos, com o
            rigor que a saúde exige e a beleza que ela merece.
          </p>

          <p>
            Não criamos a VIOS para ser apenas mais uma opção na prateleira.
            Criamos porque acreditamos que o cuidado com o corpo merece a mesma
            sofisticação que você dedica às outras áreas da sua vida. Bem-vindos
            à nossa visão.
          </p>
        </div>
      </section>

      {/* Valores e Missão */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-brand-green uppercase tracking-[0.4em] text-[10px] font-semibold mb-6 block">
              Nossos Valores
            </span>
            <h2 className="text-brand-softblack text-3xl md:text-4xl font-light uppercase tracking-tighter leading-tight">
              O que nos move
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="group text-center rounded-xl p-6 transition-all duration-500 ease-out hover:bg-[#F7F6F2]">
              <div className="transition-transform duration-500 ease-out group-hover:-translate-y-2">
                <div className="mb-6 text-brand-green">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-12 h-12 mx-auto"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                    />
                  </svg>
                </div>
                <h3 className="text-brand-gold text-lg font-medium uppercase tracking-[0.2em] mb-4 group-hover:text-brand-green transition-colors duration-500 ease-out">
                  Transparência
                </h3>
                <p className="text-brand-softblack/60 text-sm font-light leading-relaxed">
                  Acreditamos em comunicação clara e honesta. Você sempre saberá
                  exatamente o que está usando e por quê.
                </p>
              </div>
            </div>

            <div className="group text-center rounded-xl p-6 transition-all duration-500 ease-out hover:bg-[#F7F6F2]">
              <div className="transition-transform duration-500 ease-out group-hover:-translate-y-2">
                <div className="mb-6 text-brand-green">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-12 h-12 mx-auto"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                    />
                  </svg>
                </div>
                <h3 className="text-brand-gold text-lg font-medium uppercase tracking-[0.2em] mb-4 group-hover:text-brand-green transition-colors duration-500 ease-out">
                  Excelência
                </h3>
                <p className="text-brand-softblack/60 text-sm font-light leading-relaxed">
                  Cada produto passa por rigorosos testes de qualidade e eficácia.
                  Comprometemo-nos apenas com o melhor.
                </p>
              </div>
            </div>

            <div className="group text-center rounded-xl p-6 transition-all duration-500 ease-out hover:bg-[#F7F6F2]">
              <div className="transition-transform duration-500 ease-out group-hover:-translate-y-2">
                <div className="mb-6 text-brand-green">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-12 h-12 mx-auto"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
                    />
                  </svg>
                </div>
                <h3 className="text-brand-gold text-lg font-medium uppercase tracking-[0.2em] mb-4 group-hover:text-brand-green transition-colors duration-500 ease-out">
                  Sustentabilidade
                </h3>
                <p className="text-brand-softblack/60 text-sm font-light leading-relaxed">
                  Respeitamos o planeta em cada decisão. Nossos processos são
                  pensados para minimizar impacto ambiental.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fundadores */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <span className="text-brand-green uppercase tracking-[0.4em] text-[10px] font-semibold mb-6 block">
            Quem Somos
          </span>
          <h2 className="text-brand-softblack text-3xl md:text-4xl font-light uppercase tracking-tighter leading-tight mb-8">
            Os Fundadores
          </h2>
          <p className="text-brand-softblack/70 text-sm md:text-base font-light leading-relaxed tracking-wide max-w-2xl mx-auto">
            Conheça as mentes por trás da VIOS LABS
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* Fundador 1 */}
          <div className="text-center">
            <div className="w-48 h-48 mx-auto mb-8 bg-brand-softblack/5 rounded-full overflow-hidden relative">
              <FounderImage
                src="/images/isadora.png"
                alt="Isadora Ferreira - Co-Fundadora & CEO"
                initials="IF"
                objectPosition="center top"
              />
            </div>
            <h3 className="text-brand-softblack text-xl font-light uppercase tracking-[0.2em] mb-2">
              Isadora Ferreira
            </h3>
            <p className="text-brand-gold text-[10px] uppercase tracking-[0.3em] mb-6 font-medium">
              Co-Fundadora & CEO
            </p>
            <p className="text-brand-softblack/60 text-sm font-light leading-relaxed text-left">
              A VIOS nasceu do encontro entre duas paixões: a precisão da
              Biomedicina e o desejo de criar uma experiência de cuidado que
              fosse, ao mesmo tempo, eficaz e sofisticada.
            </p>
            <p className="text-brand-softblack/60 text-sm font-light leading-relaxed text-left mt-4">
              Após anos imersa no universo do e-commerce e no atendimento direto
              ao cliente, entendi que o mercado estava saturado de promessas
              vazias, mas carente de atenção real aos detalhes. Eu percebi que
              as pessoas não queriam apenas um produto; elas buscavam confiança,
              transparência e resultados que pudessem sentir na pele e na
              rotina.
            </p>

            <p className="text-brand-softblack/60 text-sm font-light leading-relaxed text-left mt-4">
              Como estudante de Biomedicina, minha prioridade é o rigor técnico.
              Cada ativo da VIOS passa pelo meu crivo e pela minha curadoria
              pessoal. Mas, para mim, a ciência só é completa quando aliada à
              beleza e à funcionalidade. Por isso, desenhei cada detalhe da
              identidade visual e da experiência VIOS para que ela seja o ponto
              alto do seu dia.
            </p>

            <p className="text-brand-softblack/60 text-sm font-light leading-relaxed text-left mt-4">
              Não sou apenas a fundadora; sou a curadora da sua nova jornada de
              bem-estar celular. Bem-vinda ao padrão VIOS.
            </p>
          </div>

          {/* Fundador 2 */}
          <div className="text-center">
            <div className="w-48 h-48 mx-auto mb-8 bg-brand-softblack/5 rounded-full overflow-hidden relative">
              <FounderImage
                src="/images/gabrieloli.png"
                alt="Miguel Costa - Co-Fundador & Diretor Criativo"
                initials="GO"
              />
            </div>
            <h3 className="text-brand-softblack text-xl font-light uppercase tracking-[0.2em] mb-2">
              Gabriel Oliveira
            </h3>
            <p className="text-brand-gold text-[10px] uppercase tracking-[0.3em] mb-6 font-medium">
              Co-Fundador & Diretor de Desenvolvimento
            </p>
            <p className="text-brand-softblack/60 text-sm font-light leading-relaxed text-left">
              A VIOS nasceu do meu desejo de aplicar a precisão da tecnologia em
              um propósito que impactasse diretamente a vida das pessoas. Como
              desenvolvedor, sempre busquei transformar sistemas complexos em
              experiências simples e eficientes.
            </p>
            <p className="text-brand-softblack/60 text-sm font-light leading-relaxed text-left mt-4">
              Após anos imerso no universo do desenvolvimento e arquitetura de
              dados, entendi que a tecnologia no mercado de saúde não pode ser
              apenas funcional; ela precisa ser invisível, segura e inteligente.
              Percebi que faltava no mercado uma plataforma que respeitasse o
              tempo e a confiança do usuário, tratando cada dado e cada
              transação com o rigor que a ciência exige.
            </p>
            <p className="text-brand-softblack/60 text-sm font-light leading-relaxed text-left mt-4">
              Como desenvolvedor da VIOS, minha prioridade é a inovação
              estrutural. Cada linha de código e cada processo digital passa
              pelo meu crivo técnico para garantir que a tecnologia seja o
              alicerce da nossa transparência. Para mim, o sistema só é completo
              quando aliado à segurança e à fluidez da experiência. Por isso,
              projetei a infraestrutura da VIOS para ser o suporte invisível da
              sua jornada de bem-estar. bem-estar.
            </p>
            <p className="text-brand-softblack/60 text-sm font-light leading-relaxed text-left mt-4">
              Não sou apenas o co-fundador; sou o arquiteto da tecnologia por
              trás da sua melhor versão. Bem-vindo à evolução digital da VIOS.
            </p>
          </div>
        </div>

        {/* Mensagem final */}
        <div className="mt-24 pt-16 border-t border-brand-softblack/10 text-center">
          <p className="text-brand-softblack/70 text-base md:text-lg font-light leading-relaxed tracking-wide max-w-3xl mx-auto italic">
            "Juntos, unimos ciência e design para criar uma marca que
            acreditamos verdadeiramente fazer a diferença. A VIOS LABS é mais do
            que produtos - é um convite para viver com mais consciência e
            propósito."
          </p>
          <div className="mt-8 text-brand-gold text-[10px] uppercase tracking-[0.3em] font-medium">
            — Isadora Ferreira & Gabriel Oliveira
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-brand-softblack py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-brand-offwhite text-2xl md:text-3xl font-light uppercase tracking-tighter leading-tight mb-8">
            Faça Parte da Nossa Jornada
          </h2>
          <p className="text-brand-offwhite/70 text-sm md:text-base font-light leading-relaxed tracking-wide mb-10">
            Descubra nossos produtos e experimente o cuidado que sua pele
            merece.
          </p>
          <a
            href="/"
            className="inline-block border border-brand-offwhite px-10 py-4 text-[10px] uppercase tracking-widest text-brand-offwhite hover:bg-brand-offwhite hover:text-brand-softblack transition-all font-medium"
          >
            Explorar Produtos
          </a>
        </div>
      </section>
    </main>
  );
}
