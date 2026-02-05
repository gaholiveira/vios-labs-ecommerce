import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso | VIOS LABS",
  description: "Termos e condições de uso da VIOS LABS.",
};

export default function TermosPage() {
  return (
    <main className="bg-brand-offwhite min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-20">
        {/* Título Principal */}
        <h1 className="text-3xl md:text-4xl font-light mb-12 text-[#082f1e]">
          Termos e Condições de Uso - VIOS
        </h1>

        <div className="text-base text-stone-600 leading-relaxed space-y-4">
          {/* Introdução */}
          <p>
            Bem-vindo à VIOS. Ao acessar este site e adquirir nossos produtos,
            você concorda com os termos descritos abaixo. Estes termos visam
            garantir a segurança jurídica de ambas as partes e a transparência
            na nossa relação com você.
          </p>

          {/* Seção 1 */}
          <section>
            <h2 className="text-xl font-bold mt-10 mb-4 text-[#082f1e]">
              1. Objeto e Natureza do Serviço
            </h2>
            <p>
              A VIOS é uma marca de suplementação avançada com foco em
              longevidade e bem-estar celular. Todo o conteúdo presente neste
              site, incluindo descrições de produtos e textos informativos,
              possui caráter meramente educativo e nutricional.
            </p>
          </section>

          {/* Seção 2 - Isenção de Responsabilidade Médica */}
          <section>
            <h2 className="text-xl font-bold mt-10 mb-4 text-[#082f1e]">
              2. Isenção de Responsabilidade Médica
            </h2>
            <p className="mb-4">
              Nossos produtos são suplementos alimentares, dispensados de
              registro conforme a RDC nº 240/2018 da ANVISA.
            </p>

            {/* Box de Atenção - Estilo Editorial */}
            <div className="bg-stone-50 border-l-2 border-[#082f1e] p-6 italic my-6">
              <p className="font-semibold mb-2">Atenção:</p>
              <p>
                Os produtos VIOS não são medicamentos e não se destinam a
                diagnosticar, tratar, curar ou prevenir qualquer doença. A
                curadoria técnica realizada por profissionais da saúde não
                substitui a consulta médica individualizada. Recomendamos que
                gestantes, lactantes e portadores de enfermidades consultem um
                médico antes de iniciar o uso.
              </p>
            </div>
          </section>

          {/* Seção 3 */}
          <section>
            <h2 className="text-xl font-bold mt-10 mb-4 text-[#082f1e]">
              3. Propriedade Intelectual
            </h2>
            <p>
              Todo o conteúdo deste site (textos, logotipos, imagens, vídeos e
              design) é de propriedade exclusiva da VIOS ou de seus parceiros. É
              estritamente proibida a reprodução, cópia ou exploração comercial
              de qualquer material sem autorização prévia por escrito, sob pena
              das sanções legais cabíveis.
            </p>
          </section>

          {/* Seção 4 */}
          <section>
            <h2 className="text-xl font-bold mt-10 mb-4 text-[#082f1e]">
              4. Políticas de Compra e Pagamento
            </h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Preços:</strong> Os preços exibidos são válidos no
                momento da visualização, podendo ser alterados sem aviso prévio
                (exceto para pedidos já finalizados).
              </li>
              <li>
                <strong>Lote Zero:</strong> O "Lote Zero" refere-se a uma
                tiragem limitada e exclusiva de lançamento. A confirmação do
                pedido está sujeita à disponibilidade de estoque.
              </li>
              <li>
                <strong>Pagamento:</strong> Utilizamos o gateway de pagamento
                seguro Pagar.me. A VIOS não armazena dados de cartão de crédito
                em seus servidores.
              </li>
            </ul>
          </section>

          {/* Seção 5 */}
          <section>
            <h2 className="text-xl font-bold mt-10 mb-4 text-[#082f1e]">
              5. Política de Entrega
            </h2>
            <p>
              Os prazos de entrega são estimativas fornecidas pelos
              transportadores parceiros. O prazo começa a contar a partir da
              confirmação do pagamento. Eventuais atrasos decorrentes de
              problemas logísticos externos serão comunicados ao cliente.
            </p>
          </section>

          {/* Seção 6 */}
          <section>
            <h2 className="text-xl font-bold mt-10 mb-4 text-[#082f1e]">
              6. Direito de Arrependimento e Devoluções
            </h2>
            <p className="mb-4">
              Em conformidade com o Código de Defesa do Consumidor:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                O cliente tem até 7 (sete) dias corridos após o recebimento para
                desistir da compra, desde que o produto esteja com o lacre
                original intacto e na embalagem original (caixa Kraft e seda).
              </li>
              <li>
                Produtos com lacre violado não serão aceitos para devolução por
                questões de segurança sanitária.
              </li>
            </ul>
          </section>

          {/* Seção 7 */}
          <section>
            <h2 className="text-xl font-bold mt-10 mb-4 text-[#082f1e]">
              7. Limitação de Responsabilidade
            </h2>
            <p>
              A VIOS não se responsabiliza pelo uso inadequado dos produtos ou
              pela sua utilização em desacordo com as recomendações de dosagem
              presentes no rótulo.
            </p>
          </section>

          {/* Seção 8 */}
          <section>
            <h2 className="text-xl font-bold mt-10 mb-4 text-[#082f1e]">
              8. Foro
            </h2>
            <p>
              Fica eleito o foro da comarca de Franca/SP para dirimir quaisquer
              controvérsias oriundas deste termo.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
