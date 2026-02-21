-- ============================================
-- TABELA REVIEWS - Avaliações de produtos
-- ============================================
-- Execute no SQL Editor do Supabase
-- Reviews entram como 'pending' e só aparecem após aprovação
-- ============================================

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode ler reviews aprovadas (para exibir no site)
CREATE POLICY "Anyone can read approved reviews"
  ON public.reviews FOR SELECT
  USING (status = 'approved');

-- Inserção via Server Action com service role (bypassa RLS)
-- UPDATE/DELETE: apenas service role (moderação no dashboard Supabase)

-- Comentário para documentação
COMMENT ON TABLE public.reviews IS 'Avaliações de produtos. status=pending aguarda moderação, approved exibido no site.';
