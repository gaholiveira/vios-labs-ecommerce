-- ============================================
-- SETUP COMPLETO DO BANCO DE DADOS - VIOS LABS
-- ============================================
-- Script SQL para resetar e criar todo o banco do zero
-- Execute este script no SQL Editor do Supabase
-- ============================================
-- Versão: 2.0 (Atualizada para estrutura atual)
-- Data: 2025
-- ============================================

-- ============================================
-- LIMPEZA INICIAL (Remover tudo se já existir)
-- ============================================

-- Remover triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
DROP TRIGGER IF EXISTS set_updated_at_orders ON public.orders;

-- Remover funções
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_updated_at();

-- Remover políticas RLS
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own VIP entry" ON public.vip_list;
DROP POLICY IF EXISTS "Users can insert own VIP entry" ON public.vip_list;
DROP POLICY IF EXISTS "Users can update own VIP entry" ON public.vip_list;
DROP POLICY IF EXISTS "Authenticated users can check VIP status" ON public.vip_list;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update own pending orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert own order items" ON public.order_items;

-- Remover tabelas (em ordem de dependência)
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.vip_list CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.app_config CASCADE;

-- ============================================
-- 1. TABELA PROFILES (Perfis de Usuários)
-- ============================================
-- Estrutura atualizada: apenas campos essenciais

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  username TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para melhor performance
CREATE INDEX idx_profiles_user_id ON public.profiles(id);
CREATE INDEX idx_profiles_email ON public.profiles(email) WHERE email IS NOT NULL;

-- Comentários
COMMENT ON TABLE public.profiles IS 'Perfis de usuários com informações pessoais';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL do avatar do usuário (Supabase Storage)';

-- ============================================
-- 2. TABELA APP_CONFIG (Configurações da Aplicação)
-- ============================================
-- Usado para controlar flags globais (ex: sales_open para Lote Zero)

CREATE TABLE public.app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Inserir configuração padrão
INSERT INTO public.app_config (key, value, description) 
VALUES ('sales_open', 'false', 'Controla se as vendas do Lote Zero estão abertas')
ON CONFLICT (key) DO NOTHING;

-- Índice
CREATE INDEX idx_app_config_key ON public.app_config(key);

-- Comentário
COMMENT ON TABLE public.app_config IS 'Configurações globais da aplicação';

-- ============================================
-- 3. TABELA VIP_LIST (Lista VIP - Lote Zero)
-- ============================================

CREATE TABLE public.vip_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para melhor performance
CREATE INDEX idx_vip_list_user_id ON public.vip_list(user_id);
CREATE INDEX idx_vip_list_email ON public.vip_list(email);
CREATE INDEX idx_vip_list_created_at ON public.vip_list(created_at DESC);

-- Comentário
COMMENT ON TABLE public.vip_list IS 'Lista VIP para acesso ao Lote Zero';

-- ============================================
-- 4. TABELA ORDERS (Pedidos)
-- ============================================
-- Suporte para Guest Checkout: user_id pode ser NULL

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL para guest checkout
  customer_email TEXT NOT NULL, -- Obrigatório (coletado no Stripe Checkout)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  stripe_session_id TEXT, -- ID da sessão do Stripe
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para melhor performance
CREATE INDEX idx_orders_user_id ON public.orders(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_stripe_session_id ON public.orders(stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);

-- Comentário
COMMENT ON TABLE public.orders IS 'Pedidos realizados (suporta guest checkout)';
COMMENT ON COLUMN public.orders.user_id IS 'NULL para pedidos de convidados (guest checkout)';
COMMENT ON COLUMN public.orders.customer_email IS 'Email do cliente (obrigatório para guest checkout)';

-- ============================================
-- 5. TABELA ORDER_ITEMS (Itens dos Pedidos)
-- ============================================

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC(10, 2) NOT NULL,
  product_image TEXT, -- URL da imagem do produto
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para melhor performance
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);

-- Comentário
COMMENT ON TABLE public.order_items IS 'Itens individuais de cada pedido';

-- ============================================
-- 6. FUNÇÕES AUXILIARES
-- ============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para criar perfil automaticamente quando um usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Evita erro se o perfil já existir
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. TRIGGERS
-- ============================================

-- Trigger para atualizar updated_at em profiles
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para atualizar updated_at em orders
CREATE TRIGGER set_updated_at_orders
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para criar perfil automaticamente quando um usuário é criado
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 8. ROW LEVEL SECURITY (RLS) - SEGURANÇA
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- app_config não precisa de RLS (é público para leitura)

-- ============================================
-- 9. POLÍTICAS RLS PARA PROFILES
-- ============================================

-- Usuários podem ver apenas seu próprio perfil
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Usuários podem inserir seu próprio perfil
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 10. POLÍTICAS RLS PARA VIP_LIST
-- ============================================

-- Usuários podem ver apenas sua própria entrada na lista VIP
CREATE POLICY "Users can view own VIP entry"
  ON public.vip_list
  FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários podem inserir sua própria entrada na lista VIP
CREATE POLICY "Users can insert own VIP entry"
  ON public.vip_list
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar sua própria entrada na lista VIP
CREATE POLICY "Users can update own VIP entry"
  ON public.vip_list
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Permitir que usuários autenticados vejam se estão na lista
CREATE POLICY "Authenticated users can check VIP status"
  ON public.vip_list
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- ============================================
-- 11. POLÍTICAS RLS PARA ORDERS
-- ============================================

-- Usuários autenticados podem ver seus próprios pedidos
-- Para guest checkout: pedidos sem user_id só podem ser vistos pelo Stripe webhook (service role)
CREATE POLICY "Users can view own orders"
  ON public.orders
  FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR user_id IS NULL -- Guest checkout (só service role pode ver)
  );

-- Usuários autenticados podem criar seus próprios pedidos
-- Guest checkout cria pedidos sem user_id (feito via service role no webhook)
CREATE POLICY "Users can create own orders"
  ON public.orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seus próprios pedidos (apenas status pendente)
CREATE POLICY "Users can update own pending orders"
  ON public.orders
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 12. POLÍTICAS RLS PARA ORDER_ITEMS
-- ============================================

-- Usuários podem ver itens de seus próprios pedidos
CREATE POLICY "Users can view own order items"
  ON public.order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND (
        orders.user_id = auth.uid()
        OR orders.user_id IS NULL -- Guest checkout (só service role pode ver)
      )
    )
  );

-- Usuários podem inserir itens em seus próprios pedidos
CREATE POLICY "Users can insert own order items"
  ON public.order_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- ============================================
-- 13. POLÍTICAS PARA APP_CONFIG (Público)
-- ============================================
-- app_config é público para leitura (não precisa de autenticação)
-- Mas não precisa criar políticas já que RLS não está habilitado

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

-- Verificar se todas as tabelas foram criadas
DO $$
DECLARE
  tables_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO tables_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'app_config', 'vip_list', 'orders', 'order_items');
  
  IF tables_count = 5 THEN
    RAISE NOTICE '✅ Todas as 5 tabelas foram criadas com sucesso!';
  ELSE
    RAISE WARNING '⚠️ Apenas % de 5 tabelas foram criadas', tables_count;
  END IF;
END $$;

-- ============================================
-- PRÓXIMOS PASSOS
-- ============================================
-- 
-- 1. ✅ Execute este script no SQL Editor do Supabase
-- 2. ✅ Verifique se todas as tabelas foram criadas (Table Editor)
-- 3. ✅ Execute o script storage_policies.sql para configurar Storage
-- 4. ✅ Crie o bucket 'avatars' no Supabase Storage (público)
-- 5. ✅ Configure as variáveis de ambiente:
--    - NEXT_PUBLIC_SUPABASE_URL
--    - NEXT_PUBLIC_SUPABASE_ANON_KEY
--    - STRIPE_SECRET_KEY (para webhook)
--    - STRIPE_WEBHOOK_SECRET (para webhook)
-- 
-- ============================================
-- ESTRUTURA FINAL DAS TABELAS
-- ============================================
-- 
-- profiles: id, full_name, avatar_url, email, username, website, created_at, updated_at
-- app_config: key, value, description, updated_at
-- vip_list: id, email, user_id, full_name, created_at
-- orders: id, user_id (NULL para guest), customer_email, status, total_amount, stripe_session_id, created_at, updated_at
-- order_items: id, order_id, product_id, product_name, quantity, price, product_image, created_at
-- 
-- ============================================
