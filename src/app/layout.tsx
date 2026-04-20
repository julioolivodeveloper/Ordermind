import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Acá Las Tortas El Paso | Auténtica Comida Mexicana",
  description:
    "Las mejores tortas, tacos, hamburguesas y burritos en El Paso, TX. Ordena en línea ahora.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#fafaf8]">
        <Navbar />
        <main className="flex-1">{children}</main>
        <CartDrawer />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#1a1a1a",
              color: "#fff",
              borderRadius: "12px",
            },
            success: { iconTheme: { primary: "#22c55e", secondary: "#fff" } },
          }}
        />
      </body>
    </html>
  );
}
