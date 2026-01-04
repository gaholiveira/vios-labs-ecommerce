export default function AboutSection() {
  return (
    <section className="bg-brand-offwhite py-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        {/* Subtítulo discreto */}
        <span className="text-brand-green uppercase tracking-[0.4em] text-[10px] font-semibold mb-6 block">
          A Nossa Essência
        </span>
        
        {/* Título Principal */}
        <h2 className="text-brand-softblack text-3xl md:text-4xl font-light uppercase tracking-tighter leading-tight mb-8">
          Design minimalista para quem <br /> 
          valoriza o essencial.
        </h2>

        {/* Texto de Apoio */}
        <p className="text-brand-softblack/70 text-sm md:text-base font-light leading-relaxed tracking-wide">
          A Vios Labs nasceu da vontade de xxxxxxxxxxxxxxxxxxxxxxxxxx
          xxxxxxxxxxxxxxxxxxxxxxxxxx
        </p>

        {/* Link ou Botão discreto */}
        <div className="mt-10">
          <a 
            href="#" 
            className="text-brand-softblack text-[10px] uppercase tracking-[0.3em] font-medium border-b border-brand-green pb-2 hover:text-brand-green transition-colors"
          >
            Conheça a nossa história
          </a>
        </div>
      </div>
    </section>
  );
}