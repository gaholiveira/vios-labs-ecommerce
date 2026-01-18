import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Envios e Devoluções | VIOS LABS',
  description: 'Política de envios, trocas e devoluções da VIOS LABS.',
};

export default function TrocasPage() {
  return (
    <main className="bg-brand-offwhite min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        <h1 className="text-3xl md:text-4xl font-light uppercase tracking-tighter mb-8 text-brand-softblack">
          Envios e Devoluções
        </h1>
        
        <div className="text-sm md:text-base font-light text-brand-softblack/80 leading-relaxed space-y-6">
          <section>
            <h2 className="text-xl font-medium uppercase tracking-[0.1em] mb-4 text-brand-softblack mt-8">
              1. Política de Envios
            </h2>
            <h3 className="text-lg font-medium uppercase tracking-[0.05em] mb-3 text-brand-softblack mt-6">
              Prazo de Envio
            </h3>
            <p>
              Todos os pedidos são processados em até 2 dias úteis após a confirmação do pagamento. 
              O prazo de entrega varia conforme a localidade e modalidade de frete escolhida.
            </p>
            <h3 className="text-lg font-medium uppercase tracking-[0.05em] mb-3 text-brand-softblack mt-6">
              Opções de Frete
            </h3>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>PAC: 10 a 15 dias úteis (em média)</li>
              <li>SEDEX: 5 a 7 dias úteis (em média)</li>
              <li>Frete Expresso: 2 a 3 dias úteis (quando disponível)</li>
            </ul>
            <p className="mt-4">
              O prazo de entrega começa a contar após a postagem do pedido no correio/transportadora. 
              Você receberá um código de rastreamento por e-mail assim que o pedido for enviado.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium uppercase tracking-[0.1em] mb-4 text-brand-softblack mt-8">
              2. Cobertura de Entrega
            </h2>
            <p>
              Atualmente realizamos entregas para todo o território nacional. 
              Para cidades do interior, o prazo pode ser ligeiramente superior ao informado.
            </p>
            <p className="mt-4">
              Em caso de endereço inválido ou incompleto, entraremos em contato para confirmação. 
              Pedidos não entregues por endereço incorreto podem retornar para nossa central, 
              ocasionando atraso na entrega ou necessidade de novo envio com custo adicional.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium uppercase tracking-[0.1em] mb-4 text-brand-softblack mt-8">
              3. Política de Troca e Devolução
            </h2>
            <h3 className="text-lg font-medium uppercase tracking-[0.05em] mb-3 text-brand-softblack mt-6">
              Prazo para Solicitação
            </h3>
            <p>
              Você tem até 7 (sete) dias corridos, a contar da data de recebimento do produto, 
              para solicitar a troca ou devolução, conforme estabelecido no Código de Defesa do Consumidor (CDC).
            </p>
            <h3 className="text-lg font-medium uppercase tracking-[0.05em] mb-3 text-brand-softblack mt-6">
              Condições para Troca/Devolução
            </h3>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Produto deve estar na embalagem original, sem uso</li>
              <li>Selos de segurança e lacres intactos</li>
              <li>Nota fiscal e etiquetas anexadas</li>
              <li>Produto não pode ter sinais de uso ou manipulação indevida</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium uppercase tracking-[0.1em] mb-4 text-brand-softblack mt-8">
              4. Processo de Troca
            </h2>
            <p>
              Para solicitar uma troca:
            </p>
            <ol className="list-decimal pl-6 mt-4 space-y-2">
              <li>Entre em contato através do e-mail: atendimento@vioslabs.com.br</li>
              <li>Informe o número do pedido e o motivo da troca</li>
              <li>Nossa equipe enviará as instruções para envio do produto</li>
              <li>Após recebermos e analisarmos o produto, enviaremos o item substituto</li>
            </ol>
            <p className="mt-4">
              O frete de retorno será por conta do cliente, exceto em casos de defeito ou erro nosso.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium uppercase tracking-[0.1em] mb-4 text-brand-softblack mt-8">
              5. Processo de Devolução e Reembolso
            </h2>
            <p>
              Para solicitar uma devolução e reembolso:
            </p>
            <ol className="list-decimal pl-6 mt-4 space-y-2">
              <li>Entre em contato através do e-mail: atendimento@vioslabs.com.br</li>
              <li>Informe o número do pedido e o motivo da devolução</li>
              <li>Nossa equipe enviará as instruções para envio do produto</li>
              <li>Após recebermos e confirmarmos o produto, processaremos o reembolso</li>
            </ol>
            <h3 className="text-lg font-medium uppercase tracking-[0.05em] mb-3 text-brand-softblack mt-6">
              Prazo de Reembolso
            </h3>
            <p>
              O reembolso será processado em até 14 dias úteis após o recebimento e análise do produto. 
              O valor será devolvido na mesma forma de pagamento utilizada na compra:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Cartão de crédito: estorno na fatura do cartão (próxima fatura ou fatura seguinte)</li>
              <li>Boleto/PIX: reembolso na conta bancária informada</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium uppercase tracking-[0.1em] mb-4 text-brand-softblack mt-8">
              6. Produtos com Defeito
            </h2>
            <p>
              Caso receba um produto com defeito ou danificado durante o transporte:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Entre em contato imediatamente através do e-mail: atendimento@vioslabs.com.br</li>
              <li>Envie fotos do produto e da embalagem</li>
              <li>Nossa equipe avaliará e providenciará a troca ou reembolso</li>
              <li>O frete de retorno será por nossa conta</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium uppercase tracking-[0.1em] mb-4 text-brand-softblack mt-8">
              7. Itens Não Trocos ou Devolvidos
            </h2>
            <p>
              Por questões de higiene e segurança, não aceitamos troca ou devolução de:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Produtos com lacres violados</li>
              <li>Produtos fora da embalagem original</li>
              <li>Produtos sem nota fiscal</li>
              <li>Produtos fora do prazo de 7 dias</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium uppercase tracking-[0.1em] mb-4 text-brand-softblack mt-8">
              8. Contato
            </h2>
            <p>
              Para dúvidas, solicitações de troca ou devolução, entre em contato:
            </p>
            <ul className="list-none pl-0 mt-4 space-y-2">
              <li className="font-medium">E-mail: atendimento@vioslabs.com.br</li>
              <li>Horário de atendimento: Segunda a Sexta, das 9h às 18h</li>
            </ul>
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
