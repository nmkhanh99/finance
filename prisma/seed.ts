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

const DEFAULT_USER = "default";

async function main() {
  // Tỷ giá gốc VND = 1 (idempotent)
  await prisma.exchangeRate.upsert({
    where: { code: "VND" },
    create: { code: "VND", rate: 1 },
    update: {},
  });

  // User mặc định (nhận dữ liệu cũ). Trên DB đã migrate sẵn; ở đây idempotent cho cài mới.
  const user = await prisma.user.upsert({
    where: { username: DEFAULT_USER },
    create: { username: DEFAULT_USER },
    update: {},
  });

  const count = await prisma.category.count({ where: { userId: user.id } });
  if (count > 0) {
    console.log(`User '${DEFAULT_USER}' đã có ${count} danh mục, bỏ qua seed.`);
    return;
  }
  await prisma.category.createMany({ data: CATEGORIES.map((c) => ({ ...c, userId: user.id })) });
  console.log(`Đã tạo ${CATEGORIES.length} danh mục cho user '${DEFAULT_USER}'.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
