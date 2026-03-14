import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PRODUCTS } from "@/constants/products";
import ProductPageContent from "@/components/ProductPageContent";

interface PageProps {
  params: Promise<{ id: string }>;
}

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://vioslabs.com.br";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ id: p.id }));
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

  const productImageUrl = `${BASE_URL}${product.image}`;
  const title = product.tagline
    ? `${product.name} | ${product.tagline}`
    : `VIOS | ${product.name}`;
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
          url: productImageUrl,
          width: 1200,
          height: 630,
          alt: product.name,
          type: "image/jpeg",
        },
      ],
      url: `${BASE_URL}/produto/${id}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: productImageUrl, alt: product.name }],
    },
    alternates: {
      canonical: `${BASE_URL}/produto/${id}`,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = PRODUCTS.find((p) => p.id === id);

  if (!product) notFound();

  const productUrl = `${BASE_URL}/produto/${product.id}`;
  const productImageUrl = `${BASE_URL}${product.image}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${productUrl}#product`,
        name: product.name,
        description: product.description,
        image: productImageUrl,
        sku: product.id,
        brand: {
          "@type": "Brand",
          name: "VIOS Labs",
        },
        offers: {
          "@type": "Offer",
          url: productUrl,
          priceCurrency: "BRL",
          price: product.price.toFixed(2),
          availability: "https://schema.org/InStock",
          itemCondition: "https://schema.org/NewCondition",
          seller: {
            "@type": "Organization",
            name: "VIOS Labs",
            url: BASE_URL,
          },
        },
        ...(product.anvisaRecord && {
          additionalProperty: {
            "@type": "PropertyValue",
            name: "Registro ANVISA",
            value: product.anvisaRecord,
          },
        }),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: BASE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Produtos",
            item: `${BASE_URL}/#produtos`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: product.name,
            item: productUrl,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductPageContent product={product} />
    </>
  );
}
