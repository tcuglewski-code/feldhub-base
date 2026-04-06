/**
 * POST /api/payments/mollie/create
 * 
 * Erstellt eine neue Mollie-Zahlung für eine Rechnung
 * 
 * Body:
 * {
 *   invoiceId: string,
 *   amount: number (cents),
 *   currency?: string,
 *   customerName?: string,
 *   customerEmail?: string,
 *   preferredMethods?: MolliePaymentMethod[],
 *   metadata?: Record<string, unknown>,
 *   redirectUrl: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { 
  getMollieClient, 
  isMollieEnabled,
  MollieClient,
  MolliePaymentMethod,
  generatePaymentDescription,
} from '@/lib/mollie';
import { prisma } from '@/lib/prisma';
import { getCurrentTenant } from '@/config/tenant';

interface CreatePaymentBody {
  invoiceId: string;
  amount: number;
  currency?: string;
  customerName?: string;
  customerEmail?: string;
  preferredMethods?: MolliePaymentMethod[];
  metadata?: Record<string, unknown>;
  redirectUrl: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check if Mollie is enabled
    if (!isMollieEnabled()) {
      return NextResponse.json(
        { error: 'Mollie payments are not enabled for this tenant' },
        { status: 400 }
      );
    }

    // Auth check (optional, depends on use case)
    const session = await auth();
    // For customer portal, you might want different auth

    // Parse body
    const body: CreatePaymentBody = await request.json();
    
    // Validate required fields
    if (!body.invoiceId || !body.amount || !body.redirectUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: invoiceId, amount, redirectUrl' },
        { status: 400 }
      );
    }

    if (body.amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Get Mollie client
    const mollie = getMollieClient();
    const tenant = getCurrentTenant();
    
    // Build webhook URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL;
    const webhookUrl = baseUrl ? `${baseUrl}/api/webhooks/mollie` : undefined;

    // Create payment
    const payment = await mollie.createPayment({
      amount: MollieClient.formatAmount(body.amount, body.currency ?? 'EUR'),
      description: generatePaymentDescription(
        body.invoiceId,
        body.customerName
      ),
      redirectUrl: body.redirectUrl,
      webhookUrl,
      method: body.preferredMethods,
      locale: tenant.locale.language === 'de' ? 'de_DE' : 'en_US',
      billingEmail: body.customerEmail,
      metadata: {
        invoiceId: body.invoiceId,
        tenantId: tenant.id,
        ...body.metadata,
      },
    });

    // Save payment reference in database
    // This assumes you have a PaymentTransaction model in Prisma
    try {
      await prisma.paymentTransaction.create({
        data: {
          molliePaymentId: payment.id,
          invoiceId: body.invoiceId,
          amount: body.amount,
          currency: body.currency ?? 'EUR',
          status: payment.status,
          provider: 'mollie',
          metadata: body.metadata ?? {},
        },
      });
    } catch (dbError) {
      // Log but don't fail - payment was already created in Mollie
      console.error('Failed to save payment to database:', dbError);
    }

    // Return checkout URL
    const checkoutUrl = payment._links.checkout?.href;
    if (!checkoutUrl) {
      return NextResponse.json(
        { error: 'Payment created but no checkout URL available' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      paymentId: payment.id,
      checkoutUrl,
      status: payment.status,
    });

  } catch (error) {
    console.error('Mollie payment creation error:', error);
    
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create payment: ${message}` },
      { status: 500 }
    );
  }
}
