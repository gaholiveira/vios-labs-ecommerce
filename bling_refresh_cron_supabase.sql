-- ============================================
-- CRON SUPABASE: Renovar token Bling a cada 4 horas
-- ============================================
-- Chama GET /api/bling/refresh no seu site para renovar o token.
-- Requer extensões pg_cron e pg_net no Supabase (habilitar em Database → Extensions).
--
-- ANTES DE EXECUTAR:
-- 1. Habilite "pg_cron" e "pg_net" em Database → Extensions.
-- 2. Substitua SEU_DOMINIO pelo domínio de produção (ex: www.vioslabs.com.br).
-- 3. Se usar CRON_SECRET na Vercel, descomente a variável e o header no net.http_get.
-- ============================================

-- Remover job antigo se existir (para atualizar a URL)
SELECT cron.unschedule('bling-refresh-token')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'bling-refresh-token');

-- Agendar: a cada 4 horas (0h, 4h, 8h, 12h, 16h, 20h)
SELECT cron.schedule(
  'bling-refresh-token',
  '0 */4 * * *',
  $$
  SELECT net.http_get(
    url := 'https://vioslabs.com.br/api/bling/refresh',
    headers := '{}'::jsonb
    -- Se usar CRON_SECRET, use algo como (e defina a variável no Supabase):
    -- headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.cron_secret', true))
  ) AS request_id;
  $$
);

-- Para listar jobs: SELECT * FROM cron.job;
-- Para remover: SELECT cron.unschedule('bling-refresh-token');
