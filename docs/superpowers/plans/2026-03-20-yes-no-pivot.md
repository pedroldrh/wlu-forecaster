# YES/NO Voting Pivot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace probability slider with YES/NO buttons, scoring with W-L records, and simplify all related UI.

**Architecture:** Keep `forecasts.probability` column (1.0=YES, 0.0=NO). Add W-L scoring functions. Replace slider with two buttons. Replace percentage displays with W-L records. Remove consensus chart.

**Tech Stack:** Next.js 15, React, Supabase, Tailwind CSS, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-20-yes-no-pivot-design.md`

---

### Task 1: Update scoring logic

**Files:**
- Modify: `src/lib/scoring.ts`

- [ ] **Step 1: Add W-L scoring functions**

Add these below the existing Brier functions (keep Brier for backward compat):

```typescript
/** Check if a forecast was correct (YES/NO binary) */
export function isCorrect(probability: number, outcome: boolean): boolean {
  const votedYes = probability >= 0.5;
  return votedYes === outcome;
}

/** Compute W-L record from forecasts */
export function winLossRecord(
  forecasts: { probability: number; outcome: boolean }[]
): { wins: number; losses: number } {
  let wins = 0;
  let losses = 0;
  for (const f of forecasts) {
    if (isCorrect(f.probability, f.outcome)) wins++;
    else losses++;
  }
  return { wins, losses };
}
```

- [ ] **Step 2: Update UserScore interface and rankUsers**

Replace `score: number` with `wins: number` and `losses: number`. Update `rankUsers` to sort by wins desc, then losses asc:

```typescript
export interface UserScore {
  userId: string;
  name: string;
  wins: number;
  losses: number;
  questionsPlayed: number;
  joinedAt: Date | null;
  totalResolvedQuestions: number;
  participationPct: number;
  qualifiesForPrize: boolean;
  avgSubmissionTime: number;
}

export function rankUsers(users: UserScore[]): UserScore[] {
  return [...users].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (a.losses !== b.losses) return a.losses - b.losses;
    if (b.questionsPlayed !== a.questionsPlayed)
      return b.questionsPlayed - a.questionsPlayed;
    return a.avgSubmissionTime - b.avgSubmissionTime;
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/scoring.ts
git commit -m "feat: add W-L scoring functions, update UserScore to wins/losses"
```

---

### Task 2: Update forecast action to accept YES/NO

**Files:**
- Modify: `src/actions/forecasts.ts`

- [ ] **Step 1: Change parameter from probability to vote boolean**

```typescript
export async function submitForecast(questionId: string, vote: boolean) {
  // ...auth checks stay the same...
  const probability = vote ? 1.0 : 0.0;
  // ...rest of upsert logic stays the same, using probability variable...
}
```

The only change is the function signature and adding `const probability = vote ? 1.0 : 0.0;` after validation. Remove the probability range check (`if (probability < 0 || probability > 1)`).

- [ ] **Step 2: Commit**

```bash
git add src/actions/forecasts.ts
git commit -m "feat: accept boolean vote instead of probability in submitForecast"
```

---

### Task 3: Replace forecast slider with YES/NO buttons

**Files:**
- Modify: `src/components/forecast-slider.tsx` (rewrite as YES/NO buttons)
- Modify: `src/app/questions/[id]/forecast-form.tsx`

- [ ] **Step 1: Rewrite forecast-slider.tsx as VoteButtons**

Replace entire file:

```tsx
"use client";

import { useState } from "react";
import { Check } from "@phosphor-icons/react";

interface VoteButtonsProps {
  currentVote: boolean | null;
  onSubmit: (vote: boolean) => Promise<void>;
  disabled?: boolean;
}

export function VoteButtons({ currentVote, onSubmit, disabled = false }: VoteButtonsProps) {
  const [submitting, setSubmitting] = useState<boolean | null>(null);

  const handleVote = async (vote: boolean) => {
    if (disabled || submitting !== null) return;
    setSubmitting(vote);
    try {
      await onSubmit(vote);
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="space-y-3">
      {currentVote !== null && (
        <p className="text-xs text-center text-muted-foreground">
          You voted {currentVote ? "YES" : "NO"} · tap to change
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleVote(true)}
          disabled={disabled || submitting !== null}
          className={`relative h-14 rounded-xl font-bold text-lg transition-all active:scale-[0.97] ${
            currentVote === true
              ? "bg-green-500 text-white shadow-lg shadow-green-500/25"
              : "bg-green-500/10 text-green-600 hover:bg-green-500/20 border border-green-500/20"
          } ${submitting === true ? "animate-pulse" : ""}`}
        >
          {currentVote === true && (
            <Check className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" weight="bold" />
          )}
          YES
        </button>
        <button
          onClick={() => handleVote(false)}
          disabled={disabled || submitting !== null}
          className={`relative h-14 rounded-xl font-bold text-lg transition-all active:scale-[0.97] ${
            currentVote === false
              ? "bg-red-500 text-white shadow-lg shadow-red-500/25"
              : "bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/20"
          } ${submitting === false ? "animate-pulse" : ""}`}
        >
          {currentVote === false && (
            <Check className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" weight="bold" />
          )}
          NO
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update forecast-form.tsx**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { VoteButtons } from "@/components/forecast-slider";
import { submitForecast } from "@/actions/forecasts";
import { toast } from "sonner";

interface ForecastFormProps {
  questionId: string;
  currentVote: boolean | null;
  redirectTo?: string;
}

export function ForecastForm({ questionId, currentVote, redirectTo }: ForecastFormProps) {
  const router = useRouter();

  const handleSubmit = async (vote: boolean) => {
    if (redirectTo) {
      router.push(`/signin?next=${encodeURIComponent(redirectTo)}`);
      return;
    }
    try {
      await submitForecast(questionId, vote);
      toast.success(vote ? "Voted YES!" : "Voted NO!");
      router.push("/questions");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit vote");
    }
  };

  return <VoteButtons currentVote={currentVote} onSubmit={handleSubmit} />;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/forecast-slider.tsx src/app/questions/[id]/forecast-form.tsx
git commit -m "feat: replace probability slider with YES/NO vote buttons"
```

---

### Task 4: Update market detail page

**Files:**
- Modify: `src/app/questions/[id]/page.tsx`

- [ ] **Step 1: Remove consensus chart, update ForecastForm props**

Key changes to the detail page:
- Remove `ConsensusChart` import and rendering (line ~10, ~281)
- Remove `forecast_history` query (lines ~113-129)
- Change `ForecastForm` prop from `currentProbability={userForecast?.probability ?? null}` to `currentVote={userForecast ? userForecast.probability >= 0.5 : null}`
- Remove `brierPoints` import and `userScore` computation — replace with simple correct/incorrect check
- In the sidebar "Your Score" section, show "Correct!" or "Wrong" instead of Brier points

Search the file for all references to `probability`, `consensus`, `ConsensusChart`, `brierPoints`, and `userScore` and update accordingly.

- [ ] **Step 2: Commit**

```bash
git add src/app/questions/[id]/page.tsx
git commit -m "feat: remove chart, update detail page for YES/NO voting"
```

---

### Task 5: Update question cards

**Files:**
- Modify: `src/components/question-card.tsx`

- [ ] **Step 1: Remove consensus display, show voted indicator**

Changes:
- Remove `consensusPct` computation (lines 40-42)
- Remove consensus percentage display block (lines 66-70)
- Change user probability display: instead of `You: 73%`, show a green check "Voted" badge
- Keep everything else (title, category, countdown, forecast count, resolution badge)

Replace the user probability section (around line 104-112):
```tsx
{userProbability !== null && userProbability !== undefined ? (
  <span className="flex items-center gap-1 text-green-500 font-medium">
    <CheckCircle className="h-3.5 w-3.5" weight="fill" />
    Voted
  </span>
) : status === "OPEN" && (
  <span className="text-amber-500 font-medium">Vote</span>
)}
```

Remove the `consensus` prop from the interface and all callers.

- [ ] **Step 2: Update all callers of QuestionCard**

In `src/app/questions/page.tsx` and `src/app/page.tsx`: remove `consensus` prop from `<QuestionCard>` calls and remove consensus computation from the data enrichment.

- [ ] **Step 3: Commit**

```bash
git add src/components/question-card.tsx src/app/questions/page.tsx src/app/page.tsx
git commit -m "feat: remove consensus from cards, show Voted badge"
```

---

### Task 6: Update leaderboard

**Files:**
- Modify: `src/app/leaderboard/page.tsx`
- Modify: `src/components/leaderboard-table.tsx`

- [ ] **Step 1: Update leaderboard page scoring logic**

In `leaderboard/page.tsx`, replace the `seasonScore()` call with `winLossRecord()`:

```typescript
import { winLossRecord, rankUsers, UserScore } from "@/lib/scoring";

// In the scoring section, replace:
const { wins, losses } = winLossRecord(scoringForecasts);
return {
  userId: entry.user_id,
  name: ...,
  wins,
  losses,
  questionsPlayed: userForecasts.length,
  qualifiesForPrize: userForecasts.length >= 15, // updated from 5
  ...
};
```

Update the leaderboard entry mapping to pass `wins` and `losses` instead of `score`.

- [ ] **Step 2: Update leaderboard-table.tsx display**

Change the `LeaderboardEntry` interface:
```typescript
interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  wins: number;
  losses: number;
  questionsPlayed: number;
  isCurrentUser?: boolean;
  qualifiesForPrize: boolean;
  prizeCents?: number;
  isFounder?: boolean;
}
```

In the Podium component, replace score display:
```tsx
<div className={cn("font-bold font-mono mt-1", isFirst ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl")}>
  <span className="text-green-500">{entry.wins}</span>
  <span className="text-muted-foreground mx-0.5">-</span>
  <span className="text-red-500">{entry.losses}</span>
</div>
```

Same W-L format in the table rows.

Remove `scoreDelta`, `referralBonus`, and related displays.

- [ ] **Step 3: Commit**

```bash
git add src/app/leaderboard/page.tsx src/components/leaderboard-table.tsx
git commit -m "feat: leaderboard shows W-L records, rank by wins"
```

---

### Task 7: Update homepage

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Replace How Forecasting Works section**

Replace the 4-card grid with 3 simpler cards:

```tsx
<div className="grid gap-3 sm:grid-cols-3">
  <Card className="bg-gradient-to-br from-blue-500/5 to-transparent">
    <CardContent className="pt-4 pb-4 space-y-2">
      <div className="h-8 w-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
        <Crosshair className="h-4 w-4 text-blue-500" />
      </div>
      <p className="font-semibold text-sm">Vote YES or NO</p>
      <p className="text-xs text-muted-foreground">Each market is a yes-or-no question about W&L. Pick your answer.</p>
    </CardContent>
  </Card>

  <Card className="bg-gradient-to-br from-emerald-500/5 to-transparent">
    <CardContent className="pt-4 pb-4 space-y-2">
      <div className="h-8 w-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
        <ShieldCheck className="h-4 w-4 text-emerald-500" />
      </div>
      <p className="font-semibold text-sm">Build Your Record</p>
      <p className="text-xs text-muted-foreground">Get it right, get a W. Get it wrong, take an L. Your record shows on the leaderboard.</p>
    </CardContent>
  </Card>

  <Card className="bg-gradient-to-br from-amber-500/5 to-transparent">
    <CardContent className="pt-4 pb-4 space-y-2">
      <div className="h-8 w-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
        <Trophy className="h-4 w-4 text-amber-500" />
      </div>
      <p className="font-semibold text-sm">Win Real Money</p>
      <p className="text-xs text-muted-foreground">Vote on 15+ markets to qualify. Best record wins cash from the prize pool.</p>
    </CardContent>
  </Card>
</div>
```

- [ ] **Step 2: Update participation tracker minimum from 5 to 15**

Change `const minRequired = 5;` to `const minRequired = 15;` in both `src/app/page.tsx` and `src/app/questions/page.tsx`.

- [ ] **Step 3: Remove consensus computation from homepage upcoming questions**

Remove the consensus query and prop from the homepage question cards.

- [ ] **Step 4: Update homepage leaderboard/scoring data if still used**

Update any remaining `seasonScore` calls to use `winLossRecord`. Update `score` references to `wins`/`losses`.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/app/questions/page.tsx
git commit -m "feat: simplified How It Works, update min to 15, remove consensus"
```

---

### Task 8: Clean up and remove unused code

**Files:**
- Delete or clean: consensus chart references, unused imports

- [ ] **Step 1: Remove ConsensusChart component**

Delete `src/components/consensus-chart.tsx` (now unused).

- [ ] **Step 2: Remove unused imports across codebase**

Grep for `ConsensusChart`, `brierPoints`, `brierScore`, `seasonScore`, `consensus` across all files and remove dead imports/references.

- [ ] **Step 3: Build and verify**

```bash
npx next build
```

Fix any type errors or missing references.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove consensus chart, clean up unused probability/Brier references"
```

---

### Task 9: Deploy and verify

- [ ] **Step 1: Push and deploy**

```bash
git push origin master
npx vercel --prod
```

- [ ] **Step 2: Verify on mobile and desktop**

Check: market cards show no percentage, detail pages have YES/NO buttons, leaderboard shows W-L records, How It Works is simplified.
