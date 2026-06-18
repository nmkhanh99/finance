"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, SplitType } from "@prisma/client";
import { equalSplit } from "@/lib/split";

export async function createGroup(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim() || null;
  if (!name) return;
  const g = await prisma.tripGroup.create({ data: { name, note } });
  redirect(`/trips/${g.id}`);
}

export async function deleteGroup(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.tripGroup.delete({ where: { id } });
  revalidatePath("/trips");
  redirect("/trips");
}

export async function addMember(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!groupId || !name) return;
  await prisma.tripMember.create({ data: { groupId, name } });
  revalidatePath(`/trips/${groupId}`);
}

export async function deleteMember(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const groupId = String(formData.get("groupId") ?? "");
  if (!id) return;
  try {
    await prisma.tripMember.delete({ where: { id } });
  } catch {
    // Không xoá được nếu thành viên đã trả/đứng tên trong chi phí -> bỏ qua
  }
  revalidatePath(`/trips/${groupId}`);
}

export async function addExpense(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const payerId = String(formData.get("payerId") ?? "");
  const dateStr = String(formData.get("date") ?? "");
  const splitType = (String(formData.get("splitType") ?? "EQUAL") as SplitType) || "EQUAL";
  const participantIds = formData.getAll("participants").map(String).filter(Boolean);

  if (!groupId || !description || !payerId || participantIds.length === 0) return;

  // Tính số tiền mỗi người phải chịu
  let shares: { memberId: string; amount: number }[];
  if (splitType === "CUSTOM") {
    shares = participantIds.map((id) => ({
      memberId: id,
      amount: Math.max(Number(formData.get(`share_${id}`) ?? 0) || 0, 0),
    }));
  } else {
    const total = Number(formData.get("amount") ?? 0) || 0;
    const parts = equalSplit(total, participantIds.length);
    shares = participantIds.map((id, i) => ({ memberId: id, amount: parts[i] }));
  }

  const amount = shares.reduce((s, x) => s + x.amount, 0);
  if (amount <= 0) return;

  const date = dateStr ? new Date(dateStr) : new Date();

  await prisma.tripExpense.create({
    data: {
      groupId,
      description,
      amount: new Prisma.Decimal(amount),
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
  revalidatePath(`/trips/${groupId}`);
}

export async function deleteExpense(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const groupId = String(formData.get("groupId") ?? "");
  if (!id) return;
  await prisma.tripExpense.delete({ where: { id } });
  revalidatePath(`/trips/${groupId}`);
}
