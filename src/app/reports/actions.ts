"use server";

import { revalidatePath } from "next/cache";
import { recordNetWorthSnapshot } from "@/lib/networth";
import { requireUserId } from "@/lib/currentUser";

export async function snapshotNetWorth() {
  const userId = await requireUserId();
  await recordNetWorthSnapshot(userId);
  revalidatePath("/reports");
  revalidatePath("/");
}
