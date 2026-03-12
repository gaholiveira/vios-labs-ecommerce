-- Adiciona suporte a foto opcional nos reviews
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Índice parcial para queries de reviews com imagem (analytics futuro)
CREATE INDEX IF NOT EXISTS idx_reviews_has_image
  ON public.reviews (product_id)
  WHERE image_url IS NOT NULL;

-- NOTA: Criar bucket "review-images" no Supabase Dashboard:
--   Storage > New bucket > Name: "review-images" > Public: true
--   Policy de insert: service_role apenas (API usa supabaseAdmin)
--   Policy de select: anon (imagens são públicas para leitura)
