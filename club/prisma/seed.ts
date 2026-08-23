/**
 * Seeds membership plans plus demo accounts for the gym app.
 *
 * Run with: npx tsx prisma/seed.ts
 */
import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "../lib/bcrypt";

const prisma = new PrismaClient();

const PLANS = [
  {
    name: "Mensuel",
    description: "Idéal pour essayer, sans engagement.",
    price: 80,
    durationDays: 30,
    features: [
      "Accès illimité à la salle",
      "Accès aux cours collectifs",
      "1 séance avec un coach offerte",
    ],
  },
  {
    name: "Trimestriel",
    description: "Le meilleur rapport régularité / prix.",
    price: 210,
    durationDays: 90,
    features: [
      "Accès illimité à la salle",
      "Accès aux cours collectifs",
      "2 séances avec un coach offertes",
      "1 bilan forme inclus",
    ],
  },
  {
    name: "Annuel",
    description: "Le plus économique pour les habitués.",
    price: 720,
    durationDays: 365,
    features: [
      "Accès illimité à la salle",
      "Accès aux cours collectifs",
      "Séances coach illimitées",
      "2 bilans forme inclus",
      "Invité gratuit 1x / mois",
    ],
  },
];

const DEMO_USERS = [
  {
    name: "Membre Demo",
    email: "member@demo.local",
    phone: "+21622100001",
    password: "Demo123!",
    role: Role.MEMBER,
  },
  {
    name: "Admin Demo",
    email: "admin@demo.local",
    phone: "+21622100002",
    password: "Demo123!",
    role: Role.ADMIN,
  },
  {
    name: "Owner Demo",
    email: "owner@demo.local",
    phone: "+21622100003",
    password: "Demo123!",
    role: Role.OWNER,
  },
];

async function main() {
  for (const plan of PLANS) {
    const existing = await prisma.membershipPlan.findFirst({
      where: { name: plan.name },
    });

    if (existing) {
      await prisma.membershipPlan.update({
        where: { id: existing.id },
        data: { ...plan, isActive: true },
      });
      console.log(`Updated plan: ${plan.name}`);
    } else {
      await prisma.membershipPlan.create({ data: { ...plan, isActive: true } });
      console.log(`Created plan: ${plan.name}`);
    }
  }

  for (const demoUser of DEMO_USERS) {
    const existing = await prisma.user.findUnique({
      where: { email: demoUser.email },
    });

    const hashedPassword = await hashPassword(demoUser.password);

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: demoUser.name,
          phone: demoUser.phone,
          role: demoUser.role,
          password: hashedPassword,
          isActive: true,
        },
      });
      console.log(`Updated demo user: ${demoUser.email} (${demoUser.role})`);
    } else {
      await prisma.user.create({
        data: {
          name: demoUser.name,
          email: demoUser.email,
          phone: demoUser.phone,
          password: hashedPassword,
          role: demoUser.role,
          isActive: true,
        },
      });
      console.log(`Created demo user: ${demoUser.email} (${demoUser.role})`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
