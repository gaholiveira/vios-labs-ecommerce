export default function Loading() {
  return (
    <div className="flex items-center justify-center h-screen w-full bg-brand-offwhite">
      <div className="flex flex-col items-center gap-8">
        {/* Spinner Circular Ultra-Fino Customizado */}
        <div className="relative">
          <svg
            className="w-16 h-16 animate-spin text-brand-green"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            {/* Círculo de fundo sutil */}
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="1"
              strokeOpacity="0.1"
            />
            {/* Arco girando - traço fino */}
            <path
              d="M12 2a10 10 0 0 1 10 10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="20 60"
              fill="none"
            />
          </svg>
        </div>

        {/* Logo VIOS com Pulse Sutil */}
        <div className="flex items-center">
          <span className="text-xl font-extralight uppercase tracking-[0.4em] text-brand-green animate-pulse">
            VIOS
          </span>
        </div>
      </div>
    </div>
  );
}
