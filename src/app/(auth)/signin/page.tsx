"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { toast } from "sonner";

export default function SignInPage() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleMicrosoftSignIn() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: {
        scopes: "openid email profile",
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
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
      <CardContent className="space-y-4">
        <Button
          className="w-full"
          size="lg"
          onClick={handleMicrosoftSignIn}
          disabled={loading}
        >
          {loading ? "Redirecting..." : "Sign in with Microsoft"}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Sign in with your W&L Microsoft account
        </p>
      </CardContent>
    </Card>
  );
}
