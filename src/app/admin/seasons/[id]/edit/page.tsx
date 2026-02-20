import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { EditSeasonForm } from "./edit-form";

export default async function EditSeasonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/");

  const season = await prisma.season.findUnique({ where: { id } });
  if (!season) notFound();

  return <EditSeasonForm season={JSON.parse(JSON.stringify(season))} />;
}
