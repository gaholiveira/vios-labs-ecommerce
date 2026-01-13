export default function Footer() {
  return (
    <footer className="bg-brand-softblack text-brand-offwhite py-16 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
        <div>
          <h4 className="text-[10px] uppercase tracking-[0.3em] mb-6 font-bold">Menu</h4>
          <ul className="space-y-4 text-xs font-light tracking-widest opacity-80">
            <li><a href="#" className="hover:opacity-100 transition">Coleções</a></li>
            <li><a href="/sobre" className="hover:opacity-100 transition">Sobre Nós</a></li>
            <li><a href="#" className="hover:opacity-100 transition">Contacto</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[10px] uppercase tracking-[0.3em] mb-6 font-bold">Ajuda</h4>
          <ul className="space-y-4 text-xs font-light tracking-widest opacity-80">
            <li><a href="#" className="hover:opacity-100 transition">Envios</a></li>
            <li><a href="#" className="hover:opacity-100 transition">Trocas e Devoluções</a></li>
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
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-brand-offwhite/10 text-[8px] uppercase tracking-[0.2em] text-center opacity-50">
        © 2026 VIOS LABS. Todos os direitos reservados.
      </div>
    </footer>
  );
}