import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade | VIOS LABS",
  description: "Política de privacidade e proteção de dados da VIOS LABS.",
};

export default function PrivacidadePage() {
  return (
    <main className="bg-brand-offwhite min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-20">
        {/* Título Principal */}
        <h1 className="text-3xl md:text-4xl font-light mb-12 text-[#082f1e]">
          Política de Privacidade - VIOS
        </h1>

        <div className="text-base text-stone-600 leading-relaxed space-y-4">
          {/* Introdução */}
          <p>
            A VIOS valoriza a confiança que você deposita em nós ao compartilhar
            seus dados pessoais. Esta Política de Privacidade explica como
            coletamos, usamos, armazenamos e protegemos suas informações, em
            total conformidade com a Lei Geral de Proteção de Dados (Lei nº
            13.709/2018 - LGPD).
          </p>

          {/* Seção 1 */}
          <section>
            <h2 className="text-xl font-bold mt-10 mb-4 text-[#082f1e]">
              1. Coleta de Informações
            </h2>
            <p className="mb-4">
              Coletamos informações necessárias para processar seus pedidos e
              oferecer uma experiência personalizada:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Dados Cadastrais:</strong> Nome completo, CPF, e-mail,
                telefone e endereço de entrega.
              </li>
              <li>
                <strong>Dados de Pagamento:</strong> Processados de forma
                criptografada pelo Pagar.me. A VIOS não armazena os dados do seu
                cartão de crédito.
              </li>
              <li>
                <strong>Dados de Navegação:</strong> Cookies e endereços IP para
                melhorar a performance do site e entender suas preferências de
                consumo.
              </li>
            </ul>
          </section>

          {/* Seção 2 */}
          <section>
            <h2 className="text-xl font-bold mt-10 mb-4 text-[#082f1e]">
              2. Finalidade do Uso dos Dados
            </h2>
            <p className="mb-4">
              Seus dados são utilizados exclusivamente para:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Processar e entregar seus pedidos do Lote Zero.</li>
              <li>Enviar comunicações sobre o status da sua compra.</li>
              <li>
                Realizar ações de marketing e novidades da marca (apenas com seu
                consentimento prévio).
              </li>
              <li>Garantir a segurança do site e prevenir fraudes.</li>
            </ul>
          </section>

          {/* Seção 3 */}
          <section>
            <h2 className="text-xl font-bold mt-10 mb-4 text-[#082f1e]">
              3. Compartilhamento de Dados
            </h2>
            <p className="mb-4">
              A VIOS não vende nem aluga seus dados pessoais. Compartilhamos
              informações com terceiros apenas quando estritamente necessário
              para a operação:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Gateways de Pagamento:</strong> Para processar a
                transação financeira.
              </li>
              <li>
                <strong>Transportadoras:</strong> Para garantir que seu produto
                chegue ao endereço correto.
              </li>
              <li>
                <strong>Autoridades Legais:</strong> Caso haja requisição
                judicial ou obrigação prevista em lei.
              </li>
            </ul>
          </section>

          {/* Seção 4 */}
          <section>
            <h2 className="text-xl font-bold mt-10 mb-4 text-[#082f1e]">
              4. Segurança da Informação
            </h2>
            <p>
              Implementamos medidas técnicas e organizacionais de segurança,
              como o protocolo SSL (Secure Socket Layer), para garantir que seus
              dados sejam transmitidos de forma criptografada e fiquem
              protegidos contra acessos não autorizados.
            </p>
          </section>

          {/* Seção 5 */}
          <section>
            <h2 className="text-xl font-bold mt-10 mb-4 text-[#082f1e]">
              5. Seus Direitos (LGPD)
            </h2>
            <p className="mb-4">
              Você, como titular dos dados, tem o direito de, a qualquer
              momento:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Confirmar a existência de tratamento e acessar seus dados.
              </li>
              <li>
                Solicitar a correção de dados incompletos ou desatualizados.
              </li>
              <li>Revogar seu consentimento para comunicações de marketing.</li>
              <li>
                Solicitar a exclusão definitiva dos seus dados de nossa base
                (exceto quando a manutenção for exigida por obrigações legais ou
                fiscais).
              </li>
            </ul>
          </section>

          {/* Seção 6 */}
          <section>
            <h2 className="text-xl font-bold mt-10 mb-4 text-[#082f1e]">
              6. Uso de Cookies
            </h2>
            <p>
              Utilizamos cookies para personalizar sua experiência. Você pode
              desativar os cookies nas configurações do seu navegador, embora
              isso possa afetar algumas funcionalidades do site da VIOS.
            </p>
          </section>

          {/* Seção 7 */}
          <section>
            <h2 className="text-xl font-bold mt-10 mb-4 text-[#082f1e]">
              7. Alterações nesta Política
            </h2>
            <p>
              A VIOS reserva-se o direito de atualizar esta Política de
              Privacidade conforme necessário para refletir mudanças em nossas
              práticas ou por motivos legais. Recomendamos a leitura periódica
              deste documento.
            </p>
          </section>

          {/* Seção 8 */}
          <section>
            <h2 className="text-xl font-bold mt-10 mb-4 text-[#082f1e]">
              8. Contato e Encarregado de Dados
            </h2>
            <p>
              Para qualquer dúvida sobre o tratamento de seus dados, entre em
              contato com nosso Encarregado de Proteção de Dados (DPO) através
              do e-mail:{"atendimento@vioslabs.com.br "}
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
