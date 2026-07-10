import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const wiseDisplay = Inter({
  variable: "--font-wise-display",
  subsets: ["latin"],
  weight: "900",
});

export const metadata: Metadata = {
  title: "Sash — Auth as a Service",
  description: "Plug-in authentication platform for developers. Sessions, users, and webhooks — handled.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${wiseDisplay.variable} h-full antialiased`}
    >
      <body className="wise-theme min-h-full flex flex-col">{children}</body>
    </html>
  );
}
