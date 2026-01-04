import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: "MedRent - Medical Equipment Rental Marketplace",
  description: "Connect with hospitals nationwide. Rent premium medical equipment on-demand or monetize your idle assets.",
  keywords: ["medical equipment", "hospital", "rental", "healthcare", "equipment sharing"],
  authors: [{ name: "MedRent" }],
  openGraph: {
    title: "MedRent - Medical Equipment Rental Marketplace",
    description: "Connect with hospitals nationwide. Rent premium medical equipment on-demand.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-[#0a0a0a] text-white`}>
        {children}
      </body>
    </html>
  );
}
