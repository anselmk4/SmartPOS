import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/auth-context";
import { SyncProvider } from "@/lib/sync/sync-context";
import { AdminAuthProvider } from "@/lib/admin/admin-context";
import { SidebarProvider } from "@/components/navigation/sidebar-context";
import { Sidebar } from "@/components/navigation/sidebar";
import { Navbar } from "@/components/navigation/navbar";
import { PWARegister } from "@/components/pwa/pwa-register";

export const metadata: Metadata = {
  title: "Kuettu SMART POS | Caisse Tactile Offline-First, Dettes WhatsApp & Mobile Money",
  description: "Kuettu SMART POS - Solution SaaS de caisse tactile 100% hors-ligne, carnet de dettes WhatsApp, stocks et encaissement Mobile Money pour le commerce de détail.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SMART POS",
  },
  icons: {
    icon: "/icon-192.svg",
    apple: "/icon-192.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SMART POS" />
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
                    <main className="flex-1 flex flex-col">{children}</main>
                  </div>
                </div>

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
