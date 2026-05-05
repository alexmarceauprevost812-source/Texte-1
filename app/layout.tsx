import type { Metadata, Viewport } from "next";
import { Caveat, Permanent_Marker } from "next/font/google";

import { ConversationsProvider } from "@/components/conversations-provider";
import { SidebarProvider } from "@/components/sidebar-provider";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeScript } from "@/components/theme-script";

import "./globals.css";

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

const permanentMarker = Permanent_Marker({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-marker",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Codex",
  description: "Assistant de programmation IA propulsé par Claude.",
  applicationName: "Codex",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Codex",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      data-bg-mode="black"
      className={`${caveat.variable} ${permanentMarker.variable}`}
    >
      <head>
        <ThemeScript />
      </head>
      <body>
        <ThemeProvider>
          <SidebarProvider>
            <ConversationsProvider>{children}</ConversationsProvider>
          </SidebarProvider>
        </ThemeProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
