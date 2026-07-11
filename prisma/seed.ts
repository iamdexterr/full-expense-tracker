import { prisma } from "../src/db.js";

const GLOBAL_CATEGORIES = [
  "Food",
  "Transport",
  "Utilities",
  "Entertainment",
  "Health",
];

async function main() {
  for (const name of GLOBAL_CATEGORIES) {
    const exists = await prisma.category.findFirst({
      where: { name, userId: null }, // findFirst CAN filter on null
    });
    if (!exists) {
      await prisma.category.create({
        data: { name, userId: null },
      });
    }
  }
  console.log("✅ Seeded global categories");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
