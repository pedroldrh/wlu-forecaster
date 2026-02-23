import { Button } from "@/components/ui/button";
import { House, ArrowLeft } from "@phosphor-icons/react/ssr";
import { ForecasterLogo } from "@/components/forecaster-logo";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-5 px-4">
      <ForecasterLogo className="h-12 w-12 text-muted-foreground" />
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="text-muted-foreground text-sm">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild variant="outline" className="gap-2">
          <Link href="/questions">
            <ArrowLeft className="h-4 w-4" />
            Markets
          </Link>
        </Button>
        <Button asChild className="gap-2">
          <Link href="/">
            <House className="h-4 w-4" />
            Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
