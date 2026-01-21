-- ============================================================================
-- SISTEMA DE WAITLIST - VIOS LABS
-- ============================================================================
-- Versão: 1.0
-- Data: 2026-01-21
-- Descrição: Sistema de fila de espera para produtos esgotados
--            Notifica clientes automaticamente quando produto voltar ao estoque
-- ============================================================================

-- ============================================================================
-- 1. TABELA DE WAITLIST
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notified BOOLEAN DEFAULT FALSE,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Evitar duplicatas: mesma pessoa não pode se cadastrar 2x para o mesmo produto
  CONSTRAINT unique_waitlist_entry UNIQUE (product_id, email)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_waitlist_product_id ON product_waitlist(product_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON product_waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_notified ON product_waitlist(notified);

-- ============================================================================
-- 2. FUNÇÃO: ADICIONAR À WAITLIST
-- ============================================================================

CREATE OR REPLACE FUNCTION add_to_waitlist(
  p_product_id TEXT,
  p_email TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_waitlist_id UUID;
  v_product_name TEXT;
BEGIN
  -- Verificar se o produto existe
  SELECT name INTO v_product_name
  FROM products
  WHERE id = p_product_id AND is_active = TRUE;
  
  IF v_product_name IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Product not found or inactive'
    );
  END IF;
  
  -- Tentar inserir (ou retornar existente se já cadastrado)
  INSERT INTO product_waitlist (product_id, email, user_id)
  VALUES (p_product_id, p_email, p_user_id)
  ON CONFLICT (product_id, email) 
  DO UPDATE SET 
    user_id = COALESCE(EXCLUDED.user_id, product_waitlist.user_id),
    created_at = NOW() -- Atualiza data de cadastro
  RETURNING id INTO v_waitlist_id;
  
  RETURN json_build_object(
    'success', true,
    'waitlist_id', v_waitlist_id,
    'product_name', v_product_name,
    'message', 'Você será notificado quando o produto voltar ao estoque'
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. FUNÇÃO: NOTIFICAR WAITLIST (Quando Produto Voltar ao Estoque)
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_waitlist_for_product(
  p_product_id TEXT
)
RETURNS JSON AS $$
DECLARE
  v_pending_count INTEGER;
  v_product_name TEXT;
BEGIN
  -- Verificar se há pessoas na waitlist
  SELECT COUNT(*), MAX(p.name)
  INTO v_pending_count, v_product_name
  FROM product_waitlist wl
  JOIN products p ON p.id = wl.product_id
  WHERE wl.product_id = p_product_id
    AND wl.notified = FALSE;
  
  IF v_pending_count = 0 THEN
    RETURN json_build_object(
      'success', true,
      'pending_count', 0,
      'message', 'No pending waitlist entries'
    );
  END IF;
  
  -- Marcar todos como notificados (o sistema de email vai processar)
  UPDATE product_waitlist
  SET notified = TRUE,
      notified_at = NOW()
  WHERE product_id = p_product_id
    AND notified = FALSE;
  
  RETURN json_build_object(
    'success', true,
    'product_id', p_product_id,
    'product_name', v_product_name,
    'pending_count', v_pending_count,
    'message', v_pending_count || ' customers will be notified'
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. TRIGGER: NOTIFICAR AUTOMATICAMENTE QUANDO ESTOQUE VOLTAR
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_notify_waitlist_on_restock()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o estoque disponível mudou de 0 para > 0, notificar waitlist
  IF (OLD.stock_quantity - OLD.reserved_quantity) <= 0 
     AND (NEW.stock_quantity - NEW.reserved_quantity) > 0 THEN
    
    -- Chamar função de notificação (assíncrono via pg_notify)
    PERFORM pg_notify(
      'product_restocked',
      json_build_object(
        'product_id', NEW.product_id,
        'available_quantity', NEW.stock_quantity - NEW.reserved_quantity
      )::text
    );
    
    -- Marcar waitlist para processamento
    PERFORM notify_waitlist_for_product(NEW.product_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_notify_waitlist ON inventory;
CREATE TRIGGER trigger_notify_waitlist
  AFTER UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_waitlist_on_restock();

-- ============================================================================
-- 5. VIEW: WAITLIST COM INFORMAÇÕES DE PRODUTO
-- ============================================================================

CREATE OR REPLACE VIEW waitlist_details AS
SELECT
  wl.id,
  wl.product_id,
  p.name AS product_name,
  p.price,
  p.image_url,
  wl.email,
  wl.user_id,
  wl.notified,
  wl.notified_at,
  wl.created_at,
  i.stock_quantity,
  i.reserved_quantity,
  (i.stock_quantity - i.reserved_quantity) AS available_quantity
FROM product_waitlist wl
JOIN products p ON p.id = wl.product_id
LEFT JOIN inventory i ON i.product_id = wl.product_id
ORDER BY wl.created_at DESC;

-- ============================================================================
-- 6. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ============================================================================

ALTER TABLE product_waitlist ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode se adicionar à waitlist
CREATE POLICY "Anyone can add to waitlist"
  ON product_waitlist FOR INSERT
  WITH CHECK (TRUE);

-- Usuários podem ver suas próprias entradas
CREATE POLICY "Users can view own waitlist entries"
  ON product_waitlist FOR SELECT
  USING (
    auth.uid() = user_id 
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Service role pode gerenciar tudo
CREATE POLICY "Service role can manage waitlist"
  ON product_waitlist FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- 7. GRANTS (PERMISSÕES)
-- ============================================================================

GRANT EXECUTE ON FUNCTION add_to_waitlist TO authenticated, anon;
GRANT EXECUTE ON FUNCTION notify_waitlist_for_product TO authenticated, anon;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================

-- Verificar criação
SELECT 'Waitlist table created. Ready to collect customer interest!' AS status;
