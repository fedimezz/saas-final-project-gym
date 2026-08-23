// src/lib/validation.ts
//
// Reusable Zod primitives for API route input validation. The project has
// had `zod` installed (used by react-hook-form on the client) but zero API
// routes actually validated with it server-side — routes instead used
// ad-hoc `typeof x !== "string"` checks, which don't catch things like
// missing max-length bounds, and can throw uncaught TypeErrors when a
// client sends the wrong JSON type for an "optional" field (e.g.
// `transactionId?.trim()` on a client-sent number).
//
// This file is a starting set covering the fields that show up across
// several routes (email, phone, password, pagination, ids) — not a
// project-wide validation layer yet. Extend it as more routes are
// migrated; don't duplicate these primitives inline in a route.
import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(254)
  .email("Adresse email invalide");

export const passwordSchema = z
  .string()
  .min(6, "Le mot de passe doit contenir au moins 6 caractères")
  .max(200);

// Tunisian/international-ish phone formats: digits, spaces, +, -, (), 7-20
// chars. Matches the regex already used in dashboard/profile PUT, so both
// paths that accept a phone number are consistent with each other.
export const phoneSchema = z
  .string()
  .trim()
  .min(7)
  .max(20)
  .regex(/^[+]?[\d\s\-().]{7,20}$/, "Format de téléphone invalide");

export const nameSchema = z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères").max(100);

export const cuidSchema = z.string().trim().min(1, "Identifiant requis");

// A safe, bounded free-text field for things like bios/descriptions that
// get rendered back to users — bounds length, doesn't attempt HTML
// sanitization here (that's the CMS content pipeline's job for rich text).
export const shortTextSchema = (max: number) => z.string().trim().max(max);

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// Optional ISO date string -> Date. Used across promotions/schedule/reports
// wherever a client sends a date as JSON (JSON has no Date type).
export const dateStringSchema = z.coerce.date();

// Money/decimal fields (promotion discount values, plan prices, payment
// amounts). Bounded well above any real gym price to catch fat-finger or
// malicious huge values without hardcoding a "real" business ceiling.
export const positiveAmountSchema = z.coerce.number().finite().positive().max(1_000_000);

export const promotionSchema = z
  .object({
    code: z.string().trim().min(2).max(30).regex(/^[A-Za-z0-9_-]+$/, "Le code ne doit contenir que lettres, chiffres, - et _"),
    title: z.string().trim().min(2).max(150),
    description: shortTextSchema(1000).optional().or(z.literal("")),
    discountType: z.enum(["PERCENT", "FIXED"]),
    discountValue: positiveAmountSchema,
    startDate: dateStringSchema.optional(),
    endDate: dateStringSchema.nullable().optional(),
    maxUses: z.coerce.number().int().positive().max(1_000_000).nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => d.discountType !== "PERCENT" || d.discountValue <= 100, {
    message: "Un pourcentage ne peut pas dépasser 100",
    path: ["discountValue"],
  });

// Same shape as promotionSchema but every field optional (PATCH) — no
// .refine() percent<=100 check here since a PATCH might change discountType
// and discountValue in separate requests; that invariant is still enforced
// route-side using the merged existing+incoming values.
export const promotionUpdateSchema = z.object({
  title: z.string().trim().min(2).max(150).optional(),
  description: shortTextSchema(1000).nullable().optional(),
  discountType: z.enum(["PERCENT", "FIXED"]).optional(),
  discountValue: positiveAmountSchema.optional(),
  startDate: dateStringSchema.optional(),
  endDate: dateStringSchema.nullable().optional(),
  maxUses: z.coerce.number().int().positive().max(1_000_000).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const memberReportSchema = z.object({
  subject: z.string().trim().min(1, "Le sujet est requis").max(150),
  message: z.string().trim().min(1, "Le message est requis").max(3000),
});

export const memberReportUpdateSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "RESOLVED"]).optional(),
  adminNote: shortTextSchema(2000).nullable().optional(),
});

export const recordPaymentSchema = z.object({
  subscriptionId: cuidSchema,
  amount: positiveAmountSchema,
  paymentMethod: z.enum(["CASH", "CARD", "TRANSFER"]),
  transactionId: z.string().trim().max(200).optional().or(z.literal("")),
});

export const subscriptionUpdateSchema = z.object({
  status: z.enum(["PENDING", "ACTIVE", "EXPIRED", "CANCELLED", "SUSPENDED"]).optional(),
  endDate: dateStringSchema.optional(),
  autoRenew: z.boolean().optional(),
});

export const subscriptionActionSchema = z.object({
  subscriptionId: cuidSchema,
  action: z.enum(["approve", "cancel", "suspend"]),
});

export const planSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: shortTextSchema(1000).optional().or(z.literal("")).nullable(),
  price: positiveAmountSchema,
  durationDays: z.coerce.number().int().positive().max(3650),
  features: z.array(z.string().trim().max(200)).max(50).optional(),
});

export const planUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: shortTextSchema(1000).nullable().optional(),
  price: positiveAmountSchema.optional(),
  durationDays: z.coerce.number().int().positive().max(3650).optional(),
  features: z.array(z.string().trim().max(200)).max(50).optional(),
  isActive: z.boolean().optional(),
});

export const permissionUpdateSchema = z.object({
  key: z.string().trim().min(1).max(100),
  allowed: z.boolean(),
});

export const weeklyPlanSchema = z
  .object({
    weekStart: dateStringSchema,
    weekEnd: dateStringSchema,
    isActive: z.boolean().optional(),
  })
  .refine((d) => d.weekEnd > d.weekStart, {
    message: "weekEnd doit être après weekStart",
    path: ["weekEnd"],
  });

export const weeklyPlanActionSchema = z.object({
  action: z.enum(["activate", "archive"]),
});

const optionalUrl = () =>
  z.string().trim().url("URL invalide").max(2000).optional().or(z.literal(""));
const optionalHexColor = () =>
  z.string().trim().regex(/^#[0-9a-fA-F]{3,8}$/, "Couleur invalide (format hex attendu)").optional().or(z.literal(""));

export const gymSettingsSchema = z.object({
  name: z.string().trim().min(1, "Le nom du club ne peut pas être vide").max(150).optional(),
  logoUrl: optionalUrl(),
  address: shortTextSchema(300).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.string().trim().email("Email invalide").max(200).optional().or(z.literal("")),
  workingHours: z.record(z.string(), z.unknown()).optional(),
  facebookUrl: optionalUrl(),
  instagramUrl: optionalUrl(),
  tiktokUrl: optionalUrl(),
  primaryColor: optionalHexColor(),
  backgroundColor: optionalHexColor(),
  backgroundColorDark: optionalHexColor(),
  enabledPages: z.record(z.string(), z.unknown()).optional(),
  heroTitle: shortTextSchema(200).optional().or(z.literal("")),
  heroSubtitle: shortTextSchema(300).optional().or(z.literal("")),
  heroImageUrl: optionalUrl(),
});

export const coachUpdateSchema = z.object({
  name: nameSchema.optional(),
  bio: shortTextSchema(2000).nullable().optional(),
  photoUrl: optionalUrl().nullable(),
  specialties: z.array(z.string().trim().max(100)).max(30).optional(),
  phone: phoneSchema.optional().or(z.literal("")),
  isActive: z.boolean().optional(),
  createAccount: z.boolean().optional(),
  email: emailSchema.optional(),
  password: passwordSchema.optional(),
});

export const adminNotificationSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis").max(150),
  message: z.string().trim().min(1, "Le message est requis").max(2000),
  type: z.string().trim().max(50).optional(),
  target: z.union([
    z.literal("ALL"),
    z.literal("ACTIVE"),
    z.array(cuidSchema).min(1),
    cuidSchema,
  ]),
  channels: z.array(z.enum(["SITE", "EMAIL", "SMS"])).optional(),
});

// page-content's per-field validation is already handled dynamically
// against PAGE_CONTENT_SCHEMA in the route (allowed-key filtering) — this
// just guards the top-level envelope shape before that logic runs.
export const pageContentEnvelopeSchema = z.object({
  pageKey: z.string().trim().min(1),
  content: z.record(z.string(), z.unknown()),
});

// Login-specific: intentionally NOT reusing passwordSchema's min(6) — that
// rule is for setting a new password, not for validating one against an
// existing hash. A legacy account could have a shorter password; rejecting
// the login attempt before even checking the hash would lock them out for
// the wrong reason. Just bound length to stop abuse (huge payloads).
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(3).max(254),
  password: z.string().min(1, "Mot de passe requis").max(200),
  rememberMe: z.boolean().optional(),
});

export const otpSchema = z.object({
  email: z.string().trim().toLowerCase().min(3).max(254),
  code: z.string().trim().regex(/^\d{4,8}$/, "Code invalide"),
});

export const resendCodeSchema = z.object({
  email: z.string().trim().toLowerCase().min(3).max(254),
});

export const resetPasswordRequestSchema = z.object({
  email: z.string().trim().toLowerCase().min(3).max(254),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().min(3).max(254),
  token: z.string().trim().min(10).max(500),
  newPassword: passwordSchema,
});

export const userPreferencesSchema = z.object({
  language: z.enum(["FR", "EN", "AR"]).optional(),
  darkMode: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
});

export const attendanceCheckinSchema = z.object({
  sessionId: cuidSchema,
  userId: cuidSchema,
  undo: z.boolean().optional(),
});

export const subscribeSchema = z.object({
  planId: cuidSchema,
  paymentMethod: z.enum(["ONLINE", "ONSITE"]),
  promoCode: z.string().trim().max(30).optional().or(z.literal("")),
});

// Custom (not the generic urlSchema) since avatar accepts either a real
// https:// URL (Cloudinary) OR a data:image/... URL (fallback when
// Cloudinary isn't configured) — see ProfileAvatar.tsx. The 2MB data-URL
// size cap is still enforced separately in the route since Zod's .max()
// on a string only bounds character count, and base64 overhead means the
// "2MB of image bytes" ceiling isn't a clean string-length check.
export const avatarSchema = z
  .string()
  .refine((v) => /^https:\/\//.test(v) || v.startsWith("data:image/"), "Format d'image invalide");

export const profileUpdateSchema = z.object({
  name: nameSchema.optional(),
  phone: phoneSchema.optional().or(z.literal("")),
  avatar: avatarSchema.nullable().optional(),
});

export const accountDeleteSchema = z.object({
  password: z.string().min(1, "Mot de passe requis").max(200),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis").max(200),
  newPassword: passwordSchema,
});

export const bookSessionSchema = z.object({
  sessionId: cuidSchema,
});

export const postSchema = z.object({
  title: z.string().trim().max(200).optional().or(z.literal("")),
  content: z.string().trim().min(1, "Le contenu est requis").max(5000),
  mediaUrl: optionalUrl().nullable(),
  mediaType: z.enum(["image", "video", "audio"]).nullable().optional(),
  musicUrl: optionalUrl().nullable(),
});

export const postUpdateSchema = z.object({
  title: z.string().trim().max(200).nullable().optional(),
  content: z.string().trim().min(1).max(5000).optional(),
  mediaUrl: optionalUrl().nullable(),
  mediaType: z.enum(["image", "video", "audio"]).nullable().optional(),
  musicUrl: optionalUrl().nullable(),
  isPublished: z.boolean().optional(),
});

export const commentSchema = z.object({
  content: z.string().trim().min(1, "Le contenu du commentaire est requis").max(1000),
});

export const commentDeleteSchema = z.object({
  commentId: cuidSchema,
});

/**
 * Parses `body` against `schema` and returns either the parsed data or a
 * ready-to-return 400 NextResponse. Callers should check `"response" in
 * result` before using `result.data`. Keeps the Zod error → French,
 * no-stack-trace, no-internal-detail response shape consistent across
 * routes instead of every route hand-rolling its own zod error mapping.
 */
export function formatZodError(error: z.ZodError): string {
  const first = error.issues[0];
  return first?.message || "Requête invalide";
}
