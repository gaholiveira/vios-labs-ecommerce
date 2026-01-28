import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// CONFIGURAÇÃO DE RUNTIME PARA API ROUTE
// ============================================================================
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Esta rota usa a service role key para garantir inserção na VIP list
// mesmo para usuários não autenticados, contornando as políticas RLS
//
// NOTA: A coluna 'phone' não está sendo usada aqui porque pode não existir na tabela.
// Para adicionar suporte a phone, execute o script vip_list_add_phone.sql no Supabase SQL Editor.
// Após adicionar a coluna, você pode descomentar as linhas que incluem phone nos dados.
export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[VIP LIST API] Erro ao parsear body:', parseError);
      return NextResponse.json(
        { error: 'Formato de dados inválido', success: false },
        { status: 400 }
      );
    }

    const { email, user_id, full_name, phone } = body;

    // Validações básicas
    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email é obrigatório', success: false },
        { status: 400 }
      );
    }

    if (!full_name || !full_name.trim()) {
      return NextResponse.json(
        { error: 'Nome completo é obrigatório', success: false },
        { status: 400 }
      );
    }

    // Criar cliente Supabase com service role (bypass RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[VIP LIST API] Variáveis de ambiente não configuradas', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceKey,
      });
      return NextResponse.json(
        { error: 'Erro de configuração do servidor', success: false },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const emailTrimmed = email.trim().toLowerCase();
    const fullNameTrimmed = full_name.trim();
    const phoneTrimmed = phone?.trim() || null;

    if (process.env.NODE_ENV === 'development') {
      console.log('[VIP LIST API] Processando requisição:', {
        email: emailTrimmed,
        user_id: user_id || 'null',
        full_name: fullNameTrimmed,
        hasPhone: !!phoneTrimmed,
      });
    }

    // Preparar dados para inserção
    // Incluímos phone se fornecido - se a coluna não existir, o erro será tratado
    const vipData: any = {
      email: emailTrimmed,
      full_name: fullNameTrimmed,
    };

    // Adicionar user_id se fornecido
    if (user_id) {
      vipData.user_id = user_id;
    }

    // Adicionar phone se fornecido (a coluna pode não existir ainda)
    // Se a coluna não existir, o erro será capturado e tentaremos novamente sem phone
    if (phoneTrimmed) {
      vipData.phone = phoneTrimmed;
    }

    // Estratégia de upsert:
    // 1. Se user_id existe, usar upsert por user_id
    // 2. Se não, tentar inserir e tratar duplicata por email
    let result;
    
    if (user_id) {
      // Usuário logado: upsert por user_id (único)
      result = await supabase
        .from('vip_list')
        .upsert(vipData, {
          onConflict: 'user_id',
        })
        .select()
        .single();
    } else {
      // Usuário não logado: tentar inserir, se duplicata, atualizar
      // Primeiro verificar se já existe por email
      const { data: existing } = await supabase
        .from('vip_list')
        .select('id, user_id')
        .eq('email', emailTrimmed)
        .maybeSingle();

      if (existing) {
        // Se já existe e não tem user_id, atualizar
        if (!existing.user_id) {
          const updateData: any = {
            full_name: fullNameTrimmed,
          };
          // Incluir phone se fornecido (erro será tratado se coluna não existir)
          if (phoneTrimmed) {
            updateData.phone = phoneTrimmed;
          }
          result = await supabase
            .from('vip_list')
            .update(updateData)
            .eq('id', existing.id)
            .select()
            .single();
        } else {
          // Já existe com user_id diferente, retornar sucesso (já está na lista)
          return NextResponse.json({
            success: true,
            message: 'Você já está na lista VIP!',
            data: existing,
          });
        }
      } else {
        // Inserir novo registro
        result = await supabase
          .from('vip_list')
          .insert(vipData)
          .select()
          .single();
      }
    }

    if (result.error) {
      console.error('[VIP LIST API] Erro ao inserir/atualizar:', {
        error: result.error,
        message: result.error.message,
        code: result.error.code,
        details: result.error.details,
        vipData,
      });
      
      // Se erro for de coluna não existente (phone), tentar novamente sem phone
      const isPhoneError = 
        result.error.message?.includes('column "phone"') || 
        result.error.message?.includes("'phone' column") ||
        result.error.message?.includes("Could not find the 'phone' column") ||
        result.error.message?.includes("schema cache") ||
        result.error.code === '42703';
      
      if (isPhoneError) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[VIP LIST API] Erro relacionado à coluna phone detectado, tentando novamente sem phone');
        }
        // Garantir que não há phone no vipData
        const { phone: _, ...dataWithoutPhone } = vipData;
        
        if (user_id) {
          result = await supabase
            .from('vip_list')
            .upsert(dataWithoutPhone, {
              onConflict: 'user_id',
            })
            .select()
            .single();
        } else {
          const { data: existing } = await supabase
            .from('vip_list')
            .select('id, user_id')
            .eq('email', emailTrimmed)
            .maybeSingle();

          if (existing && !existing.user_id) {
            const updateData: any = {
              full_name: fullNameTrimmed,
            };
            // Não incluir phone no retry (coluna não existe)
            result = await supabase
              .from('vip_list')
              .update(updateData)
              .eq('id', existing.id)
              .select()
              .single();
          } else {
            result = await supabase
              .from('vip_list')
              .insert(dataWithoutPhone)
              .select()
              .single();
          }
        }
      }

      if (result.error) {
        console.error('[VIP LIST API] Erro após retry:', result.error);
        return NextResponse.json(
          { 
            error: 'Erro ao processar sua inscrição. Tente novamente.',
            success: false,
            details: result.error.message || 'Erro desconhecido',
          },
          { status: 500 }
        );
      }
    }

    // Verificar se result.data existe
    if (!result.data) {
      console.error('[VIP LIST API] Resultado sem data:', result);
      return NextResponse.json(
        { 
          error: 'Dados não foram salvos corretamente. Tente novamente.',
          success: false,
        },
        { status: 500 }
      );
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[VIP LIST API] ✅ Sucesso ao salvar na VIP list:', {
        email: emailTrimmed,
        user_id: user_id || 'null',
        vip_id: result.data.id,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Você foi adicionado à lista VIP com sucesso!',
      data: result.data,
    });
  } catch (error: any) {
    console.error('[VIP LIST API] Exceção não tratada:', error);
    return NextResponse.json(
      { 
        error: 'Erro inesperado. Tente novamente.',
        success: false,
        details: error?.message || 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
