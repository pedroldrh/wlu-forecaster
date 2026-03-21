# YES/NO Voting Pivot

## Summary

Replace probability-based forecasting (0-100% slider + Brier scoring) with simple YES/NO binary voting. Users tap YES or NO on each market. Scoring is win-loss record. Leaderboard ranks by most wins, ties broken by fewest losses.

## Motivation

- Users don't understand probability percentages or how Brier scoring awards points
- The chain from probability → points → leaderboard → money is too long
- YES/NO is instant, intuitive, and drives more engagement across more markets

## Database

- `forecasts.probability` column stays. Set to `1.0` for YES, `0.0` for NO. No migration needed.
- Scoring logic: a forecast is "correct" when `(probability == 1.0 && resolved_outcome == true) || (probability == 0.0 && resolved_outcome == false)`
- Wins = number of correct forecasts on resolved markets
- Losses = number of incorrect forecasts on resolved markets
- Minimum markets to qualify for prizes: **15** (up from 5)

## Leaderboard

- Display W-L records like basketball: **18-2**
- Rank by: wins descending, then losses ascending
- Podium and table layout stay the same, just score format changes
- Score display: green number for wins, red for losses (e.g., "18" in green, "-2" in red)

## Market Detail Page

- **Remove**: consensus chart, forecast slider, probability display
- **Add**: two big YES/NO buttons, side by side, instant submit on tap
- After voting, highlight the chosen button, allow changing vote
- **Keep**: title, description, emoji, category banner, countdown timer, vote count, comments, resolution result

## Market Cards (Feed)

- **Remove**: consensus percentage, "chance" label, "You: X%" display
- **Add**: "Voted" indicator (checkmark or similar) when user has voted
- **Keep**: title, category banner, countdown, vote count, resolution badge (YES/NO)

## Homepage

- Replace "How Forecasting Works" 4-card section with 2-3 simpler cards:
  1. Vote YES or NO on campus questions
  2. Get it right, get a win. Get it wrong, take a loss.
  3. Vote on 15+ markets to qualify for prizes. Best record wins cash.
- Update participation tracker minimum from 5 to 15

## What Gets Removed

- `ConsensusChart` component (SVG chart)
- `ForecastSlider` / probability input component
- Brier score display everywhere (keep `lib/scoring.ts` for backward compat with already-resolved markets)
- Probability percentage displays on cards, detail pages, leaderboard
- "How Forecasting Works" Brier formula explanation

## What Gets Modified

- `src/app/questions/[id]/page.tsx` — remove chart, replace slider with YES/NO buttons
- `src/components/question-card.tsx` — remove consensus %, show voted indicator
- `src/app/leaderboard/page.tsx` — W-L record scoring and display
- `src/components/leaderboard-table.tsx` — W-L format, sort by wins then losses
- `src/app/page.tsx` — simplified How It Works, update min from 5 to 15
- `src/actions/forecasts.ts` — accept YES/NO instead of probability float
- `src/lib/scoring.ts` — add W-L scoring functions alongside existing Brier (keep Brier for old resolved markets)
- `src/lib/constants.ts` — update MIN_FORECASTS if defined there

## Backward Compatibility

- Already-resolved markets that were scored with Brier keep their existing scores
- The leaderboard for the current season recalculates using W-L logic for all resolved markets (old probability forecasts: >= 0.5 treated as YES, < 0.5 as NO)
- No database migration required
