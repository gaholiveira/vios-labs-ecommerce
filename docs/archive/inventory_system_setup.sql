-- ============================================================================
-- SISTEMA DE GESTÃO DE ESTOQUE - VIOS LABS
-- ============================================================================
-- Versão: 1.0
-- Data: 2026-01-21
-- Descrição: Sistema completo de controle de estoque com reservas temporárias
--            e proteção contra overselling (Enterprise-Grade)
-- ============================================================================

-- ============================================================================
-- 1. TABELA DE PRODUTOS
-- ============================================================================
-- Armazena o catálogo de produtos com informações detalhadas

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY, -- Ex: 'prod_1', 'prod_2'
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  old_price DECIMAL(10, 2), -- Preço antigo para promoções
  category TEXT NOT NULL,
  image_url TEXT,
  badge TEXT, -- 'bestseller', 'novo', 'vegano'
  anvisa_record TEXT, -- Registro ANVISA (se aplicável)
  rating DECIMAL(2, 1), -- Avaliação (0.0 - 5.0)
  reviews INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE, -- Produto ativo no catálogo
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON products 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. TABELA DE INVENTÁRIO (ESTOQUE)
-- ============================================================================
-- Controla o estoque disponível de cada produto

CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  -- available_quantity é calculado: stock_quantity - reserved_quantity
  low_stock_threshold INTEGER DEFAULT 10, -- Alerta de estoque baixo
  reorder_point INTEGER DEFAULT 5, -- Ponto de reposição
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: reserved_quantity não pode ser maior que stock_quantity
  CONSTRAINT check_reserved_quantity CHECK (reserved_quantity <= stock_quantity)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_quantity ON inventory(stock_quantity);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_inventory_updated_at 
  BEFORE UPDATE ON inventory 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. TABELA DE RESERVAS DE ESTOQUE
-- ============================================================================
-- Reserva temporária de estoque durante o checkout
-- Expira automaticamente após 1 hora

CREATE TABLE IF NOT EXISTS inventory_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  stripe_session_id TEXT UNIQUE, -- ID da sessão do Stripe
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL, -- Reserva expira em 1 hora
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Metadata adicional
  customer_email TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_reservations_product_id ON inventory_reservations(product_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON inventory_reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_stripe_session ON inventory_reservations(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_reservations_expires_at ON inventory_reservations(expires_at);

-- ============================================================================
-- 4. TABELA DE HISTÓRICO DE ESTOQUE (AUDITORIA)
-- ============================================================================
-- Log de todas as movimentações de estoque para auditoria

CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('sale', 'reservation', 'reservation_release', 'restock', 'adjustment', 'return')),
  quantity_change INTEGER NOT NULL, -- Positivo = entrada, Negativo = saída
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  reference_id TEXT, -- ID de referência (order_id, reservation_id, etc.)
  reason TEXT,
  created_by TEXT, -- user_id ou 'system'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_movements_product_id ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_movements_created_at ON inventory_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movements_reference_id ON inventory_movements(reference_id);

-- ============================================================================
-- 5. FUNÇÃO: RESERVAR ESTOQUE (CHECKOUT)
-- ============================================================================
-- Reserva estoque durante o checkout (expira em 1 hora)

CREATE OR REPLACE FUNCTION reserve_inventory(
  p_product_id TEXT,
  p_quantity INTEGER,
  p_stripe_session_id TEXT,
  p_customer_email TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_available_stock INTEGER;
  v_reservation_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Verificar estoque disponível
  SELECT (stock_quantity - reserved_quantity) INTO v_available_stock
  FROM inventory
  WHERE product_id = p_product_id
  FOR UPDATE; -- Lock para evitar race conditions
  
  -- Validar se há estoque suficiente
  IF v_available_stock IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Product not found in inventory'
    );
  END IF;
  
  IF v_available_stock < p_quantity THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient stock',
      'available', v_available_stock,
      'requested', p_quantity
    );
  END IF;
  
  -- Definir expiração (1 hora a partir de agora)
  v_expires_at := NOW() + INTERVAL '1 hour';
  
  -- Criar reserva
  INSERT INTO inventory_reservations (
    product_id,
    quantity,
    stripe_session_id,
    customer_email,
    user_id,
    expires_at,
    status
  ) VALUES (
    p_product_id,
    p_quantity,
    p_stripe_session_id,
    p_customer_email,
    p_user_id,
    v_expires_at,
    'active'
  ) RETURNING id INTO v_reservation_id;
  
  -- Incrementar reserved_quantity no inventory
  UPDATE inventory
  SET reserved_quantity = reserved_quantity + p_quantity
  WHERE product_id = p_product_id;
  
  -- Log da movimentação
  INSERT INTO inventory_movements (
    product_id,
    movement_type,
    quantity_change,
    quantity_before,
    quantity_after,
    reference_id,
    reason,
    created_by
  ) VALUES (
    p_product_id,
    'reservation',
    -p_quantity,
    v_available_stock,
    v_available_stock - p_quantity,
    v_reservation_id::TEXT,
    'Checkout reservation',
    COALESCE(p_user_id::TEXT, 'guest')
  );
  
  RETURN json_build_object(
    'success', true,
    'reservation_id', v_reservation_id,
    'expires_at', v_expires_at
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. FUNÇÃO: CONFIRMAR RESERVA (PAGAMENTO APROVADO)
-- ============================================================================
-- Converte reserva em venda confirmada após pagamento

CREATE OR REPLACE FUNCTION confirm_reservation(
  p_stripe_session_id TEXT,
  p_order_id TEXT
)
RETURNS JSON AS $$
DECLARE
  v_reservation_record RECORD;
BEGIN
  -- Buscar reserva ativa
  SELECT * INTO v_reservation_record
  FROM inventory_reservations
  WHERE stripe_session_id = p_stripe_session_id
    AND status = 'active'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Reservation not found or already processed'
    );
  END IF;
  
  -- Decrementar stock_quantity (efetiva a venda)
  UPDATE inventory
  SET stock_quantity = stock_quantity - v_reservation_record.quantity,
      reserved_quantity = reserved_quantity - v_reservation_record.quantity
  WHERE product_id = v_reservation_record.product_id;
  
  -- Marcar reserva como completed
  UPDATE inventory_reservations
  SET status = 'completed',
      completed_at = NOW()
  WHERE id = v_reservation_record.id;
  
  -- Log da movimentação (venda)
  INSERT INTO inventory_movements (
    product_id,
    movement_type,
    quantity_change,
    quantity_before,
    quantity_after,
    reference_id,
    reason,
    created_by
  )
  SELECT
    v_reservation_record.product_id,
    'sale',
    -v_reservation_record.quantity,
    i.stock_quantity + v_reservation_record.quantity,
    i.stock_quantity,
    p_order_id,
    'Order confirmed',
    COALESCE(v_reservation_record.user_id::TEXT, 'guest')
  FROM inventory i
  WHERE i.product_id = v_reservation_record.product_id;
  
  RETURN json_build_object(
    'success', true,
    'product_id', v_reservation_record.product_id,
    'quantity_sold', v_reservation_record.quantity
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. FUNÇÃO: CANCELAR/LIBERAR RESERVA
-- ============================================================================
-- Libera estoque reservado (checkout cancelado ou expirado)

CREATE OR REPLACE FUNCTION release_reservation(
  p_stripe_session_id TEXT,
  p_reason TEXT DEFAULT 'Manual cancellation'
)
RETURNS JSON AS $$
DECLARE
  v_reservation_record RECORD;
BEGIN
  -- Buscar reserva ativa
  SELECT * INTO v_reservation_record
  FROM inventory_reservations
  WHERE stripe_session_id = p_stripe_session_id
    AND status = 'active'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Reservation not found or already processed'
    );
  END IF;
  
  -- Decrementar reserved_quantity (libera estoque)
  UPDATE inventory
  SET reserved_quantity = reserved_quantity - v_reservation_record.quantity
  WHERE product_id = v_reservation_record.product_id;
  
  -- Marcar reserva como cancelled
  UPDATE inventory_reservations
  SET status = 'cancelled',
      completed_at = NOW()
  WHERE id = v_reservation_record.id;
  
  -- Log da movimentação
  INSERT INTO inventory_movements (
    product_id,
    movement_type,
    quantity_change,
    quantity_before,
    quantity_after,
    reference_id,
    reason,
    created_by
  )
  SELECT
    v_reservation_record.product_id,
    'reservation_release',
    v_reservation_record.quantity,
    (i.stock_quantity - i.reserved_quantity),
    (i.stock_quantity - i.reserved_quantity) + v_reservation_record.quantity,
    v_reservation_record.id::TEXT,
    p_reason,
    'system'
  FROM inventory i
  WHERE i.product_id = v_reservation_record.product_id;
  
  RETURN json_build_object(
    'success', true,
    'product_id', v_reservation_record.product_id,
    'quantity_released', v_reservation_record.quantity
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. FUNÇÃO: LIMPAR RESERVAS EXPIRADAS (CRON JOB)
-- ============================================================================
-- Libera automaticamente reservas expiradas

CREATE OR REPLACE FUNCTION cleanup_expired_reservations()
RETURNS INTEGER AS $$
DECLARE
  v_expired_count INTEGER;
  v_reservation RECORD;
BEGIN
  v_expired_count := 0;
  
  -- Buscar todas as reservas expiradas
  FOR v_reservation IN
    SELECT *
    FROM inventory_reservations
    WHERE status = 'active'
      AND expires_at < NOW()
    FOR UPDATE
  LOOP
    -- Liberar cada reserva
    UPDATE inventory
    SET reserved_quantity = reserved_quantity - v_reservation.quantity
    WHERE product_id = v_reservation.product_id;
    
    -- Marcar como expirada
    UPDATE inventory_reservations
    SET status = 'expired',
        completed_at = NOW()
    WHERE id = v_reservation.id;
    
    -- Log
    INSERT INTO inventory_movements (
      product_id,
      movement_type,
      quantity_change,
      quantity_before,
      quantity_after,
      reference_id,
      reason,
      created_by
    )
    SELECT
      v_reservation.product_id,
      'reservation_release',
      v_reservation.quantity,
      (i.stock_quantity - i.reserved_quantity) - v_reservation.quantity,
      (i.stock_quantity - i.reserved_quantity),
      v_reservation.id::TEXT,
      'Reservation expired',
      'system'
    FROM inventory i
    WHERE i.product_id = v_reservation.product_id;
    
    v_expired_count := v_expired_count + 1;
  END LOOP;
  
  RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. VIEW: ESTOQUE DISPONÍVEL (PARA CONSULTAS)
-- ============================================================================

CREATE OR REPLACE VIEW inventory_status AS
SELECT
  p.id AS product_id,
  p.name AS product_name,
  p.price,
  p.is_active,
  i.stock_quantity,
  i.reserved_quantity,
  (i.stock_quantity - i.reserved_quantity) AS available_quantity,
  i.low_stock_threshold,
  i.reorder_point,
  CASE
    WHEN (i.stock_quantity - i.reserved_quantity) = 0 THEN 'out_of_stock'
    WHEN (i.stock_quantity - i.reserved_quantity) <= i.low_stock_threshold THEN 'low_stock'
    ELSE 'in_stock'
  END AS stock_status,
  i.updated_at AS inventory_updated_at
FROM products p
LEFT JOIN inventory i ON p.id = i.product_id
WHERE p.is_active = TRUE;

-- ============================================================================
-- 10. INSERIR PRODUTOS INICIAIS (VIOS LABS)
-- ============================================================================

-- Limpar dados anteriores (se houver)
DELETE FROM inventory_reservations;
DELETE FROM inventory_movements;
DELETE FROM inventory;
DELETE FROM products;

-- Inserir produtos VIOS
INSERT INTO products (id, name, description, price, category, image_url, anvisa_record, is_active) VALUES
('prod_1', 'Vios Glow', 'O VIOS Glow é uma joia biotecnológica em forma de cápsulas, desenvolvida para quem exige a máxima performance estética. Esta fórmula de alta absorção foi desenhada para restaurar a arquitetura dérmica e elevar o brilho natural da pele, cabelos e unhas ao seu ápice. Com 60 cápsulas de 550mg e dose de 2 cápsulas ao dia, une a precisão farmacêutica à máxima biodisponibilidade.', 219.00, 'Suplemento', '/images/products/glow.jpeg', NULL, TRUE),
('prod_2', 'Vios Sleep', 'O VIOS Sleep é uma joia biotecnológica em forma de solução oral, desenhada para quem busca a perfeição no ciclo de repouso. Esta fórmula líquida de alta pureza utiliza a melatonina para harmonizar o ritmo circadiano, permitindo que o organismo alcance um estado de restauração profunda e contínua. Projetado para uma absorção imediata, o VIOS Sleep oferece uma experiência sensorial calmante com o delicado sabor de maracujá, preparando os sentidos para o relaxamento absoluto sem a ingestão de açúcares ou calorias.', 179.00, 'Suplemento', '/images/products/sleep.jpeg', '25351.088701/2025-70', TRUE),
('prod_3', 'Vios Mag3', 'O VIOS MAG3 é uma joia da engenharia molecular, desenvolvida para quem busca o equilíbrio sistêmico através da tripla infusão de magnésio. Esta fórmula avançada une três formas distintas do mineral para garantir uma cobertura biológica completa, proporcionando alta absorção e um efeito prolongado no organismo. Projetado para ser uma combinação inteligente e potente, o MAG3 é o aliado definitivo para manter a homeostase corporal, oferecendo suporte contínuo à saúde óssea e neuromuscular.', 167.00, 'Suplemento', '/images/products/mag3.jpeg', '25351.066423/2025-08', TRUE),
('prod_4', 'Vios Pulse', 'O VIOS Pulse é uma joia da bioengenharia, desenvolvida para quem busca o ápice da performance física e mental. Este suplemento de alta performance combina ativos de precisão para proporcionar um estado de foco inabalável e energia contínua, elevando a termogênese e a resistência sistêmica. Projetado como um estimulante de elite, o Pulse é o aliado definitivo para transformar rituais de atividade física em experiências de máximo rendimento e clareza cognitiva.', 197.00, 'Suplemento', '/images/products/pulse.jpeg', NULL, TRUE),
('prod_5', 'Vios Move', 'O VIOS Move é uma joia da engenharia biotecnológica, desenhada para quem busca a máxima preservação da mobilidade e do bem-estar estrutural. Esta fórmula avançada combina ativos de precisão para fortalecer os tecidos musculares e proteger a integridade de ossos e articulações. Projetado como um suporte multiações, o Move atua na redução de processos inflamatórios e na otimização da lubrificação articular, sendo o aliado definitivo para uma vida em movimento e alta performance funcional.', 189.00, 'Suplemento', '/images/products/move.jpeg', '25351.215933/2025-15', TRUE);

-- Inserir estoque inicial (100 unidades de cada produto)
INSERT INTO inventory (product_id, stock_quantity, reserved_quantity, low_stock_threshold, reorder_point) VALUES
('prod_1', 100, 0, 10, 5),
('prod_2', 100, 0, 10, 5),
('prod_3', 100, 0, 10, 5),
('prod_4', 100, 0, 10, 5),
('prod_5', 100, 0, 10, 5);

-- ============================================================================
-- 11. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ============================================================================

-- Habilitar RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- Policies para products (todos podem ler produtos ativos)
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Service role can manage products"
  ON products FOR ALL
  USING (auth.role() = 'service_role');

-- Policies para inventory (apenas leitura pública via view)
CREATE POLICY "Anyone can view inventory status"
  ON inventory FOR SELECT
  USING (TRUE);

CREATE POLICY "Service role can manage inventory"
  ON inventory FOR ALL
  USING (auth.role() = 'service_role');

-- Policies para reservations (apenas service_role)
CREATE POLICY "Service role can manage reservations"
  ON inventory_reservations FOR ALL
  USING (auth.role() = 'service_role');

-- Policies para movements (apenas service_role e usuários podem ver seus próprios)
CREATE POLICY "Service role can manage movements"
  ON inventory_movements FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their own movements"
  ON inventory_movements FOR SELECT
  USING (created_by = auth.uid()::TEXT);

-- ============================================================================
-- 12. GRANTS (PERMISSÕES)
-- ============================================================================

-- Permitir execução de funções
GRANT EXECUTE ON FUNCTION reserve_inventory TO authenticated, anon;
GRANT EXECUTE ON FUNCTION confirm_reservation TO authenticated, anon;
GRANT EXECUTE ON FUNCTION release_reservation TO authenticated, anon;
GRANT EXECUTE ON FUNCTION cleanup_expired_reservations TO authenticated, anon;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================

-- Verificar criação
SELECT 'Products created: ' || COUNT(*) FROM products;
SELECT 'Inventory records created: ' || COUNT(*) FROM inventory;
SELECT * FROM inventory_status;
