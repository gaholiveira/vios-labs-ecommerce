'use client';
import { useCart } from '@/context/CartContext';

export default function CartDrawer() {
  const { cart, isOpen, setIsOpen } = useCart();

  return (
    <>
      {/* Overlay Escuro */}
      <div 
        className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Painel Lateral */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-white z-[70] shadow-xl transition-transform duration-500 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-light uppercase tracking-widest">O teu carrinho</h2>
            <button onClick={() => setIsOpen(false)} className="text-2xl font-light">&times;</button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <p className="text-center text-gray-500 mt-10 font-light">O teu carrinho está vazio.</p>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex gap-4 mb-6 border-b pb-6">
                  <img src={item.image} alt={item.name} className="w-20 h-24 object-cover" />
                  <div className="flex-1">
                    <h3 className="text-sm uppercase font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">Qtd: {item.quantity}</p>
                    <p className="text-sm font-semibold mt-2">R$ {item.price.toFixed(2)}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="pt-6 border-t">
              <button className="bg-brand-green text-brand-offwhite px-6 py-3 uppercase tracking-widest text-[10px]">
                Finalizar Compra
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}