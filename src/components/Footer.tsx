import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-brand-softblack text-brand-offwhite py-16 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
        <div>
          <h4 className="text-[10px] uppercase tracking-[0.3em] mb-6 font-bold">Menu</h4>
          <ul className="space-y-4 text-xs font-light tracking-widest opacity-80">
            <li><a href="#" className="hover:opacity-100 transition">Coleções</a></li>
            <li><Link href="/sobre" className="hover:opacity-100 transition">Sobre Nós</Link></li>
            <li><a href="#" className="hover:opacity-100 transition">Contacto</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[10px] uppercase tracking-[0.3em] mb-6 font-bold">Ajuda</h4>
          <ul className="space-y-4 text-xs font-light tracking-widest opacity-80">
            <li><Link href="/trocas" className="hover:opacity-100 transition">Envios e Devoluções</Link></li>
            <li><a href="#" className="hover:opacity-100 transition">Central de Atendimento</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[10px] uppercase tracking-[0.3em] mb-6 font-bold">Newsletter</h4>
          <p className="text-xs font-light tracking-widest mb-4 opacity-80">Subscreve para receber novidades.</p>
          <input 
            type="email" 
            placeholder="O TEU E-MAIL" 
            className="bg-transparent border-b border-brand-offwhite/30 w-full py-2 text-[10px] focus:outline-none focus:border-brand-offwhite transition"
          />
        </div>
      </div>
      
      {/* Links Legais */}
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-brand-offwhite/10">
        <div className="flex flex-wrap justify-center gap-6 text-[10px] font-light tracking-wider opacity-70">
          <Link href="/termos" className="hover:opacity-100 transition">
            Termos de Uso
          </Link>
          <Link href="/privacidade" className="hover:opacity-100 transition">
            Política de Privacidade
          </Link>
          <Link href="/trocas" className="hover:opacity-100 transition">
            Envios e Devoluções
          </Link>
        </div>
      </div>

      {/* Informações Fiscais */}
      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-brand-offwhite/10">
        <div className="text-[10px] text-gray-400 text-center space-y-2">
          <p>© 2026 VIOS LABS. Todos os direitos reservados.</p>
          <p className="uppercase tracking-[0.1em]">
            CNPJ: 00.000.000/0001-00
          </p>
          <p className="font-light">
            Endereço Fiscal: Rua Exemplo, 123 - Centro, São Paulo - SP, CEP 00000-000
          </p>
        </div>
      </div>
    </footer>
  );
}