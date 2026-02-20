"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { toast } from "sonner";

export default function SignInPage() {
  const [loading, setLoading] = useState<"google" | "microsoft" | null>(null);
  const supabase = createClient();

  async function handleOAuthSignIn(provider: "google" | "azure") {
    setLoading(provider === "azure" ? "microsoft" : "google");
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        ...(provider === "azure" && { scopes: "openid email profile" }),
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(null);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <BarChart3 className="h-10 w-10" />
        </div>
        <CardTitle className="text-2xl">Forecaster</CardTitle>
        <CardDescription>W&L Campus Forecasting Tournament</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          className="w-full"
          size="lg"
          onClick={() => handleOAuthSignIn("google")}
          disabled={loading !== null}
        >
          {loading === "google" ? "Redirecting..." : "Sign in with Google"}
        </Button>

        <Button
          className="w-full"
          variant="outline"
          onClick={() => handleOAuthSignIn("azure")}
          disabled={loading !== null}
        >
          {loading === "microsoft" ? "Redirecting..." : "Sign in with Microsoft"}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Use any Google or Microsoft account to sign in
        </p>

        <p className="text-sm font-medium text-center pt-2">
          No spam, ever. We only email you if you win a prize.
        </p>
      </CardContent>
    </Card>
  );
}
