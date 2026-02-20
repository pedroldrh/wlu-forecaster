import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default async function SuccessPage({ params }: { params: Promise<{ seasonId: string }> }) {
  const { seasonId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data: entry } = await supabase
    .from("season_entries")
    .select("*")
    .eq("user_id", user.id)
    .eq("season_id", seasonId)
    .single();

  const isEntered = entry?.status === "PAID" || entry?.status === "JOINED";

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
          <CardTitle>
            {isEntered ? "You're In!" : "Something went wrong"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {isEntered ? (
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
                We couldn't confirm your entry. Please try joining again.
              </p>
              <Button variant="outline" asChild>
                <Link href={`/join/${seasonId}`}>Try Again</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
