import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

/**
 * One-off: set the official admin user and remove the seed placeholder.
 *
 * Reads ADMIN_EMAIL, ADMIN_PASSWORD and (optional) ADMIN_NAME from the
 * environment, upserts that admin (bcrypt-hashed password, role ADMIN), then
 * deletes the default `admin@example.com` placeholder if it's no longer used.
 *
 * Run against whichever database DATABASE_URL points at:
 *   npm run db:set-admin
 */
const prisma = new PrismaClient();

const PLACEHOLDER = "admin@example.com";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Admin";

  if (!email || !password) {
    throw new Error(
      "Set ADMIN_EMAIL and ADMIN_PASSWORD in the environment before running.",
    );
  }
  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, name, role: "ADMIN" },
    create: { email, name, passwordHash, role: "ADMIN" },
  });
  console.log(`✓ Admin set: ${email}`);

  if (email !== PLACEHOLDER) {
    const removed = await prisma.adminUser.deleteMany({
      where: { email: PLACEHOLDER },
    });
    if (removed.count > 0) {
      console.log(`✓ Removed placeholder admin (${PLACEHOLDER})`);
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e instanceof Error ? e.message : e);
    await prisma.$disconnect();
    process.exit(1);
  });
