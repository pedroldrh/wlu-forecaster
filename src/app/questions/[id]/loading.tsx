import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function QuestionDetailLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Back button */}
      <Skeleton className="h-5 w-24" />

      {/* Hero card */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start gap-4">
            <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="h-7 w-full" />
              <Skeleton className="h-7 w-2/3" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consensus + forecast cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="py-4 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-2 w-full rounded-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-2 w-full rounded-full" />
          </CardContent>
        </Card>
      </div>

      {/* Forecast form */}
      <Card>
        <CardContent className="pt-5 pb-5 space-y-4">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-8 w-full rounded-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-16 w-full" />
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
