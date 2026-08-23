// src/lib/sms.ts
//
// Minimal SMS sender via Twilio's REST API (plain fetch, no SDK dependency
// needed). Mirrors lib/email.ts: if Twilio isn't configured (e.g. local
// dev), it logs the message to the server console instead of throwing, so
// nothing that calls this breaks when SMS isn't set up yet.
//
// Required env vars (Twilio Console → Account):
//   TWILIO_ACCOUNT_SID
//   TWILIO_AUTH_TOKEN
//   TWILIO_FROM_NUMBER   — an SMS-capable Twilio number, E.164 format (+216...)
//
// Swap the provider by rewriting the body of sendSms() — the call sites
// (sendSms({ to, body })) won't need to change.

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER || "";

export const isSmsConfigured = Boolean(
  TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM_NUMBER
);

interface SendSmsInput {
  to: string; // E.164 format, e.g. "+21612345678"
  body: string;
}

export async function sendSms({ to, body }: SendSmsInput): Promise<void> {
  if (!isSmsConfigured) {
    console.log(`[sms:dev] to=${to}\n${body}`);
    return;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: TWILIO_FROM_NUMBER, Body: body }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Twilio SMS send failed (${res.status}): ${text}`);
  }
}

export function verificationCodeSms(code: string): string {
  return `Le Club de Gammarth : votre code de vérification est ${code}. Il expire dans 15 minutes.`;
}

export function sessionReminderSms(activity: string, startTime: string): string {
  return `Le Club de Gammarth : rappel — votre séance de ${activity} commence aujourd'hui à ${startTime}.`;
}
