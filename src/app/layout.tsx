import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/auth-context";
import { SyncProvider } from "@/lib/sync/sync-context";
import { AdminAuthProvider } from "@/lib/admin/admin-context";
import { SidebarProvider } from "@/components/navigation/sidebar-context";
import { Sidebar } from "@/components/navigation/sidebar";
import { Navbar } from "@/components/navigation/navbar";
import { PWARegister } from "@/components/pwa/pwa-register";
import { PlanMotivationCapsule } from "@/components/plans/plan-motivation-capsule";
import { PlanPaymentGate } from "@/components/auth/plan-payment-gate";

export const metadata: Metadata = {
  metadataBase: new URL("https://globalpos.app"),
  title: {
    default: "Kuettu Global POS | Logiciel de Caisse & Gestion pour Commerces en Afrique",
    template: "%s | Kuettu Global POS",
  },
  description:
    "Solution de caisse enregistreuse tactile 100% hors-ligne, facturation & additions pour restaurants, bars, magasins et commerces. Carnet de dettes WhatsApp, gestion de stock et encaissement Mobile Money en Afrique.",
  keywords: [
    "caisse enregistreuse afrique",
    "logiciel de caisse kinshasa",
    "point de vente rdc",
    "caisse tactile restaurant bar",
    "gestion de stock commerce",
    "facturation proforma addition bar",
    "carnet de dettes whatsapp",
    "paiement mobile money mpesa airtel orange",
    "logiciel pos afrique offline first",
    "kuettu global pos",
  ],
  authors: [{ name: "Kuettu Tech", url: "https://globalpos.app" }],
  creator: "Kuettu Tech",
  publisher: "Kuettu Tech",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "https://globalpos.app",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kuettu Global POS",
  },
  openGraph: {
    title: "Kuettu Global POS | Logiciel de Caisse & Facturation pour Commerces en Afrique",
    description:
      "Caisse tactile 100% hors-ligne, facturation, additions pour bars & restaurants, suivi de stock et relances de dettes WhatsApp.",
    url: "https://globalpos.app",
    siteName: "Kuettu Global POS",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Commerçante africaine utilisant le logiciel de caisse Kuettu Global POS avec son client",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kuettu Global POS | Logiciel de Caisse & Gestion pour Commerces en Afrique",
    description:
      "Caisse tactile 100% hors-ligne, facturation, additions pour bars & restaurants, suivi de stock et relances de dettes WhatsApp.",
    images: ["/images/og-image.jpg"],
    creator: "@KuettuPOS",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a4fb4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Kuettu Global POS",
    operatingSystem: "Web, Android, iOS, Windows",
    applicationCategory: "BusinessApplication",
    url: "https://globalpos.app",
    image: "https://globalpos.app/images/og-image.jpg",
    logo: "https://globalpos.app/images/logo.png",
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "CDF",
      lowPrice: "0",
      highPrice: "75000",
      offerCount: "4",
    },
    description:
      "Logiciel de caisse enregistreuse tactile, facturation pour restaurants, bars et commerces en Afrique. Fonctionne 100% hors-ligne avec synchronisation Cloud et relances de dettes WhatsApp.",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "840",
    },
  };

  return (
    <html lang="fr" className="h-full">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Kuettu Global POS" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="h-full bg-slate-50 text-slate-900 antialiased">
        <AdminAuthProvider>
          <AuthProvider>
            <SyncProvider>
              <SidebarProvider>
                <div className="flex min-h-screen bg-slate-50">
                  {/* Left Retractable Dashboard Sidebar */}
                  <Sidebar />

                  {/* Main Content Area */}
                  <div className="flex-1 flex flex-col min-w-0">
                    <Navbar />
                    <main className="flex-1 flex flex-col">
                      <PlanPaymentGate>{children}</PlanPaymentGate>
                    </main>
                  </div>
                </div>

                {/* Plan Motivation Floating Capsule */}
                <PlanMotivationCapsule />

                {/* PWA Service Worker & Install Manager */}
                <PWARegister />
              </SidebarProvider>
            </SyncProvider>
          </AuthProvider>
        </AdminAuthProvider>
      </body>
    </html>
  );
}
