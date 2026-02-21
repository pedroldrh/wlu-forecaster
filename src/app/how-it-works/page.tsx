import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, BarChart3, Trophy, ShieldCheck, HelpCircle, Calendar } from "lucide-react";

export const metadata = {
  title: "How It Works — Forecaster",
};

export default function HowItWorksPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">How It Works</h1>
        <p className="text-muted-foreground">
          Everything you need to know about the forecasting tournament
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Making Predictions</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Each question asks whether something will happen — like{" "}
            <strong className="text-foreground">&quot;Will W&L baseball win 10+ games this season?&quot;</strong>
          </p>
          <p>
            Instead of just picking Yes or No, you set a{" "}
            <strong className="text-foreground">probability from 0% to 100%</strong>.
            This is your confidence level:
          </p>
          <ul className="space-y-1.5 ml-4">
            <li><strong className="text-foreground">90%</strong> = &quot;I&apos;m almost certain this will happen&quot;</li>
            <li><strong className="text-foreground">50%</strong> = &quot;Total coin flip, no idea&quot;</li>
            <li><strong className="text-foreground">10%</strong> = &quot;I&apos;m almost certain this won&apos;t happen&quot;</li>
          </ul>
          <p>
            You can update your prediction as many times as you want before the question closes.
            Only your most recent forecast counts.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-lg">Scoring (Brier Score)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Your score rewards <strong className="text-foreground">calibration</strong> — being
            confident when you&apos;re right and cautious when you&apos;re unsure.
          </p>
          <p>The formula is simple: <strong className="text-foreground">Points = 1 - (your probability - outcome)²</strong></p>
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="font-medium text-foreground">Example: &quot;Will it rain at formal?&quot;</p>
            <p>You say <strong className="text-foreground">80%</strong>. It does rain (outcome = 1).</p>
            <p>Points = 1 - (0.80 - 1)² = 1 - 0.04 = <strong className="text-foreground">0.96 points</strong> (great!)</p>
            <p className="border-t pt-2 mt-2">If it didn&apos;t rain (outcome = 0):</p>
            <p>Points = 1 - (0.80 - 0)² = 1 - 0.64 = <strong className="text-foreground">0.36 points</strong> (ouch)</p>
          </div>
          <p>
            The takeaway: don&apos;t just say 90% on everything. If you&apos;re wrong, high
            confidence costs you big. The best forecasters are honest about what they don&apos;t know.
          </p>
          <p>
            Your <strong className="text-foreground">score</strong> is the average of your
            points across all resolved questions you forecasted on. Higher is better. Perfect score is 1.00.
          </p>
          <p>
            This is the same type of probability-based forecasting used by platforms like{" "}
            <strong className="text-foreground">Kalshi</strong> and{" "}
            <strong className="text-foreground">Polymarket</strong>, where traders assign
            probabilities to real-world events. The Brier score is the standard way to measure
            how good a forecaster you actually are.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-500" />
            <CardTitle className="text-lg">Biweekly Payouts</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            The leaderboard <strong className="text-foreground">resolves every two weeks</strong>.
            At the end of each two-week cycle, prizes are paid out to the top forecasters based
            on their current leaderboard position.
          </p>
          <p>
            After each payout, the leaderboard resets and a new cycle begins. This means you
            have a fresh shot at winning <strong className="text-foreground">every two weeks</strong>.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-lg">Participation Requirement</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            To qualify for prizes, you must forecast on at least{" "}
            <strong className="text-foreground">70% of questions</strong> that resolve
            during the two-week cycle.
          </p>
          <p>
            This prevents someone from cherry-picking one easy question and winning
            with a perfect score. Consistency matters.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-lg">Prizes</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Every two weeks, prizes are distributed to the top of the leaderboard:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <span>1st Place</span>
            <span className="font-mono text-foreground text-right">$350</span>
            <span>2nd Place</span>
            <span className="font-mono text-foreground text-right">$225</span>
            <span>3rd Place</span>
            <span className="font-mono text-foreground text-right">$150</span>
            <span>4th Place</span>
            <span className="font-mono text-foreground text-right">$100</span>
            <span>5th Place</span>
            <span className="font-mono text-foreground text-right">$75</span>
            <span>Bonus Prize</span>
            <span className="font-mono text-foreground text-right">$100</span>
          </div>
          <p>
            The <strong className="text-foreground">bonus prize</strong> goes to the player with the
            single highest-scoring forecast on any question — the most confident correct call of the cycle.
          </p>
          <p>
            Tiebreaker: if two players have the same score, the one who forecasted on more
            questions wins. Still tied? Whoever submitted their forecasts earlier on average.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-lg">Tips</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ul className="space-y-2">
            <li>
              <strong className="text-foreground">Forecast on everything.</strong> Even a 50% guess is
              better than skipping — it keeps your participation up and 50% always scores exactly 0.75.
            </li>
            <li>
              <strong className="text-foreground">Update often.</strong> Got new info? Change your
              forecast. Only your latest prediction counts.
            </li>
            <li>
              <strong className="text-foreground">Avoid extremes unless you&apos;re sure.</strong> Saying
              99% feels bold, but if you&apos;re wrong, your score tanks. 80% is usually confident enough.
            </li>
            <li>
              <strong className="text-foreground">Check the deadline.</strong> Each question has a close
              time. You can&apos;t forecast after it closes.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
