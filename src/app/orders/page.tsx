'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });
      if (data) setOrders(data);
    };
    fetchOrders();
  }, []);

  return (
    <div className="min-h-screen bg-brand-offwhite pt-32 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl font-light uppercase tracking-[0.3em] mb-12">Meus Pedidos</h1>
        
        {orders.length === 0 ? (
          <p className="text-[10px] uppercase opacity-50">Ainda não realizou encomendas.</p>
        ) : (
          <div className="space-y-8">
            {orders.map((order) => (
              <div key={order.id} className="bg-white p-8 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <span className="text-[10px] uppercase tracking-widest opacity-50">Pedido #{order.id.slice(0,8)}</span>
                  <span className={`text-[10px] uppercase tracking-widest px-3 py-1 ${order.status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-gray-100'}`}>
                    {order.status}
                  </span>
                </div>
                {/* Lista de itens do pedido aqui */}
                <div className="text-[12px] font-medium">Total: {order.total_amount}€</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}