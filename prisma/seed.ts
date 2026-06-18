import { PrismaClient, TransactionType } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORIES: { name: string; type: TransactionType }[] = [
  { name: "Lương", type: "INCOME" },
  { name: "Thưởng", type: "INCOME" },
  { name: "Lãi đầu tư", type: "INCOME" },
  { name: "Ăn uống", type: "EXPENSE" },
  { name: "Đi lại", type: "EXPENSE" },
  { name: "Nhà ở / Hoá đơn", type: "EXPENSE" },
  { name: "Mua sắm", type: "EXPENSE" },
  { name: "Giải trí", type: "EXPENSE" },
  { name: "Sức khoẻ", type: "EXPENSE" },
  { name: "Trả nợ / Lãi vay", type: "EXPENSE" },
];

async function main() {
  const count = await prisma.category.count();
  if (count > 0) {
    console.log(`Đã có ${count} danh mục, bỏ qua seed.`);
    return;
  }
  await prisma.category.createMany({ data: CATEGORIES });
  console.log(`Đã tạo ${CATEGORIES.length} danh mục mặc định.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
