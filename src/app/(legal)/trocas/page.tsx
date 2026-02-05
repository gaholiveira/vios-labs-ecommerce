import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Envios e Devoluções | VIOS LABS",
  description: "Política de envios, trocas e devoluções da VIOS LABS.",
};

export default function TrocasPage() {
  return (
    <main className="bg-brand-offwhite min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-20">
        {/* Título Principal */}
        <h1 className="text-3xl md:text-4xl font-light mb-12 text-[#082f1e]">
          Política de Envios, Trocas e Reembolso - VIOS
        </h1>

        <div className="text-base text-stone-600 leading-relaxed space-y-4">
          {/* Introdução */}
          <p>
            Na VIOS, buscamos a excelência desde a formulação até a entrega.
            Abaixo, detalhamos nossas diretrizes para garantir uma experiência
            transparente e segura.
          </p>

          {/* Seção 1 */}
          <section>
            <h2 className="text-xl font-bold mt-10 mb-4 text-[#082f1e]">
              1. Política de Envios
            </h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Processamento:</strong> Após a confirmação do pagamento,
                seu pedido é preparado para envio em até 24 a 48 horas úteis.
              </li>
              <li>
                <strong>Prazos:</strong> O prazo de entrega varia conforme a
                região e a modalidade de frete escolhida no checkout. Esse prazo
                passa a contar a partir da postagem do produto.
              </li>
              <li>
                <strong>Rastreamento:</strong> Você receberá um código de
                rastreio por e-mail para acompanhar cada etapa do trajeto.
              </li>
              <li>
                <strong>Lote Zero:</strong> Devido à exclusividade e alta
                demanda do Lote Zero, os prazos podem sofrer pequenas variações,
                as quais serão comunicadas prontamente.
              </li>
            </ul>
          </section>

          {/* Seção 2 - Direito de Arrependimento */}
          <section>
            <h2 className="text-xl font-bold mt-10 mb-4 text-[#082f1e]">
              2. Direito de Arrependimento (Devolução)
            </h2>
            <p className="mb-4">
              Conforme o Artigo 49 do Código de Defesa do Consumidor, você tem o
              direito de desistir da compra em até 7 (sete) dias corridos após o
              recebimento.
            </p>

            {/* Box de Alerta - Condição Crucial */}
            <div className="bg-stone-50 p-4 border-l-2 border-[#082f1e] my-6">
              <p className="font-semibold mb-2 text-[#082f1e]">
                Condição Crucial:
              </p>
              <p>
                Por se tratar de suplementos alimentares, a devolução só será
                aceita se o produto estiver com o lacre original intacto e na
                embalagem original. Produtos com lacres rompidos ou danificados
                não serão aceitos por razões de segurança sanitária e
                integridade do produto.
              </p>
            </div>
          </section>

          {/* Seção 3 */}
          <section>
            <h2 className="text-xl font-bold mt-10 mb-4 text-[#082f1e]">
              3. Trocas por Defeito ou Avaria
            </h2>
            <p className="mb-4">
              Caso o seu produto chegue com a embalagem danificada ou qualquer
              defeito de fabricação:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Envie uma foto ou vídeo do produto para{" "}
                <a
                  href="mailto:suporte@vioslabs.com.br"
                  className="text-[#082f1e] hover:underline transition"
                >
                  suporte@vioslabs.com.br
                </a>{" "}
                em até 30 dias após o recebimento.
              </li>
              <li>
                A VIOS arcará com todos os custos de frete para a troca por um
                novo item do mesmo lote.
              </li>
            </ul>
          </section>

          {/* Seção 4 */}
          <section>
            <h2 className="text-xl font-bold mt-10 mb-4 text-[#082f1e]">
              4. Política de Reembolso
            </h2>
            <p className="mb-4">
              O reembolso será processado assim que o produto retornar ao nosso
              centro de distribuição e passar pela conferência do lacre:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Cartão de Crédito:</strong> O estorno será solicitado à
                operadora (Pagar.me) e poderá aparecer em até duas faturas
                subsequentes, dependendo do fechamento do seu cartão.
              </li>
              <li>
                <strong>Pix:</strong> O reembolso será realizado na mesma conta
                de origem em até 3 dias úteis.
              </li>
              <li>
                <strong>Frete:</strong> No caso de arrependimento (sem defeito),
                o valor do frete de envio não é reembolsável, conforme a
                legislação vigente.
              </li>
            </ul>
          </section>

          {/* Seção 5 */}
          <section>
            <h2 className="text-xl font-bold mt-10 mb-4 text-[#082f1e]">
              5. Pedidos Não Entregues
            </h2>
            <p>
              Caso o pedido retorne por erro de endereço cadastrado pelo cliente
              ou por repetidas tentativas de entrega sem sucesso, o custo de
              reenvio será de responsabilidade do comprador.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
