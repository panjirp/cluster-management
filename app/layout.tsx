import type { Metadata, Viewport } from "next";
import { Karla, Geist_Mono } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";
import { SessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import { Toaster } from "@/components/ui/sonner";

const karla = Karla({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Barcelona Cove Portal", template: "%s — Barcelona Cove Portal" },
  description: "Portal warga cluster Barcelona Cove",
  manifest: "/manifest.json",
  appleWebApp: {
    title: "Barcelona Cove Portal",
    capable: true,
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icons/icon-72.png", sizes: "72x72", type: "image/png" },
      { url: "/icons/icon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/icon-128.png", sizes: "128x128", type: "image/png" },
      { url: "/icons/icon-144.png", sizes: "144x144", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-256.png", sizes: "256x256", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-apple-touch-icon-180.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${karla.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <NextTopLoader color="var(--primary)" showSpinner={false} height={2.5} />
          <SessionProvider>{children}</SessionProvider>
          <Toaster />
          <RegisterServiceWorker />
        </ThemeProvider>
      </body>
    </html>
  );
}
