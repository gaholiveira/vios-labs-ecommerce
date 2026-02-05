"use client";

interface KitImageTemplateProps {
  kitName: string;
  badge?: 'kit' | 'protocolo';
}

export default function KitImageTemplate({ kitName, badge }: KitImageTemplateProps) {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-brand-offwhite via-brand-offwhite to-brand-champagne/30 flex items-center justify-center">
      {/* Padrão de fundo sutil */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            #082f1e 10px,
            #082f1e 11px
          )`,
        }} />
      </div>

      {/* Conteúdo central */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center space-y-2.5 py-8">
        {/* Badge superior */}
        <div>
          <span className="inline-block bg-brand-green text-brand-offwhite px-3 py-1 text-[9px] uppercase tracking-[0.2em] font-medium">
            {badge === 'kit' ? 'Kit' : 'Protocolo'}
          </span>
        </div>

        {/* Nome do Kit */}
        <h3 className="text-sm sm:text-base md:text-lg uppercase tracking-wider font-light text-brand-gold leading-tight max-w-[180px]">
          {kitName}
        </h3>

        {/* Divisor decorativo */}
        <div className="w-10 h-px bg-gradient-to-r from-transparent via-brand-gold/50 to-transparent" />

        {/* Texto de lançamento */}
        <div className="space-y-0.5">
          <p className="text-[9px] uppercase tracking-[0.15em] text-brand-softblack/60 font-light">
            Lançamento
          </p>
          <p className="text-[8px] uppercase tracking-[0.2em] text-brand-green font-medium">
            Em Breve
          </p>
        </div>

        {/* Logo VIOS sutil */}
        <div className="mt-1">
          <p className="text-[7px] uppercase tracking-[0.3em] text-brand-softblack/40 font-light">
            VIOS LABS
          </p>
        </div>
      </div>

      {/* Borda decorativa sutil */}
      <div className="absolute inset-0 border border-brand-gold/10 pointer-events-none" />
    </div>
  );
}
