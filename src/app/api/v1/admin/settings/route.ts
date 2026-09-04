import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySuperAdmin, unauthorizedAdminResponse } from "@/lib/admin/admin-guard";
import {
  getSystemVerificationConfig,
  saveSystemVerificationConfig,
  type VerificationMethod,
} from "@/lib/services/system-settings";
import { sendVerificationSms } from "@/lib/services/sms-service";
import { sendVerificationEmail } from "@/lib/services/email-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET: Server health, table counts & System verification settings
export async function GET(req: NextRequest) {
  try {
    const auth = verifySuperAdmin(req);
    if (!auth.authenticated) {
      return unauthorizedAdminResponse(auth.error);
    }

    const startTime = Date.now();

    // Query counts directly from PostgreSQL tables
    const [
      tenantsCount,
      storesCount,
      usersCount,
      subscriptionsCount,
      productsCount,
      customersCount,
      salesCount,
      saleItemsCount,
      debtPaymentsCount,
      syncLogsCount,
      otpCount,
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.store.count(),
      prisma.user.count(),
      prisma.subscription.count(),
      prisma.product.count(),
      prisma.customer.count(),
      prisma.sale.count(),
      prisma.saleItem.count(),
      prisma.debtPayment.count(),
      prisma.syncLog.count(),
      prisma.otpVerification.count(),
    ]);

    const pingMs = Date.now() - startTime;
    const verificationConfig = await getSystemVerificationConfig();

    return NextResponse.json({
      success: true,
      data: {
        database: {
          connected: true,
          provider: "Supabase PostgreSQL",
          latencyMs: pingMs,
          urlHost: "aws-1-eu-west-1.pooler.supabase.com",
        },
        tableCounts: {
          tenants: tenantsCount,
          stores: storesCount,
          users: usersCount,
          subscriptions: subscriptionsCount,
          products: productsCount,
          customers: customersCount,
          sales: salesCount,
          saleItems: saleItemsCount,
          debtPayments: debtPaymentsCount,
          syncLogs: syncLogsCount,
          otpVerifications: otpCount,
        },
        verificationConfig,
        environment: process.env.NODE_ENV || "development",
        serverTimestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[Admin Settings GET Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erreur de connexion à la base de données Supabase",
        data: {
          database: { connected: false, error: error.message },
        },
      },
      { status: 500 }
    );
  }
}

// PUT: Update Verification Settings or trigger Test SMS / Email
export async function PUT(req: NextRequest) {
  try {
    const auth = verifySuperAdmin(req);
    if (!auth.authenticated) {
      return unauthorizedAdminResponse(auth.error);
    }

    const body = await req.json();
    const { action, verificationMethod, isSimulationMode, twilio, email, testPhone, testEmail } = body;

    // Action 1: Test SMS or Email Dispatch
    if (action === "TEST_DISPATCH") {
      const testCode = "789123";

      if (verificationMethod === "EMAIL" && testEmail) {
        const res = await sendVerificationEmail(testEmail, testCode, "Boutique Test Admin", "Super Administrateur");
        return NextResponse.json({
          success: res.success,
          isSimulated: res.isSimulated,
          simulatedCode: res.simulatedCode,
          message: res.isSimulated
            ? `[Simulation] E-mail de test déclenché vers ${testEmail} avec le code ${testCode}`
            : `E-mail de test envoyé avec succès vers ${testEmail}`,
          error: res.error,
        });
      } else if (testPhone) {
        const res = await sendVerificationSms(testPhone, testCode, "Boutique Test Admin");
        return NextResponse.json({
          success: res.success,
          isSimulated: res.isSimulated,
          simulatedCode: res.simulatedCode,
          message: res.isSimulated
            ? `[Simulation] SMS Twilio de test simulé pour ${testPhone} avec le code ${testCode}`
            : `SMS Twilio de test envoyé avec succès vers ${testPhone}`,
          error: res.error,
        });
      }

      return NextResponse.json(
        { success: false, error: "Numéro de téléphone ou email de test manquant" },
        { status: 400 }
      );
    }

    // Action 2: Save Verification Config
    const updated = await saveSystemVerificationConfig({
      verificationMethod: verificationMethod as VerificationMethod,
      isSimulationMode: isSimulationMode !== undefined ? Boolean(isSimulationMode) : undefined,
      twilio: twilio || {},
      email: email || {},
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Configuration de validation mise à jour : Méthode active = ${updated.verificationMethod} (${updated.isSimulationMode ? "Mode Simulation" : "Mode Production API"})`,
    });
  } catch (error: any) {
    console.error("[Admin Settings PUT Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la mise à jour de la configuration" },
      { status: 500 }
    );
  }
}

// POST: Full Supabase Database Backup Export (JSON)
export async function POST(req: NextRequest) {
  try {
    const auth = verifySuperAdmin(req);
    if (!auth.authenticated) {
      return unauthorizedAdminResponse(auth.error);
    }

    const [
      tenants,
      stores,
      users,
      subscriptions,
      products,
      customers,
      sales,
      saleItems,
      debtPayments,
      syncLogs,
      otpVerifications,
    ] = await Promise.all([
      prisma.tenant.findMany(),
      prisma.store.findMany(),
      prisma.user.findMany(),
      prisma.subscription.findMany(),
      prisma.product.findMany(),
      prisma.customer.findMany(),
      prisma.sale.findMany(),
      prisma.saleItem.findMany(),
      prisma.debtPayment.findMany(),
      prisma.syncLog.findMany(),
      prisma.otpVerification.findMany(),
    ]);

    const backupData = {
      meta: {
        exportDate: new Date().toISOString(),
        version: "3.0",
        source: "Supabase PostgreSQL Database",
        platform: "Global POS SuperAdmin",
      },
      counts: {
        tenants: tenants.length,
        stores: stores.length,
        users: users.length,
        subscriptions: subscriptions.length,
        products: products.length,
        customers: customers.length,
        sales: sales.length,
        saleItems: saleItems.length,
        debtPayments: debtPayments.length,
        syncLogs: syncLogs.length,
        otpVerifications: otpVerifications.length,
      },
      data: {
        tenants,
        stores,
        users,
        subscriptions,
        products,
        customers,
        sales,
        saleItems,
        debtPayments,
        syncLogs,
        otpVerifications,
      },
    };

    return NextResponse.json({
      success: true,
      data: backupData,
      message: "Sauvegarde intégrale Supabase générée avec succès",
    });
  } catch (error: any) {
    console.error("[Admin Settings Backup POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de l'export de la base" },
      { status: 500 }
    );
  }
}
