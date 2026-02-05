import { NextResponse } from "next/server";
import {
  createProductInBling,
  findProductByCodigo,
  isBlingConfigured,
} from "@/lib/bling";
import { PRODUCTS } from "@/constants/products";
import { KITS } from "@/constants/kits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface SyncItem {
  id: string;
  name: string;
  price: number;
}

async function ensureProductInBling(
  item: SyncItem,
): Promise<{ id: string; blingId: number; created: boolean; error?: string }> {
  const created = await createProductInBling({
    codigo: item.id,
    nome: item.name,
    preco: item.price,
  });

  if (created.success && created.blingId) {
    return { id: item.id, blingId: created.blingId, created: true };
  }

  const existing = await findProductByCodigo(item.id);
  if (existing.success && existing.blingId) {
    return { id: item.id, blingId: existing.blingId, created: false };
  }

  return {
    id: item.id,
    blingId: 0,
    created: false,
    error: created.error ?? existing.error ?? "Erro desconhecido",
  };
}

export async function GET() {
  if (!isBlingConfigured()) {
    return NextResponse.json(
      { error: "BLING_ACCESS_TOKEN não configurado" },
      { status: 503 },
    );
  }

  const items: SyncItem[] = [
    ...PRODUCTS.map((p) => ({ id: p.id, name: p.name, price: p.price })),
    ...KITS.map((k) => ({ id: k.id, name: k.name, price: k.price })),
  ];

  const results: Array<{
    id: string;
    blingId: number;
    created: boolean;
    error?: string;
  }> = [];
  const errors: string[] = [];

  for (const item of items) {
    const result = await ensureProductInBling(item);
    results.push(result);
    if (result.error) {
      errors.push(`${result.id}: ${result.error}`);
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  const map: Record<string, number> = {};
  for (const r of results) {
    if (r.blingId > 0) map[r.id] = r.blingId;
  }

  const mapEnv = Object.entries(map)
    .map(([k, v]) => `BLING_PRODUCT_ID_${k.toUpperCase().replace(/-/g, "_")}=${v}`)
    .join("\n");
  const mapJson = JSON.stringify(map);

  return NextResponse.json({
    success: errors.length === 0,
    synced: results.filter((r) => r.blingId > 0).length,
    total: items.length,
    errors: errors.length > 0 ? errors : undefined,
    mapping: map,
    envSnippet: mapEnv,
    envJsonSnippet: `BLING_PRODUCT_MAP=${mapJson}`,
    message:
      errors.length === 0
        ? "Produtos sincronizados. Adicione as variáveis ao .env:"
        : `${errors.length} produto(s) com erro. Adicione ao .env os que foram sincronizados:`,
  });
}
