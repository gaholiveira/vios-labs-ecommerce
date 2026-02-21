import { Metadata } from "next";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Central de Atendimento | VIOS Labs",
  description:
    "Entre em contato com a equipe VIOS Labs. Estamos aqui para auxiliá-lo em sua jornada de bem-estar.",
};

export default function ContatoPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative bg-brand-softblack text-brand-offwhite py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-light uppercase tracking-[0.2em] md:tracking-[0.3em] mb-6 overflow-hidden">
            Central de Atendimento
          </h1>
          <p className="text-sm md:text-base font-light tracking-wider opacity-80 leading-relaxed max-w-2xl mx-auto">
            Estamos aqui para auxiliá-lo em sua jornada de bem-estar. Nossa
            equipe especializada está pronta para responder suas dúvidas com a
            excelência que você merece.
          </p>
        </div>
      </div>

      {/* Contatos Principais */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {/* Email */}
          <div className="group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative border border-gray-200 rounded-sm p-8 md:p-10 h-full hover:border-brand-green transition-all duration-300">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-brand-green/10 rounded-full flex items-center justify-center group-hover:bg-brand-green group-hover:scale-110 transition-all duration-300">
                  <Mail className="w-5 h-5 text-brand-green group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-3 font-medium">
                    Email
                  </h3>
                  <a
                    href="mailto:atendimento@vioslabs.com.br"
                    className="text-xl md:text-2xl font-light text-brand-softblack hover:text-brand-green transition-colors duration-300 break-all"
                  >
                    atendimento@vioslabs.com.br
                  </a>
                  <p className="text-sm text-gray-500 mt-4 font-light leading-relaxed">
                    Resposta em até 24 horas úteis
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Telefone */}
          <div className="group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative border border-gray-200 rounded-sm p-8 md:p-10 h-full hover:border-brand-green transition-all duration-300">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-brand-green/10 rounded-full flex items-center justify-center group-hover:bg-brand-green group-hover:scale-110 transition-all duration-300">
                  <Phone className="w-5 h-5 text-brand-green group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-3 font-medium">
                    WhatsApp
                  </h3>
                  <a
                    href="https://wa.me/5511952136713"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xl md:text-2xl font-light text-brand-softblack hover:text-brand-green transition-colors duration-300"
                  >
                    (11) 95213-6713
                  </a>
                  <p className="text-sm text-gray-500 mt-4 font-light leading-relaxed">
                    Segunda a Sexta, 9h às 18h
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="border-t border-gray-200 pt-16">
          <h2 className="text-2xl font-light uppercase tracking-[0.2em] md:tracking-[0.3em] text-brand-softblack mb-12 text-center overflow-hidden">
            Outras Informações
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Endereço */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-2 font-medium">
                  Endereço
                </h3>
                <p className="text-sm font-light text-gray-700 leading-relaxed">
                  Rua Cassiano Ricardo, 441
                  <br />
                  Nova Franca, Franca - SP
                  <br />
                  CEP 14409-214
                </p>
              </div>
            </div>

            {/* Horário */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-2 font-medium">
                  Horário de Atendimento
                </h3>
                <p className="text-sm font-light text-gray-700 leading-relaxed">
                  Segunda a Sexta: 9h às 18h
                  <br />
                  Sábado: 9h às 13h
                  <br />
                  Domingo e Feriados: Fechado
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção de FAQ Rápido */}
      <div className="bg-gray-50 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-light uppercase tracking-[0.2em] md:tracking-[0.3em] text-brand-softblack mb-4 text-center overflow-hidden">
            Perguntas Frequentes
          </h2>
          <p className="text-sm text-gray-600 text-center mb-12 font-light">
            Antes de entrar em contato, confira se sua dúvida já foi respondida
          </p>

          <div className="space-y-4">
            {/* FAQ Item 1 - Frete */}
            <details className="group border border-gray-200 rounded-sm bg-white">
              <summary className="flex justify-between items-center gap-4 cursor-pointer p-6 hover:bg-gray-50 transition-colors">
                <span className="text-sm font-light uppercase tracking-wider text-brand-softblack min-w-0 flex-1">
                  Como funciona o frete?
                </span>
                <svg
                  className="w-5 h-5 shrink-0 text-gray-400 transition-transform group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-sm text-gray-600 font-light leading-relaxed border-t border-gray-100 pt-4">
                <p>
                  O frete é calculado em tempo real no checkout com base no seu CEP,
                  através do Melhor Envio. Oferecemos duas opções: <strong>Entrega Padrão</strong> (mais econômica)
                  e <strong>Entrega Expressa</strong> (mais rápida). Compras a partir de R$ 289,90 têm{" "}
                  <strong>frete grátis</strong>. O prazo varia conforme sua localização e a opção escolhida,
                  geralmente entre 3 e 14 dias úteis para todo o Brasil.
                </p>
              </div>
            </details>

            {/* FAQ Item 2 */}
            <details className="group border border-gray-200 rounded-sm bg-white">
              <summary className="flex justify-between items-center gap-4 cursor-pointer p-6 hover:bg-gray-50 transition-colors">
                <span className="text-sm font-light uppercase tracking-wider text-brand-softblack min-w-0 flex-1">
                  Como faço para trocar ou devolver um produto?
                </span>
                <svg
                  className="w-5 h-5 shrink-0 text-gray-400 transition-transform group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-sm text-gray-600 font-light leading-relaxed border-t border-gray-100 pt-4">
                <p>
                  Você tem até 7 dias corridos após o recebimento para solicitar
                  troca ou devolução. Entre em contato conosco através do email
                  ou WhatsApp e nossa equipe irá orientá-lo sobre o processo.
                  Consulte nossa{" "}
                  <a
                    href="/trocas"
                    className="text-brand-green hover:underline"
                  >
                    Política de Trocas e Devoluções
                  </a>{" "}
                  para mais detalhes.
                </p>
              </div>
            </details>

            {/* FAQ Item 3 */}
            <details className="group border border-gray-200 rounded-sm bg-white">
              <summary className="flex justify-between items-center gap-4 cursor-pointer p-6 hover:bg-gray-50 transition-colors">
                <span className="text-sm font-light uppercase tracking-wider text-brand-softblack min-w-0 flex-1">
                  Quais formas de pagamento vocês aceitam?
                </span>
                <svg
                  className="w-5 h-5 shrink-0 text-gray-400 transition-transform group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-sm text-gray-600 font-light leading-relaxed border-t border-gray-100 pt-4">
                <p>
                  Aceitamos Cartão de Crédito (Visa, Mastercard, Elo, etc.), Pix
                  e Boleto Bancário. Todas as transações são processadas de
                  forma segura através do Pagar.me, com certificação PCI DSS.
                </p>
              </div>
            </details>

            {/* FAQ Item 4 */}
            <details className="group border border-gray-200 rounded-sm bg-white">
              <summary className="flex justify-between items-center gap-4 cursor-pointer p-6 hover:bg-gray-50 transition-colors">
                <span className="text-sm font-light uppercase tracking-wider text-brand-softblack min-w-0 flex-1">
                  Os produtos possuem registro na ANVISA?
                </span>
                <svg
                  className="w-5 h-5 shrink-0 text-gray-400 transition-transform group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-sm text-gray-600 font-light leading-relaxed border-t border-gray-100 pt-4">
                <p>
                  Sim! Alguns de nossos produtos possuem registro ativo na
                  ANVISA. Outros são dispensados de registro conforme RDC nº
                  240/2018. Você pode verificar o número do processo ANVISA na
                  página de cada produto.
                </p>
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* CTA Final */}
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl md:text-3xl font-light uppercase tracking-[0.2em] md:tracking-[0.3em] text-brand-softblack mb-4 overflow-hidden">
          Não Encontrou sua Resposta?
        </h2>
        <p className="text-sm text-gray-600 mb-8 font-light max-w-2xl mx-auto leading-relaxed">
          Nossa equipe está pronta para ajudá-lo. Entre em contato através dos
          canais acima e teremos o prazer de atendê-lo.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="mailto:atendimento@vioslabs.com.br"
            className="inline-flex items-center justify-center gap-2 border border-brand-green rounded-sm bg-brand-green text-brand-offwhite px-8 py-4 uppercase tracking-[0.2em] text-xs font-medium hover:bg-brand-softblack hover:border-brand-softblack transition-all duration-300"
          >
            <Mail className="w-4 h-4" />
            Enviar Email
          </a>
          <a
            href="https://wa.me/5511952136713"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 border border-brand-softblack rounded-sm bg-white text-brand-softblack px-8 py-4 uppercase tracking-[0.2em] text-xs font-medium hover:bg-brand-softblack hover:text-white transition-all duration-300"
          >
            <Phone className="w-4 h-4" />
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
