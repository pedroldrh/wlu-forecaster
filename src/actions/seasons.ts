"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { SeasonStatus } from "@prisma/client";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "ADMIN") throw new Error("Admin access required");
  return session.user;
}

export async function createSeason(data: {
  name: string;
  startDate: string;
  endDate: string;
  entryFeeCents: number;
}) {
  await requireAdmin();
  const season = await prisma.season.create({
    data: {
      name: data.name,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      entryFeeCents: data.entryFeeCents,
      status: "DRAFT",
    },
  });
  revalidatePath("/admin/seasons");
  return season;
}

export async function updateSeason(id: string, data: {
  name?: string;
  startDate?: string;
  endDate?: string;
  entryFeeCents?: number;
  status?: SeasonStatus;
}) {
  await requireAdmin();
  const season = await prisma.season.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.startDate && { startDate: new Date(data.startDate) }),
      ...(data.endDate && { endDate: new Date(data.endDate) }),
      ...(data.entryFeeCents !== undefined && { entryFeeCents: data.entryFeeCents }),
      ...(data.status && { status: data.status }),
    },
  });
  revalidatePath("/admin/seasons");
  revalidatePath("/");
  return season;
}
