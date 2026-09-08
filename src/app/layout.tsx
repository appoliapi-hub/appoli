import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PwaRegister from "./pwa-register";
import InstallPrompt from "./install-prompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Appoli",
  description: "Dashboard dan formulir Appoli",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/images/logo-appoli.png",
    shortcut: "/images/logo-appoli.png",
    apple: "/images/logo-appoli.png",
  },
  appleWebApp: {
    capable: true,
    title: "Appoli",
    statusBarStyle: "default",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PwaRegister />
        <InstallPrompt />
        {children}
      </body>
    </html>
  );
}
