import { PrismaClient } from "@prisma/client";

/**
 * Client logos shown in the "they trust us" strip. Logos are real Google Drive
 * images uploaded via the admin (host allowlisted in next.config). Resets the
 * clients table to exactly this list.
 *
 * Run with: `npx tsx prisma/seed-clients.ts`
 */

const prisma = new PrismaClient();

const drive = (id: string) => `https://lh3.googleusercontent.com/d/${id}`;

const clients = [
  { name: "Bar Goiás", logo: "1mJ43Iz-m1MAkh1krU_S9rCpLL-Btge7D" },
  { name: "Moraes Vannuchi", logo: "1bPPFBBPaGSj2SNRprhRqwlY8F1kaJ_Xn" },
  { name: "Sindica", logo: "1GeRm33gesxDzyRx-y2ZuZg-qqYxD6fJ7" },
  { name: "10 X Mentor IA", logo: "1-SIVJ-y6pOJuHCBrmszYSp0WsPXnKT5C" },
  { name: "Sushi Loko", logo: "10uqPtNsJHIe7WY_2l78bwDhI3LkevXIF" },
  { name: "Thiago Vannuchi", logo: "1W5UDOhbS1zVgXuMxXI1P38mcChsdI9gh" },
  { name: "Vannuchi group", logo: "1WZ6ZSegqHnv-iAe5yqEmj0-FGMrXVirQ" },
  { name: "Junior Nunes", logo: "1dXdpAIlfNya61MgbPeAGe1Q2W6-T6sdQ" },
  { name: "Vannuchi Engenharia e Construção", logo: "1p29r9x54lx7q9_8G3f_BBu2-OUPvyj45" },
  { name: "Kalili", logo: "1qcRU-d96ngLuWgJEaSUvOLr8Xtk-TUv9" },
  { name: "Sate", logo: "1De2fTKa6O9oi0flJjtoJA_O-Z9QfueG7" },
  { name: "Coronata", logo: "1OkzSBDBYOwzln7lECfF6A9SqWySW7Rhx" },
  { name: "Conecta", logo: "1etpytDVn4uJHWUBW0iY4C6TM-oaMO-vT" },
];

async function main() {
  await prisma.client.deleteMany();
  await prisma.client.createMany({
    data: clients.map((c, i) => ({
      name: c.name,
      logoUrl: drive(c.logo),
      order: i,
      published: true,
    })),
  });
  console.log(`✓ ${clients.length} clients in place.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
