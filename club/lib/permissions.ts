// src/lib/permissions.ts
//
// Fine-grained permission catalog for the ADMIN role. OWNER always has every
// permission — it is not stored in the database and can't be revoked.
// A permission with no row in `role_permissions` is treated as ALLOWED, so
// deploying this feature doesn't silently lock existing Admins out of
// anything until the Owner explicitly flips a switch off.
import prisma from "@/lib/prisma";
import type { JWTPayload } from "@/lib/auth";

export interface PermissionDef {
  key: string;
  label: string;
  group: string;
  description: string;
}

export const PERMISSION_CATALOG: PermissionDef[] = [
  { key: "members.write",       group: "Membres",       label: "Ajouter / modifier des membres", description: "Créer et éditer les fiches membres." },
  { key: "members.suspend",     group: "Membres",       label: "Suspendre un membre",             description: "Suspendre ou réactiver un compte membre." },
  { key: "staff.manage",        group: "Équipe",        label: "Gérer l'équipe",                  description: "Voir et gérer les coachs et le staff." },
  { key: "planning.manage",     group: "Planning",      label: "Gérer le planning",               description: "Créer, modifier ou annuler des cours." },
  { key: "bookings.manage",     group: "Réservations",  label: "Gérer les réservations",          description: "Approuver ou annuler des réservations." },
  { key: "memberships.sell",    group: "Abonnements",   label: "Vendre / renouveler",             description: "Vendre et renouveler des abonnements." },
  { key: "payments.record",     group: "Paiements",     label: "Enregistrer des paiements",       description: "Saisir des paiements et imprimer des reçus." },
  { key: "payments.refund",     group: "Paiements",     label: "Rembourser",                      description: "Effectuer des remboursements (réservé normalement à l'Owner)." },
  { key: "announcements.manage",group: "Annonces",      label: "Gérer les annonces",              description: "Publier, modifier ou supprimer des annonces." },
  { key: "notifications.send",  group: "Notifications", label: "Envoyer des notifications",       description: "Notifier les membres manuellement." },
  { key: "reports.view",        group: "Rapports",      label: "Consulter les rapports",          description: "Voir les rapports de fréquentation et paiements." },
];

export const PERMISSION_KEYS = PERMISSION_CATALOG.map((p) => p.key);

export function isValidPermissionKey(key: string): boolean {
  return PERMISSION_KEYS.includes(key);
}
export async function hasPermission(user: JWTPayload, key: string): Promise<boolean> {
  if (user.role?.toUpperCase() === "OWNER") return true;
  const row = await prisma.rolePermission.findUnique({
    where: { role_key: { role: "ADMIN", key } },
  });
  return row ? row.allowed : true;
}
