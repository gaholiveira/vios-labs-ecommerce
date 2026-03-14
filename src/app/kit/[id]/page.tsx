import { Metadata } from "next";
import { KITS } from "@/constants/kits";
import KitPageContent from "@/components/KitPageContent";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://vioslabs.com.br";

export function generateStaticParams() {
  return KITS.map((k) => ({ id: k.id }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const kit = KITS.find((k) => k.id === id);

  if (!kit) {
    return {
      title: "Kit não encontrado | VIOS",
      description: "Kit não encontrado",
    };
  }

  const kitImageUrl = kit.image
    ? `${BASE_URL}${kit.image}`
    : `${BASE_URL}/images/kits/default.png`;

  const title = `VIOS | ${kit.name}`;
  const description =
    kit.longDescription ||
    kit.description ||
    `Compre ${kit.name}. ${kit.description}`;

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
          url: kitImageUrl,
          width: 1200,
          height: 630,
          alt: kit.name,
          type: "image/png",
        },
      ],
      url: `${BASE_URL}/kit/${id}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: kitImageUrl, alt: kit.name }],
    },
    alternates: {
      canonical: `${BASE_URL}/kit/${id}`,
    },
  };
}

export default async function KitPage({ params }: PageProps) {
  const { id } = await params;
  const kit = KITS.find((k) => k.id === id);

  if (!kit) notFound();

  const kitUrl = `${BASE_URL}/kit/${kit.id}`;
  const kitImageUrl = kit.image
    ? `${BASE_URL}${kit.image}`
    : `${BASE_URL}/images/kits/default.png`;

  const description =
    kit.longDescription || kit.description || `Kit ${kit.name} — VIOS Labs`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${kitUrl}#product`,
        name: kit.name,
        description,
        image: kitImageUrl,
        sku: kit.id,
        brand: {
          "@type": "Brand",
          name: "VIOS Labs",
        },
        offers: {
          "@type": "Offer",
          url: kitUrl,
          priceCurrency: "BRL",
          price: kit.price.toFixed(2),
          availability: "https://schema.org/InStock",
          itemCondition: "https://schema.org/NewCondition",
          seller: {
            "@type": "Organization",
            name: "VIOS Labs",
            url: BASE_URL,
          },
          ...(kit.oldPrice && {
            priceValidUntil: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000,
            )
              .toISOString()
              .split("T")[0],
          }),
        },
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
            name: "Kits",
            item: `${BASE_URL}/kits`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: kit.name,
            item: kitUrl,
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
      <KitPageContent kit={kit} />
    </>
  );
}
