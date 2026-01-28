import { Metadata } from "next";
import { KITS } from "@/constants/kits";
import KitPageContent from "@/components/KitPageContent";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
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

  // Construir URL absoluta da imagem do kit
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vioslabs.com.br";
  const kitImageUrl = kit.image
    ? `${baseUrl}${kit.image}`
    : `${baseUrl}/images/kits/default.png`;

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
      url: `${baseUrl}/kit/${id}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        {
          url: kitImageUrl,
          alt: kit.name,
        },
      ],
    },
    alternates: {
      canonical: `${baseUrl}/kit/${id}`,
    },
  };
}

export default async function KitPage({ params }: PageProps) {
  const { id } = await params;
  const kit = KITS.find((k) => k.id === id);

  if (!kit) {
    notFound();
  }

  return <KitPageContent kit={kit} />;
}
