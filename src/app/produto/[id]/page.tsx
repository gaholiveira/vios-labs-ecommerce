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

  // Construir URL absoluta da imagem
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vioslabs.com.br";
  const imageUrl = `${baseUrl}${product.image}`;

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
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
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
