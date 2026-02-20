"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function SignInPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <BarChart3 className="h-10 w-10" />
        </div>
        <CardTitle className="text-2xl">Forecaster</CardTitle>
        <CardDescription>
          W&L Campus Forecasting Tournament
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          className="w-full"
          onClick={() => signIn("github", { callbackUrl: "/" })}
        >
          Sign in with GitHub
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-4">
          Use your GitHub account linked to your @mail.wlu.edu email to participate in the tournament.
        </p>
      </CardContent>
    </Card>
  );
}
