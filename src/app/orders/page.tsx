'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/utils/format';
import { Check, Package, Truck, XCircle } from 'lucide-react';
import Skeleton from '@/components/ui/Skeleton';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  product_image: string | null;
}

interface Order {
  id: string;
  user_id: string | null;
  customer_email: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  stripe_session_id: string | null;
  created_at: string;
  order_items: OrderItem[];
}

const statusConfig = {
  pending: { label: 'Pendente', icon: Package, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  paid: { label: 'Pago', icon: Check, color: 'bg-green-50 text-green-700 border-green-200' },
  shipped: { label: 'Enviado', icon: Truck, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  delivered: { label: 'Entregue', icon: Check, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Cancelado', icon: XCircle, color: 'bg-red-50 text-red-700 border-red-200' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [associating, setAssociating] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Associar pedidos de guest ao usuário autenticado
  const associateGuestOrders = async () => {
    try {
      setAssociating(true);
      // Chamar a função do Supabase para associar pedidos
      const { error } = await supabase.rpc('associate_my_guest_orders');
      if (error) {
        // Função pode não existir ainda se o SQL não foi executado
        if (error.code === '42883' || error.message?.includes('does not exist')) {
          // Função não encontrada - silenciosamente ignorar (desenvolvimento)
        } else {
          console.error('Erro ao associar pedidos:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
        }
      }
      // Silenciosamente processar associação (sem logs de debug em produção)
    } catch (error: any) {
      console.error('Erro ao associar pedidos:', error?.message || error);
    } finally {
      setAssociating(false);
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        
        // Verificar se o usuário está autenticado
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          // Se não estiver autenticado, redirecionar para login
          router.push('/login?redirect=/orders');
          return;
        }

        // Associar pedidos de guest ao usuário (se houver)
        await associateGuestOrders();

        // Buscar pedidos do usuário (por user_id OU email)
        // A política RLS deve permitir acesso por user_id ou customer_email
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items(*)
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erro ao buscar pedidos:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
          // Mostrar erro mais detalhado para debug
          console.error('Erro completo:', JSON.stringify(error, null, 2));
          return;
        }

        if (data) {
          setOrders(data as Order[]);
        }
      } catch (error) {
        console.error('Erro ao carregar pedidos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [router, supabase]);

  // Formatação de data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-offwhite pt-32 md:pt-40 px-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-stone-100 rounded-xl shadow-sm p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-6 pb-4 border-b border-stone-100">
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <Skeleton className="h-6 w-24" />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-16 h-16 md:w-20 md:h-20 rounded-sm shrink-0" variant="rectangular" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-4 w-16 shrink-0" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-offwhite pt-32 md:pt-40 px-4 md:px-6 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-light uppercase tracking-widest mb-2 text-brand-softblack">
            Meus Pedidos
          </h1>
          <p className="text-sm font-light text-stone-600">
            Acompanhe todos os seus pedidos em um só lugar
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white border border-stone-100 rounded-xl p-12 md:p-16 text-center shadow-sm">
            <Package className="w-16 h-16 mx-auto text-stone-300 mb-6" />
            <h2 className="text-xl font-light text-stone-700 mb-3">
              Ainda não realizou encomendas
            </h2>
            <p className="text-sm text-stone-500 mb-8 max-w-md mx-auto">
              Quando você fizer um pedido, ele aparecerá aqui para acompanhamento.
            </p>
            <Link
              href="/"
              className="inline-block border border-brand-green text-brand-green bg-transparent px-8 py-3 uppercase text-xs tracking-widest hover:bg-brand-green hover:text-white transition-all duration-300 rounded-sm"
            >
              Explorar Produtos
            </Link>
          </div>
        ) : (
          <div className="space-y-6 md:space-y-8">
            {orders.map((order) => {
              const statusInfo = statusConfig[order.status];
              const StatusIcon = statusInfo.icon;

              return (
                <div
                  key={order.id}
                  className="bg-white border border-stone-100 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
                >
                  {/* Header do Pedido */}
                  <div className="p-6 md:p-8 border-b border-stone-100">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs uppercase tracking-widest text-stone-400 font-medium">
                            Pedido #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-sm text-stone-500">
                          Realizado em {formatDate(order.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">Total</p>
                        <p className="text-2xl font-light text-brand-softblack">
                          {formatPrice(order.total_amount)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Itens do Pedido */}
                  <div className="p-6 md:p-8">
                    <div className="space-y-4">
                      {order.order_items && order.order_items.length > 0 ? (
                        order.order_items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-4 pb-4 border-b border-stone-50 last:border-0 last:pb-0"
                          >
                            {item.product_image ? (
                              <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-sm overflow-hidden border border-stone-100 shrink-0">
                                <Image
                                  src={item.product_image}
                                  alt={item.product_name}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 768px) 64px, 80px"
                                  unoptimized={item.product_image.includes('localhost') || item.product_image.startsWith('/images/')}
                                />
                              </div>
                            ) : (
                              <div className="w-16 h-16 md:w-20 md:h-20 bg-stone-100 rounded-sm flex items-center justify-center shrink-0">
                                <Package className="w-6 h-6 text-stone-300" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-brand-softblack mb-1 line-clamp-2">
                                {item.product_name}
                              </h3>
                              <div className="flex items-center gap-4 text-xs text-stone-500">
                                <span>Qtd: {item.quantity}</span>
                                <span>× {formatPrice(item.price)}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-medium text-brand-softblack">
                                {formatPrice(item.price * item.quantity)}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-stone-400">Nenhum item encontrado</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
