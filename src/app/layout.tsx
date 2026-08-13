import type { Metadata, Viewport } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { FluidCursor } from "@/components/ui/FluidCursor";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Açaí do PH | Cardápio Digital",
    template: "%s | Açaí do PH",
  },
  description:
    "Peça já o seu açaí! Monte do seu jeito, escolha o tamanho e os complementos e receba fresquinho em casa.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Açaí do PH",
  },
};

export const viewport: Viewport = {
  themeColor: "#521a88",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${poppins.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="font-body antialiased">
        <Providers>{children}</Providers>
        <FluidCursor />
      </body>
    </html>
  );
}
