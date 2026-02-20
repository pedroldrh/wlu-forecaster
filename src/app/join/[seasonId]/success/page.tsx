import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default async function SuccessPage({ params }: { params: Promise<{ seasonId: string }> }) {
  const { seasonId } = await params;
  const session = await auth();
  if (!session) redirect("/signin");

  const entry = await prisma.seasonEntry.findUnique({
    where: { userId_seasonId: { userId: session.user.id, seasonId } },
  });

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
          <CardTitle>
            {entry?.status === "PAID" ? "You're In!" : "Processing Payment..."}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {entry?.status === "PAID" ? (
            <>
              <p className="text-muted-foreground">
                Your entry has been confirmed. Start making forecasts!
              </p>
              <Button asChild>
                <Link href="/questions">View Questions</Link>
              </Button>
            </>
          ) : (
            <>
              <p className="text-muted-foreground">
                Your payment is being processed. This usually takes a few seconds.
                Refresh the page if your status doesn't update.
              </p>
              <Button variant="outline" asChild>
                <Link href="/">Go Home</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
