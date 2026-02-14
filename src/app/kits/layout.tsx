import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Protocolos & Kits",
  description:
    "Combinações científicas desenvolvidas para sinergia máxima. Kits e protocolos VIOS Labs.",
};

export default function KitsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
