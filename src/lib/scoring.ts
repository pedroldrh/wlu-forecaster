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

/** Brier score for a single forecast (lower is better, range 0..1) */
export function brierScore(probability: number, outcome: boolean): number {
  const o = outcome ? 1 : 0;
  return (probability - o) ** 2;
}

/** Points = 1 - Brier (higher is better, range 0..1) */
export function brierPoints(probability: number, outcome: boolean): number {
  return 1 - brierScore(probability, outcome);
}

/** Season score = average points across all resolved forecasts */
export function seasonScore(
  forecasts: { probability: number; outcome: boolean }[]
): number {
  if (forecasts.length === 0) return 0;
  const total = forecasts.reduce(
    (sum, f) => sum + brierPoints(f.probability, f.outcome),
    0
  );
  return total / forecasts.length;
}

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

/** Ranking comparator: most wins > fewest losses > most questions > earliest avg submission time */
export function rankUsers(users: UserScore[]): UserScore[] {
  return [...users].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (a.losses !== b.losses) return a.losses - b.losses;
    if (b.questionsPlayed !== a.questionsPlayed)
      return b.questionsPlayed - a.questionsPlayed;
    return a.avgSubmissionTime - b.avgSubmissionTime;
  });
}

/** Find the bonus winner: user with highest single-question Brier points */
export function findBonusWinner(
  userForecasts: Map<string, { probability: number; outcome: boolean; questionId: string }[]>
): { userId: string; questionId: string; points: number } | null {
  let best: { userId: string; questionId: string; points: number } | null = null;
  for (const [userId, forecasts] of userForecasts) {
    for (const f of forecasts) {
      const pts = brierPoints(f.probability, f.outcome);
      if (!best || pts > best.points) {
        best = { userId, questionId: f.questionId, points: pts };
      }
    }
  }
  return best;
}
