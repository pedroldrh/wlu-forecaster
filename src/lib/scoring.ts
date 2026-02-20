export interface UserScore {
  userId: string;
  name: string;
  score: number;
  questionsPlayed: number;
  paidAt: Date | null;
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

/** Ranking comparator: higher score > more questions > earlier payment */
export function rankUsers(users: UserScore[]): UserScore[] {
  return [...users].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.questionsPlayed !== a.questionsPlayed)
      return b.questionsPlayed - a.questionsPlayed;
    if (a.paidAt && b.paidAt) return a.paidAt.getTime() - b.paidAt.getTime();
    if (a.paidAt) return -1;
    if (b.paidAt) return 1;
    return 0;
  });
}
