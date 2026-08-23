/**
 * Minimal Konnect Network API client.
 * Docs: https://docs.konnect.network/docs/en/api-integration/intro
 *
 * Required env vars:
 *   KONNECT_API_KEY     - your organization's API key (Dashboard > Developers)
 *   KONNECT_WALLET_ID   - the receiver wallet ID (Dashboard > Developers)
 *   KONNECT_BASE_URL    - https://api.sandbox.konnect.network/api/v2 (sandbox)
 *                          https://api.konnect.network/api/v2       (production)
 *   APP_URL             - e.g. http://localhost:3000 or https://yourapp.com
 *                          (used to build the webhook/return URL)
 */

const KONNECT_BASE_URL =
  process.env.KONNECT_BASE_URL || "https://api.sandbox.konnect.network/api/v2";
const KONNECT_API_KEY = process.env.KONNECT_API_KEY || "";
const KONNECT_WALLET_ID = process.env.KONNECT_WALLET_ID || "";

if (!KONNECT_API_KEY || !KONNECT_WALLET_ID) {
  // Don't throw at import time (breaks build), just warn loudly at runtime use.
  console.warn(
    "[konnect] KONNECT_API_KEY / KONNECT_WALLET_ID are not set. Online payments will fail until they are configured in .env"
  );
}

export interface InitPaymentParams {
  /** Amount in TND (e.g. 80.5), NOT millimes — this function converts it. */
  amountTnd: number;
  description: string;
  orderId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  /** Minutes before the payment link expires. Default 30. */
  lifespanMinutes?: number;
}

export interface InitPaymentResult {
  payUrl: string;
  paymentRef: string;
}

export async function initKonnectPayment(
  params: InitPaymentParams
): Promise<InitPaymentResult> {
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  const res = await fetch(`${KONNECT_BASE_URL}/payments/init-payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": KONNECT_API_KEY,
    },
    body: JSON.stringify({
      receiverWalletId: KONNECT_WALLET_ID,
      token: "TND",
      amount: Math.round(params.amountTnd * 1000), // TND -> millimes
      type: "immediate",
      description: params.description,
      acceptedPaymentMethods: ["wallet", "bank_card", "e-DINAR"],
      lifespan: params.lifespanMinutes ?? 30,
      checkoutForm: true,
      addPaymentFeesToAmount: false,
      firstName: params.firstName,
      lastName: params.lastName,
      email: params.email,
      phoneNumber: params.phoneNumber,
      orderId: params.orderId,
      // Konnect calls this URL (GET) once the payer finishes on the gateway,
      // with ?payment_ref=... in the query string. We verify the actual
      // status server-side rather than trusting the redirect itself.
      webhook: `${appUrl}/api/payments/konnect/webhook`,
      theme: "light",
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Konnect init-payment failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return { payUrl: data.payUrl, paymentRef: data.paymentRef };
}

export type KonnectPaymentStatus = "pending" | "completed" | "failed";

export interface KonnectPaymentDetails {
  id: string;
  status: KonnectPaymentStatus;
  amount: number;
  reachedAmount: number;
  orderId?: string;
}

export async function getKonnectPaymentDetails(
  paymentRef: string
): Promise<KonnectPaymentDetails> {
  const res = await fetch(`${KONNECT_BASE_URL}/payments/${paymentRef}`, {
    headers: { "x-api-key": KONNECT_API_KEY },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Konnect get-payment-details failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.payment;
}
