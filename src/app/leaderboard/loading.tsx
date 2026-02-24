import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function LeaderboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <Skeleton className="h-8 w-64 mx-auto" />
        <Skeleton className="h-4 w-40 mx-auto" />
      </div>

      {/* Podium */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 items-end">
        {[
          { avatar: "h-8 w-8", score: "h-6 w-14", pad: "pt-4 pb-2" },
          { avatar: "h-12 w-12", score: "h-8 w-20", pad: "pt-5 pb-3" },
          { avatar: "h-8 w-8", score: "h-6 w-14", pad: "pt-4 pb-2" },
        ].map((slot, i) => (
          <Card key={i}>
            <CardContent className={`flex flex-col items-center px-3 ${slot.pad}`}>
              <Skeleton className="h-3 w-6 mb-2" />
              <Skeleton className={`rounded-full mb-2 ${slot.avatar}`} />
              <Skeleton className="h-3 w-14 mb-1" />
              <Skeleton className={slot.score} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rankings */}
      <Card>
        <CardContent className="pt-2 pb-2">
          <div className="space-y-1">
            {[4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="flex items-center gap-3 py-3 px-2">
                <Skeleton className="h-4 w-7" />
                <Skeleton className="h-7 w-7 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-14" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
