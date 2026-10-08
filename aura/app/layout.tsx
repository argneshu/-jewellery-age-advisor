import type { Metadata } from "next";
import { Playfair_Display, Poppins } from "next/font/google";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { CartProvider } from "@/context/CartContext";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${playfairDisplay.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink font-sans">
        <CartProvider>
          <AuthHeader />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
