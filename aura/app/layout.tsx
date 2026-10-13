import type { Metadata } from "next";
import { Playfair_Display, Poppins } from "next/font/google";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { CartProvider } from "@/context/CartContext";
import { ImageOverridesProvider } from "@/context/ImageOverridesContext";
import { fetchImageOverrides } from "@/lib/supabase/public";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Aura",
  description: "AI-assisted jewellery recommendations",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const imageOverrides = await fetchImageOverrides();

  return (
    <html
      lang="en"
      className={`${playfairDisplay.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink font-sans">
        <ImageOverridesProvider overrides={imageOverrides}>
          <CartProvider>
            <AuthHeader />
            {children}
          </CartProvider>
        </ImageOverridesProvider>
      </body>
    </html>
  );
}
