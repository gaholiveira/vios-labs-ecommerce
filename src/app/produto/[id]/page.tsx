import { Metadata } from "next";
import { PRODUCTS } from "@/constants/products";
import ProductPageContent from "@/components/ProductPageContent";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = PRODUCTS.find((p) => p.id === id);

  if (!product) {
    return {
      title: "Produto não encontrado | VIOS",
      description: "Produto não encontrado",
    };
  }

  // Construir URL absoluta da imagem do produto
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vioslabs.com.br";
  const productImageUrl = `${baseUrl}${product.image}`;

  const title = `VIOS | ${product.name}`;
  const description = `Compre ${product.name}. ${product.description}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "pt_BR",
      // IMPORTANTE: Usar a imagem real do produto como primeira opção
      // O Next.js vai usar esta imagem ao invés do opengraph-image.tsx quando especificada explicitamente
      images: [
        {
          url: productImageUrl,
          width: 1200,
          height: 630,
          alt: product.name,
          type: "image/jpeg",
        },
      ],
      // URL absoluta da página
      url: `${baseUrl}/produto/${id}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      // Usar a imagem real do produto
      images: [
        {
          url: productImageUrl,
          alt: product.name,
        },
      ],
    },
    // Adicionar metadata alternativo para garantir que a imagem seja encontrada
    alternates: {
      canonical: `${baseUrl}/produto/${id}`,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = PRODUCTS.find((p) => p.id === id);

  if (!product) {
    return <div className="p-20 text-center">Produto não encontrado.</div>;
  }

  return <ProductPageContent product={product} />;
}
