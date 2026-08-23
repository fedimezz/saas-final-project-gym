// src/lib/email.ts
//
// Minimal transactional email sender. If SMTP_URL isn't set (e.g. local
// dev without a mail provider configured), it logs the email to the
// server console instead of throwing, so the verify/reset flows are
// still testable end-to-end without real SMTP credentials.
//
// Wire up any SMTP provider (Resend, Postmark, SES, Mailgun, etc.) by
// setting SMTP_URL to its SMTP connection string.

import nodemailer from "nodemailer";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailInput) {
  const smtpUrl = process.env.SMTP_URL;

  if (!smtpUrl) {
    console.log(`[email:dev] to=${to} subject="${subject}"\n${html}`);
    return;
  }

  const transporter = nodemailer.createTransport(smtpUrl);
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "no-reply@le-club-de-gammarth.com",
    to,
    subject,
    html,
  });
}

export function verificationCodeEmail(code: string) {
  return {
    subject: "Votre code de vérification — Le Club de Gammarth",
    html: `<p>Votre code de vérification est :</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px;">${code}</p><p>Ce code expire dans 15 minutes.</p>`,
  };
}

export function resetPasswordEmail(resetUrl: string) {
  return {
    subject: "Réinitialisation de votre mot de passe — Le Club de Gammarth",
    html: `<p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Ce lien expire dans 30 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`,
  };
}
