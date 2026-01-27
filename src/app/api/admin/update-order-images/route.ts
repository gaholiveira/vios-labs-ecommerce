import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PRODUCTS } from '@/constants/products';

/**
 * API Route para atualizar imagens de produtos em pedidos antigos
 * 
 * Esta rota atualiza order_items que não têm product_image,
 * buscando a imagem do produto na constante PRODUCTS.
 * 
 * IMPORTANTE: Esta rota deve ser protegida em produção!
 * Adicione autenticação ou use apenas em desenvolvimento.
 */

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Criar mapa de product_id -> image para busca rápida
const productImageMap = new Map(
  PRODUCTS.map(product => [product.id, product.image])
);

export async function POST(req: NextRequest) {
  try {
    // ⚠️ SEGURANÇA: Verificar token de admin em produção
    // Em produção, descomente e configure:
    // const adminToken = req.headers.get('x-admin-token');
    // if (adminToken !== process.env.ADMIN_SECRET_TOKEN) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    const supabaseAdmin = getSupabaseAdmin();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                    process.env.NEXT_PUBLIC_BASE_URL || 
                    'https://vioslabs.com.br';

    // 1. Buscar todos os order_items sem product_image
    const { data: itemsWithoutImage, error: fetchError } = await supabaseAdmin
      .from('order_items')
      .select('id, product_id, product_image')
      .is('product_image', null);

    if (fetchError) {
      console.error('Error fetching items without image:', fetchError);
      return NextResponse.json(
        { error: `Failed to fetch items: ${fetchError.message}` },
        { status: 500 }
      );
    }

    if (!itemsWithoutImage || itemsWithoutImage.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum item sem imagem encontrado.',
        updated: 0,
      });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`📦 Encontrados ${itemsWithoutImage.length} itens sem imagem`);
    }

    // 2. Atualizar cada item com a imagem do produto
    let updated = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const item of itemsWithoutImage) {
      // Buscar imagem do produto
      const productImage = productImageMap.get(item.product_id);
      
      if (!productImage) {
        console.warn(`⚠️ Imagem não encontrada para produto: ${item.product_id}`);
        failed++;
        errors.push(`Produto ${item.product_id} não encontrado`);
        continue;
      }

      // Normalizar URL da imagem (converter relativa para absoluta)
      let imageUrl = productImage;
      if (imageUrl.startsWith('/')) {
        imageUrl = `${baseUrl}${imageUrl}`;
      }

      // Atualizar o item
      const { error: updateError } = await supabaseAdmin
        .from('order_items')
        .update({ product_image: imageUrl })
        .eq('id', item.id);

      if (updateError) {
        console.error(`❌ Erro ao atualizar item ${item.id}:`, updateError);
        failed++;
        errors.push(`Erro ao atualizar item ${item.id}: ${updateError.message}`);
      } else {
        updated++;
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Imagem atualizada para item ${item.id} (produto: ${item.product_id})`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Atualização concluída. ${updated} itens atualizados, ${failed} falharam.`,
      updated,
      failed,
      total: itemsWithoutImage.length,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    console.error('❌ Error updating order images:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET para verificar quantos itens precisam ser atualizados
export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin
      .from('order_items')
      .select('id, product_id, product_name, product_image')
      .is('product_image', null);

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch items: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      count: data?.length || 0,
      items: data || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
