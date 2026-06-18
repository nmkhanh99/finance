"use server";

import { revalidatePath } from "next/cache";
import { recordNetWorthSnapshot } from "@/lib/networth";

export async function snapshotNetWorth() {
  await recordNetWorthSnapshot();
  revalidatePath("/reports");
  revalidatePath("/");
}
