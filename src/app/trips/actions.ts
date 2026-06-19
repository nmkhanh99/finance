"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, SplitType } from "@prisma/client";
import { equalSplit } from "@/lib/split";
import { applyTransaction } from "@/lib/txCore";
import { requireUserId } from "@/lib/currentUser";

export async function createGroup(formData: FormData) {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim() || null;
  if (!name) return;
  const g = await prisma.tripGroup.create({ data: { userId, name, note } });
  redirect(`/trips/${g.id}`);
}

export async function deleteGroup(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.tripGroup.deleteMany({ where: { id, userId } });
  revalidatePath("/trips");
  redirect("/trips");
}

export async function addMember(formData: FormData) {
  const userId = await requireUserId();
  const groupId = String(formData.get("groupId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!groupId || !name) return;
  // Xác minh group thuộc user trước khi thêm thành viên (chống IDOR)
  const group = await prisma.tripGroup.findFirst({ where: { id: groupId, userId } });
  if (!group) return;
  await prisma.tripMember.create({ data: { groupId, name } });
  revalidatePath(`/trips/${groupId}`);
}

export async function deleteMember(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  const groupId = String(formData.get("groupId") ?? "");
  if (!id) return;
  try {
    // Chỉ xoá member nếu group cha thuộc user hiện tại
    await prisma.tripMember.deleteMany({ where: { id, group: { userId } } });
  } catch {
    // Không xoá được nếu thành viên đã trả/đứng tên trong chi phí -> bỏ qua
  }
  revalidatePath(`/trips/${groupId}`);
}

// Đánh dấu thành viên là "tôi" (chủ tài khoản) — tối đa 1/nhóm. Bấm lại để bỏ đánh dấu.
export async function setSelfMember(formData: FormData) {
  const userId = await requireUserId();
  const groupId = String(formData.get("groupId") ?? "");
  const memberId = String(formData.get("memberId") ?? "");
  if (!groupId || !memberId) return;
  const group = await prisma.tripGroup.findFirst({
    where: { id: groupId, userId },
    include: { members: { select: { id: true, isSelf: true } } },
  });
  if (!group) return;
  const target = group.members.find((m) => m.id === memberId);
  if (!target) return;
  await prisma.$transaction([
    prisma.tripMember.updateMany({ where: { groupId }, data: { isSelf: false } }),
    ...(target.isSelf ? [] : [prisma.tripMember.update({ where: { id: memberId }, data: { isSelf: true } })]),
  ]);
  revalidatePath(`/trips/${groupId}`);
}

export async function addExpense(formData: FormData) {
  const userId = await requireUserId();
  const groupId = String(formData.get("groupId") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const payerId = String(formData.get("payerId") ?? "");
  const dateStr = String(formData.get("date") ?? "");
  const splitType = (String(formData.get("splitType") ?? "EQUAL") as SplitType) || "EQUAL";
  const currency = (String(formData.get("currency") ?? "VND").trim().toUpperCase() || "VND").slice(0, 5);
  const participantIds = formData.getAll("participants").map(String).filter(Boolean);

  if (!groupId || !description || !payerId || participantIds.length === 0) return;

  // Xác minh group thuộc user; payer + participants phải là thành viên của group (chống IDOR)
  const group = await prisma.tripGroup.findFirst({
    where: { id: groupId, userId },
    include: { members: { select: { id: true, isSelf: true } } },
  });
  if (!group) return;
  const memberById = new Map(group.members.map((m) => [m.id, m]));
  if (!memberById.has(payerId)) return;
  if (!participantIds.every((id) => memberById.has(id))) return;

  // Tính số tiền mỗi người phải chịu
  let shares: { memberId: string; amount: number }[];
  if (splitType === "CUSTOM") {
    shares = participantIds.map((id) => ({
      memberId: id,
      amount: Math.max(Number(formData.get(`share_${id}`) ?? 0) || 0, 0),
    }));
  } else {
    const total = Number(formData.get("amount") ?? 0) || 0;
    // VND chia theo đồng (số nguyên); tiền tệ khác cho phép 2 số lẻ (chia theo "cent").
    const scale = currency === "VND" ? 1 : 100;
    const parts = equalSplit(total * scale, participantIds.length).map((p) => p / scale);
    shares = participantIds.map((id, i) => ({ memberId: id, amount: parts[i] }));
  }

  const amount = shares.reduce((s, x) => s + x.amount, 0);
  if (amount <= 0) return;

  const date = dateStr ? new Date(dateStr) : new Date();

  // Nếu người trả là "bạn" (self): tuỳ chọn trừ tiền từ một hoặc NHIỀU tài khoản
  // (số tiền theo tiền tệ của từng tài khoản) -> sinh giao dịch chi liên kết với khoản này.
  const payerIsSelf = memberById.get(payerId)?.isSelf ?? false;
  let payRows: { accountId: string; amount: number }[] = [];
  if (payerIsSelf) {
    const accIds = formData.getAll("payAccountId").map(String);
    const accAmts = formData.getAll("payAmount").map((v) => Number(v) || 0);
    const rows = accIds
      .map((accountId, i) => ({ accountId, amount: accAmts[i] ?? 0 }))
      .filter((r) => r.accountId && r.amount > 0);
    if (rows.length) {
      const owned = await prisma.account.findMany({
        where: { userId, id: { in: rows.map((r) => r.accountId) } },
        select: { id: true },
      });
      const ownedIds = new Set(owned.map((a) => a.id));
      payRows = rows.filter((r) => ownedIds.has(r.accountId));
    }
  }

  await prisma.$transaction(async (tx) => {
    const exp = await tx.tripExpense.create({
      data: {
        groupId,
        description,
        amount: new Prisma.Decimal(amount),
        currency,
        date,
        splitType,
        payerId,
        shares: {
          create: shares.map((s) => ({
            memberId: s.memberId,
            amount: new Prisma.Decimal(s.amount),
          })),
        },
      },
    });
    for (const r of payRows) {
      await applyTransaction(tx, {
        type: "EXPENSE",
        amount: r.amount,
        date,
        note: `Trip: ${group.name} · ${description}`,
        accountId: r.accountId,
        categoryId: null,
        userId,
        tripExpenseId: exp.id,
      });
    }
  });
  revalidatePath(`/trips/${groupId}`);
  if (payRows.length) {
    revalidatePath("/accounts");
    revalidatePath("/transactions");
    revalidatePath("/");
  }
}

export async function deleteExpense(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  const groupId = String(formData.get("groupId") ?? "");
  if (!id) return;
  // Xác minh expense thuộc group của user; lấy kèm giao dịch đã sinh để hoàn số dư.
  const exp = await prisma.tripExpense.findFirst({
    where: { id, group: { userId } },
    include: { linkedTransactions: true },
  });
  if (!exp) return;
  await prisma.$transaction(async (tx) => {
    // Giao dịch liên kết đều là EXPENSE -> hoàn lại (cộng) số dư trước khi xoá.
    for (const t of exp.linkedTransactions) {
      await tx.account.update({ where: { id: t.accountId }, data: { balance: { increment: t.amount } } });
    }
    await tx.transaction.deleteMany({ where: { tripExpenseId: id } });
    await tx.tripExpense.delete({ where: { id } });
  });
  revalidatePath(`/trips/${groupId}`);
  if (exp.linkedTransactions.length) {
    revalidatePath("/accounts");
    revalidatePath("/transactions");
    revalidatePath("/");
  }
}
