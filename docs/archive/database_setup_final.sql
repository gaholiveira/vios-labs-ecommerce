-- ============================================
-- SETUP COMPLETO DO BANCO DE DADOS - VIOS LABS V2 (FINAL)
-- Sistema de Autenticação Otimizado
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- Este script é idempotente (pode ser executado múltiplas vezes)
-- Garante que todas as colunas existem antes de criar triggers
-- ============================================

-- ============================================
-- 0. GARANTIR QUE A TABELA PROFILES TEM TODAS AS COLUNAS
-- ============================================

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  address_street TEXT,
  address_city TEXT,
  address_postcode TEXT,
  address_country TEXT DEFAULT 'Brasil',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Adicionar colunas que podem não existir (se a tabela já existir)
DO $$ 
BEGIN
  -- Adicionar colunas se não existirem
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'address_country'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN address_country TEXT DEFAULT 'Brasil';
  END IF;
END $$;

-- Atualizar valores NULL para created_at e updated_at (se existirem registros antigos)
UPDATE public.profiles 
SET created_at = TIMEZONE('utc'::text, NOW())
WHERE created_at IS NULL;

UPDATE public.profiles 
SET updated_at = TIMEZONE('utc'::text, NOW())
WHERE updated_at IS NULL;

UPDATE public.profiles 
SET address_country = 'Brasil' 
WHERE address_country IS NULL OR address_country = 'Portugal';

-- ============================================
-- 1. ÍNDICES PARA PROFILES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- ============================================
-- 2. FUNÇÃO E TRIGGER PARA UPDATED_AT
-- ============================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger se já existir antes de criar
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 3. TABELA VIP_LIST (Lista VIP - Lote Zero)
-- ============================================

CREATE TABLE IF NOT EXISTS public.vip_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Garantir que created_at existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vip_list' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.vip_list ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;
  END IF;
END $$;

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_vip_list_user_id ON public.vip_list(user_id);
CREATE INDEX IF NOT EXISTS idx_vip_list_email ON public.vip_list(email);
CREATE INDEX IF NOT EXISTS idx_vip_list_created_at ON public.vip_list(created_at DESC);

-- ============================================
-- 4. TABELA ORDERS (Pedidos)
-- ============================================

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Garantir que created_at e updated_at existem
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;
  END IF;
END $$;

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS set_updated_at_orders ON public.orders;
CREATE TRIGGER set_updated_at_orders
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 5. TABELA ORDER_ITEMS (Itens dos Pedidos)
-- ============================================

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Garantir que created_at existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'order_items' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.order_items ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;
  END IF;
END $$;

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS) - SEGURANÇA
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. POLÍTICAS RLS PARA PROFILES
-- ============================================

-- Remover políticas existentes antes de criar (evita duplicação)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

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
-- 8. POLÍTICAS RLS PARA VIP_LIST
-- ============================================

-- Remover políticas existentes antes de criar
DROP POLICY IF EXISTS "Users can view own VIP entry" ON public.vip_list;
DROP POLICY IF EXISTS "Users can insert own VIP entry" ON public.vip_list;
DROP POLICY IF EXISTS "Users can update own VIP entry" ON public.vip_list;
DROP POLICY IF EXISTS "Authenticated users can check VIP status" ON public.vip_list;

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
-- 9. POLÍTICAS RLS PARA ORDERS
-- ============================================

-- Remover políticas existentes antes de criar
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update own pending orders" ON public.orders;

-- Usuários podem ver apenas seus próprios pedidos
CREATE POLICY "Users can view own orders"
  ON public.orders
  FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários podem criar seus próprios pedidos
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
-- 10. POLÍTICAS RLS PARA ORDER_ITEMS
-- ============================================

-- Remover políticas existentes antes de criar
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert own order items" ON public.order_items;

-- Usuários podem ver itens de seus próprios pedidos
CREATE POLICY "Users can view own order items"
  ON public.order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
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
-- 11. FUNÇÃO PARA CRIAR PERFIL AUTOMATICAMENTE
-- ============================================

-- Função que cria um perfil automaticamente quando um usuário é criado
-- IMPORTANTE: Esta função só será criada APÓS garantir que a tabela profiles existe com todas as colunas
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, address_country, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'address_country', 'Brasil'),
    TIMEZONE('utc'::text, NOW()),
    TIMEZONE('utc'::text, NOW())
  )
  ON CONFLICT (id) DO NOTHING; -- Evita erro se o perfil já existir
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que executa a função quando um novo usuário é criado
-- IMPORTANTE: Criado DEPOIS da função e DEPOIS de garantir que a tabela existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 12. COMENTÁRIOS NAS TABELAS (Documentação)
-- ============================================

COMMENT ON TABLE public.profiles IS 'Perfis de usuários com informações pessoais e endereço';
COMMENT ON TABLE public.vip_list IS 'Lista VIP para acesso ao Lote Zero';
COMMENT ON TABLE public.orders IS 'Pedidos realizados pelos usuários';
COMMENT ON TABLE public.order_items IS 'Itens individuais de cada pedido';

-- ============================================
-- 13. VERIFICAÇÃO FINAL
-- ============================================

-- Verificar se tudo está configurado corretamente
DO $$ 
BEGIN
  -- Verificar se a tabela profiles tem todas as colunas necessárias
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'created_at'
  ) THEN
    RAISE EXCEPTION 'Erro: Coluna created_at não existe na tabela profiles';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'updated_at'
  ) THEN
    RAISE EXCEPTION 'Erro: Coluna updated_at não existe na tabela profiles';
  END IF;

  -- Verificar se o trigger existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    RAISE WARNING 'Aviso: Trigger on_auth_user_created não foi criado';
  END IF;

  RAISE NOTICE '✓ Configuração do banco de dados concluída com sucesso!';
END $$;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
-- 
-- PRÓXIMOS PASSOS:
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Verifique se não há erros (deve mostrar mensagem de sucesso)
-- 3. Teste as políticas RLS criando um usuário de teste
-- 4. Configure as variáveis de ambiente no Vercel:
--    - NEXT_PUBLIC_SUPABASE_URL
--    - NEXT_PUBLIC_SUPABASE_ANON_KEY
-- 5. Execute o middleware para refresh automático de sessão
-- 
-- ============================================
