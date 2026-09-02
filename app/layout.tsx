import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Tipografía única para todo el sistema (panel de cliente, panel interno,
// login) — Inter vía next/font, sin coste de red adicional en producción
// (se descarga y se sirve como asset propio, no tira de fonts.google.com
// en el navegador del usuario).
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Agente SEO · Panel",
  description: "Panel del sistema de posicionamiento SEO autónomo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-screen bg-paper font-sans antialiased">{children}</body>
    </html>
  );
}
