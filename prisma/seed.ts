import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: "plironderobles@mail.wlu.edu" },
    update: { role: "ADMIN", isWluVerified: true },
    create: {
      email: "plironderobles@mail.wlu.edu",
      name: "Pedro",
      role: "ADMIN",
      isWluVerified: true,
    },
  });

  console.log("Created admin user:", admin.id);

  // Create a LIVE season
  const season = await prisma.season.upsert({
    where: { id: "spring-2026" },
    update: {},
    create: {
      id: "spring-2026",
      name: "Spring 2026",
      startDate: new Date("2026-04-01T00:00:00Z"),
      endDate: new Date("2026-06-15T23:59:59Z"),
      entryFeeCents: 2500,
      status: "LIVE",
    },
  });

  console.log("Created season:", season.name);

  // Create sample questions
  const questions = [
    {
      id: "q-baseball-wins",
      title: "Will W&L baseball win 20+ games this season?",
      description:
        "Resolves YES if the W&L Generals baseball team finishes the 2026 spring season with 20 or more wins (regular season only).",
      category: "SPORTS" as const,
      closeTime: new Date("2026-05-01T23:59:59Z"),
      resolveTime: new Date("2026-06-01T23:59:59Z"),
    },
    {
      id: "q-mock-con",
      title: "Will Mock Convention correctly predict the nominee?",
      description:
        "Resolves YES if the W&L Mock Convention correctly predicts the out-party presidential nominee for 2028.",
      category: "CAMPUS" as const,
      closeTime: new Date("2026-04-20T23:59:59Z"),
      resolveTime: new Date("2026-05-15T23:59:59Z"),
    },
    {
      id: "q-dean-list",
      title: "Will more than 30% of students make Dean's List?",
      description:
        "Resolves YES if more than 30% of the undergraduate student body makes the Dean's List for Spring 2026 term.",
      category: "ACADEMICS" as const,
      closeTime: new Date("2026-05-15T23:59:59Z"),
      resolveTime: new Date("2026-06-10T23:59:59Z"),
    },
    {
      id: "q-greek-formal",
      title: "Will Spring formal weekend be rain-free?",
      description:
        "Resolves YES if there is zero measurable precipitation (>0.01 inches) in Lexington, VA during the designated Greek formal weekend (both days).",
      category: "GREEK" as const,
      closeTime: new Date("2026-04-15T23:59:59Z"),
      resolveTime: new Date("2026-04-20T23:59:59Z"),
    },
    {
      id: "q-new-dining",
      title: "Will the new dining hall open before fall 2026?",
      description:
        "Resolves YES if the renovated dining facility is open and serving students before September 1, 2026.",
      category: "CAMPUS" as const,
      closeTime: new Date("2026-06-01T23:59:59Z"),
      resolveTime: new Date("2026-09-01T23:59:59Z"),
    },
  ];

  for (const q of questions) {
    await prisma.question.upsert({
      where: { id: q.id },
      update: {},
      create: {
        ...q,
        seasonId: season.id,
        status: "OPEN",
      },
    });
    console.log("Created question:", q.title);
  }

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
