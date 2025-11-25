import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";
import { StatusBar } from "@/components/StatusBar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "CreditPulse | Enterprise Credit Privacy Rating",
  description: "FHE-powered on-chain credit profiling system",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans min-h-screen flex flex-col`}>
        {/* Impressionist background layer */}
        <div className="impressionist-bg" />
        
        <Providers>
          <Header />
          <main className="flex-grow flex flex-col relative z-10">
        {children}
          </main>
          <StatusBar />
        </Providers>
      </body>
    </html>
  );
}
