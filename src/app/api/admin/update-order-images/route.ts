import { NextRequest, NextResponse } from 'next/server';
import { PRODUCTS } from '@/constants/products';
import { getSupabaseAdmin } from '@/utils/supabase/admin';

/**
 * API Route para atualizar imagens de produtos em pedidos antigos.
 * Atualiza order_items sem product_image buscando na constante PRODUCTS.
 * Protegida por ADMIN_SECRET_TOKEN (header x-admin-token).
 */

// Criar mapa de product_id -> image para busca rápida
const productImageMap = new Map(
  PRODUCTS.map(product => [product.id, product.image])
);

export async function POST(req: NextRequest) {
  try {
    const adminToken = req.headers.get("x-admin-token");
    const expectedToken = process.env.ADMIN_SECRET_TOKEN;

    if (!expectedToken) {
      console.warn("[ADMIN] ADMIN_SECRET_TOKEN não configurado — rota bloqueada");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!adminToken || adminToken !== expectedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
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

  } catch (err: unknown) {
    console.error('❌ Error updating order images:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
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
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
