import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/auth-context";
import { SyncProvider } from "@/lib/sync/sync-context";
import { AdminAuthProvider } from "@/lib/admin/admin-context";
import { Navbar } from "@/components/navigation/navbar";

export const metadata: Metadata = {
  title: "Kuettu SMART POS | Caisse Tactile, Dettes WhatsApp & Mobile Money",
  description: "Kuettu SMART POS - La solution SaaS tout-en-un pour le commerce de détail en Afrique : Caisse Tactile Offline-First, Carnet de dettes WhatsApp, Gestion des stocks et Encaissement Mobile Money.",
  manifest: "/manifest.json",
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
      <body className="h-full bg-slate-50 text-slate-900 antialiased flex flex-col pb-16 md:pb-0">
        <AdminAuthProvider>
          <AuthProvider>
            <SyncProvider>
              <Navbar />
              <main className="flex-1 flex flex-col">{children}</main>
            </SyncProvider>
          </AuthProvider>
        </AdminAuthProvider>
      </body>
    </html>
  );
}
