import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/auth-context";
import { SyncProvider } from "@/lib/sync/sync-context";
import { AdminAuthProvider } from "@/lib/admin/admin-context";
import { SidebarProvider } from "@/components/navigation/sidebar-context";
import { Sidebar } from "@/components/navigation/sidebar";
import { Navbar } from "@/components/navigation/navbar";
import { SimulationBanner } from "@/components/navigation/simulation-banner";
import { PWARegister } from "@/components/pwa/pwa-register";
import { PlanMotivationCapsule } from "@/components/plans/plan-motivation-capsule";
import { PlanPaymentGate } from "@/components/auth/plan-payment-gate";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://globalpos.app"),
  title: {
    default: "Kuettu Global POS | Logiciel de Caisse Tactile & Micro-ERP 100% Hors-Ligne en Afrique",
    template: "%s | Kuettu Global POS",
  },
  description:
    "Solution de caisse enregistreuse tactile 0ms 100% hors-ligne, carnet de dettes avec relance WhatsApp en 1 clic, facturation, suivi des stocks et encaissement Mobile Money (M-Pesa, Airtel, Orange, Afrimoney) en RDC et Afrique.",
  applicationName: "Kuettu Global POS",
  category: "Business & Finance Application",
  keywords: [
    "caisse enregistreuse afrique",
    "logiciel de caisse kinshasa",
    "point de vente rdc",
    "caisse tactile restaurant bar",
    "gestion de stock commerce",
    "facturation proforma addition bar",
    "carnet de dettes whatsapp",
    "paiement mobile money mpesa airtel orange afrimoney",
    "logiciel pos afrique offline first",
    "micro erp afrique",
    "logiciel caisse quincaillerie superette",
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
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-192.svg", sizes: "any", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kuettu Global POS",
  },
  openGraph: {
    title: "Kuettu Global POS | Caisse Tactile & Gestion sans Internet",
    description:
      "Pilotez votre Caisse, vos Stocks et vos Dettes. Même sans Internet. 100% Hors-Ligne, relances WhatsApp en 1 clic et encaissement Mobile Money.",
    url: "https://globalpos.app",
    siteName: "Kuettu Global POS",
    images: [
      {
        url: "https://globalpos.app/images/og-image.png",
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "Kuettu Global POS - Caisse Tactile 100% Hors-Ligne & Relance Dettes WhatsApp en Afrique",
      },
      {
        url: "https://globalpos.app/images/og-image.jpg",
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "Kuettu Global POS - Caisse Tactile 100% Hors-Ligne",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kuettu Global POS | Caisse Tactile 0ms & Carnet WhatsApp",
    description:
      "Pilotez votre Caisse, vos Stocks et vos Dettes. Même sans Internet. Compatible M-Pesa, Orange, Airtel Money.",
    images: ["https://globalpos.app/images/og-image.png"],
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
  // Comprehensive Rich JSON-LD Structured Data (Organization + SoftwareApplication + WebSite)
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://globalpos.app/#organization",
        name: "Kuettu Global POS",
        url: "https://globalpos.app",
        logo: {
          "@type": "ImageObject",
          url: "https://globalpos.app/images/logo.png",
          width: 512,
          height: 512,
          caption: "Kuettu Global POS Logo",
        },
        image: "https://globalpos.app/images/og-image.png",
        description:
          "Éditeur du logiciel Micro-ERP et Point de Vente (POS) tactile 100% hors-ligne pour les commerces en Afrique.",
        sameAs: ["https://facebook.com/KuettuPOS", "https://wa.me/243810000000"],
      },
      {
        "@type": "WebSite",
        "@id": "https://globalpos.app/#website",
        url: "https://globalpos.app",
        name: "Kuettu Global POS",
        publisher: {
          "@id": "https://globalpos.app/#organization",
        },
        inLanguage: "fr",
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://globalpos.app/#software",
        name: "Kuettu Global POS",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web, Android APK, iOS Safari PWA, Windows, macOS, Linux",
        url: "https://globalpos.app",
        image: "https://globalpos.app/images/og-image.png",
        logo: "https://globalpos.app/images/logo.png",
        description:
          "Logiciel de caisse enregistreuse tactile 0ms 100% hors-ligne, facturation pour restaurants, bars, quincailleries et commerces. Carnet de dettes WhatsApp, gestion de stock multi-boutiques et encaissement Mobile Money (M-Pesa, Orange, Airtel, Afrimoney).",
        featureList: [
          "Caisse tactile 100% Hors-Ligne 0ms (Dexie DB embarquée)",
          "Carnet de Dettes avec Relances WhatsApp en 1 Clic",
          "Encaissement Mobile Money & Cash bi-devises CDF / USD",
          "Supervision Multi-Magasins & Dépôts avec marges masquées aux caissiers",
          "Compatible Imprimantes thermiques 58mm/80mm et Scanners code-barres",
        ],
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "CDF",
          lowPrice: "0",
          highPrice: "100000",
          offerCount: "4",
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.9",
          reviewCount: "940",
          bestRating: "5",
          worstRating: "1",
        },
      },
    ],
  };

  return (
    <html lang="fr" className={`h-full ${plusJakartaSans.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.png" type="image/png" sizes="512x512" />
        <link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192" />
        <link rel="icon" href="/icon-192.svg" type="image/svg+xml" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Kuettu Global POS" />
        <meta property="og:image" content="https://globalpos.app/images/og-image.png" />
        <meta property="og:image:secure_url" content="https://globalpos.app/images/og-image.png" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Kuettu Global POS Logo & Aperçu" />
        <meta name="twitter:image" content="https://globalpos.app/images/og-image.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="h-full bg-[#f6f8fc] text-slate-900 font-sans antialiased">
        <AdminAuthProvider>
          <AuthProvider>
            <SyncProvider>
              <SidebarProvider>
                <div className="flex min-h-screen bg-[#f6f8fc]">
                  {/* Left Retractable Dashboard Sidebar */}
                  <Sidebar />

                  {/* Main Content Area */}
                  <div className="flex-1 flex flex-col min-w-0">
                    <Navbar />
                    <SimulationBanner />
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
