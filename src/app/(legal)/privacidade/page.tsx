import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade | VIOS LABS',
  description: 'Política de privacidade e proteção de dados da VIOS LABS.',
};

export default function PrivacidadePage() {
  return (
    <main className="bg-brand-offwhite min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        <h1 className="text-3xl md:text-4xl font-light uppercase tracking-tighter mb-8 text-brand-softblack">
          Política de Privacidade
        </h1>
        
        <div className="text-sm md:text-base font-light text-brand-softblack/80 leading-relaxed space-y-6">
          <section>
            <h2 className="text-xl font-medium uppercase tracking-[0.1em] mb-4 text-brand-softblack mt-8">
              1. Introdução
            </h2>
            <p>
              A VIOS LABS está comprometida com a proteção da sua privacidade e dos seus dados pessoais. 
              Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais 
              em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018) e demais normas aplicáveis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium uppercase tracking-[0.1em] mb-4 text-brand-softblack mt-8">
              2. Dados Coletados
            </h2>
            <p>
              Coletamos os seguintes tipos de dados pessoais quando você interage com nosso site e serviços:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Dados de identificação: nome completo, e-mail, CPF</li>
              <li>Dados de contato: endereço, telefone</li>
              <li>Dados de navegação: cookies, endereço IP, páginas visitadas</li>
              <li>Dados de transação: informações de pagamento e compras realizadas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium uppercase tracking-[0.1em] mb-4 text-brand-softblack mt-8">
              3. Finalidade do Tratamento
            </h2>
            <p>
              Utilizamos seus dados pessoais para as seguintes finalidades:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Processamento e entrega de pedidos</li>
              <li>Comunicação sobre produtos, serviços e ofertas</li>
              <li>Melhoria da experiência do usuário no site</li>
              <li>Cumprimento de obrigações legais e regulatórias</li>
              <li>Prevenção de fraudes e garantia de segurança</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium uppercase tracking-[0.1em] mb-4 text-brand-softblack mt-8">
              4. Base Legal
            </h2>
            <p>
              O tratamento de seus dados pessoais é realizado com base nas seguintes hipóteses legais previstas na LGPD:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Consentimento do titular</li>
              <li>Execução de contrato ou procedimentos preliminares</li>
              <li>Cumprimento de obrigação legal ou regulatória</li>
              <li>Proteção da vida ou da incolumidade física</li>
              <li>Legítimo interesse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium uppercase tracking-[0.1em] mb-4 text-brand-softblack mt-8">
              5. Compartilhamento de Dados
            </h2>
            <p>
              Seus dados pessoais podem ser compartilhados com:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Parceiros de logística e entrega</li>
              <li>Processadores de pagamento (Stripe)</li>
              <li>Prestadores de serviços de tecnologia e segurança</li>
              <li>Autoridades competentes, quando exigido por lei</li>
            </ul>
            <p className="mt-4">
              Todos os parceiros são contratualmente obrigados a manter a confidencialidade e segurança dos dados.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium uppercase tracking-[0.1em] mb-4 text-brand-softblack mt-8">
              6. Segurança dos Dados
            </h2>
            <p>
              Implementamos medidas técnicas e organizacionais adequadas para proteger seus dados pessoais contra 
              acesso não autorizado, alteração, divulgação ou destruição, incluindo:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Criptografia de dados em trânsito e em repouso</li>
              <li>Controles de acesso restritos e autenticação</li>
              <li>Monitoramento contínuo de segurança</li>
              <li>Backup regular e planos de recuperação</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium uppercase tracking-[0.1em] mb-4 text-brand-softblack mt-8">
              7. Direitos do Titular
            </h2>
            <p>
              Você tem os seguintes direitos sobre seus dados pessoais:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Confirmação da existência de tratamento</li>
              <li>Acesso aos dados</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados</li>
              <li>Anonimização, bloqueio ou eliminação de dados desnecessários</li>
              <li>Portabilidade dos dados</li>
              <li>Eliminação dos dados tratados com consentimento</li>
              <li>Revogação do consentimento</li>
              <li>Informação sobre compartilhamento</li>
            </ul>
            <p className="mt-4">
              Para exercer seus direitos, entre em contato através do e-mail: privacidade@vioslabs.com.br
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium uppercase tracking-[0.1em] mb-4 text-brand-softblack mt-8">
              8. Cookies
            </h2>
            <p>
              Utilizamos cookies e tecnologias similares para melhorar sua experiência, analisar o uso do site 
              e personalizar conteúdo. Você pode gerenciar suas preferências de cookies nas configurações do navegador.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium uppercase tracking-[0.1em] mb-4 text-brand-softblack mt-8">
              9. Retenção de Dados
            </h2>
            <p>
              Mantemos seus dados pessoais pelo tempo necessário para cumprir as finalidades para as quais foram coletados, 
              ou conforme exigido por lei. Após o término do prazo de retenção, os dados são eliminados ou anonimizados.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium uppercase tracking-[0.1em] mb-4 text-brand-softblack mt-8">
              10. Alterações nesta Política
            </h2>
            <p>
              Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre alterações significativas 
              através do nosso site ou por e-mail.
            </p>
          </section>

          <section className="pt-8 border-t border-gray-200 mt-12">
            <p className="text-xs text-brand-softblack/60 italic">
              Última atualização: Janeiro 2026
            </p>
            <p className="text-xs text-brand-softblack/60 mt-2">
              Para questões sobre privacidade: privacidade@vioslabs.com.br
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
