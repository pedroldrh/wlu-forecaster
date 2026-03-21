import { describe, it, expect } from "vitest";
import {
  brierScore,
  brierPoints,
  seasonScore,
  rankUsers,
  findBonusWinner,
  isCorrect,
  winLossRecord,
  UserScore,
} from "./scoring";

function makeUser(overrides: Partial<UserScore> & { userId: string; name: string }): UserScore {
  return {
    wins: 0,
    losses: 0,
    questionsPlayed: 0,
    joinedAt: new Date("2026-01-01"),
    totalResolvedQuestions: 10,
    participationPct: 100,
    qualifiesForPrize: true,
    avgSubmissionTime: 0,
    ...overrides,
  };
}

describe("brierScore", () => {
  it("returns 0 for perfect prediction (p=1, outcome=true)", () => {
    expect(brierScore(1, true)).toBe(0);
  });

  it("returns 0 for perfect prediction (p=0, outcome=false)", () => {
    expect(brierScore(0, false)).toBe(0);
  });

  it("returns 1 for worst prediction (p=0, outcome=true)", () => {
    expect(brierScore(0, true)).toBe(1);
  });

  it("returns 1 for worst prediction (p=1, outcome=false)", () => {
    expect(brierScore(1, false)).toBe(1);
  });

  it("returns 0.25 for p=0.5 regardless of outcome", () => {
    expect(brierScore(0.5, true)).toBe(0.25);
    expect(brierScore(0.5, false)).toBe(0.25);
  });

  it("returns correct score for p=0.7, outcome=true", () => {
    expect(brierScore(0.7, true)).toBeCloseTo(0.09, 5);
  });

  it("returns correct score for p=0.3, outcome=false", () => {
    expect(brierScore(0.3, false)).toBeCloseTo(0.09, 5);
  });
});

describe("brierPoints", () => {
  it("returns 1 for perfect prediction", () => {
    expect(brierPoints(1, true)).toBe(1);
    expect(brierPoints(0, false)).toBe(1);
  });

  it("returns 0 for worst prediction", () => {
    expect(brierPoints(0, true)).toBe(0);
    expect(brierPoints(1, false)).toBe(0);
  });

  it("returns 0.75 for p=0.5", () => {
    expect(brierPoints(0.5, true)).toBe(0.75);
    expect(brierPoints(0.5, false)).toBe(0.75);
  });

  it("is always between 0 and 1", () => {
    for (let p = 0; p <= 1; p += 0.1) {
      expect(brierPoints(p, true)).toBeGreaterThanOrEqual(0);
      expect(brierPoints(p, true)).toBeLessThanOrEqual(1);
      expect(brierPoints(p, false)).toBeGreaterThanOrEqual(0);
      expect(brierPoints(p, false)).toBeLessThanOrEqual(1);
    }
  });
});

describe("seasonScore", () => {
  it("returns 0 for empty forecasts", () => {
    expect(seasonScore([])).toBe(0);
  });

  it("returns 1 for all perfect predictions", () => {
    expect(
      seasonScore([
        { probability: 1, outcome: true },
        { probability: 0, outcome: false },
      ])
    ).toBe(1);
  });

  it("returns 0 for all worst predictions", () => {
    expect(
      seasonScore([
        { probability: 0, outcome: true },
        { probability: 1, outcome: false },
      ])
    ).toBe(0);
  });

  it("returns correct average for mixed forecasts", () => {
    const forecasts = [
      { probability: 0.8, outcome: true }, // points = 1 - 0.04 = 0.96
      { probability: 0.3, outcome: false }, // points = 1 - 0.09 = 0.91
    ];
    expect(seasonScore(forecasts)).toBeCloseTo(0.935, 3);
  });
});

describe("isCorrect", () => {
  it("returns true when voted YES and outcome is true", () => {
    expect(isCorrect(1, true)).toBe(true);
    expect(isCorrect(0.5, true)).toBe(true);
  });

  it("returns true when voted NO and outcome is false", () => {
    expect(isCorrect(0, false)).toBe(true);
    expect(isCorrect(0.3, false)).toBe(true);
  });

  it("returns false when voted YES and outcome is false", () => {
    expect(isCorrect(0.8, false)).toBe(false);
  });

  it("returns false when voted NO and outcome is true", () => {
    expect(isCorrect(0.2, true)).toBe(false);
  });
});

describe("winLossRecord", () => {
  it("returns 0-0 for empty forecasts", () => {
    expect(winLossRecord([])).toEqual({ wins: 0, losses: 0 });
  });

  it("counts wins and losses correctly", () => {
    const forecasts = [
      { probability: 0.8, outcome: true },  // YES vote, outcome YES -> win
      { probability: 0.3, outcome: false },  // NO vote, outcome NO -> win
      { probability: 0.8, outcome: false },  // YES vote, outcome NO -> loss
    ];
    expect(winLossRecord(forecasts)).toEqual({ wins: 2, losses: 1 });
  });
});

describe("rankUsers", () => {
  it("ranks by wins descending", () => {
    const users: UserScore[] = [
      makeUser({ userId: "a", name: "A", wins: 3, losses: 2, questionsPlayed: 5 }),
      makeUser({ userId: "b", name: "B", wins: 5, losses: 0, questionsPlayed: 5 }),
    ];
    const ranked = rankUsers(users);
    expect(ranked[0].userId).toBe("b");
    expect(ranked[1].userId).toBe("a");
  });

  it("breaks ties by fewer losses", () => {
    const users: UserScore[] = [
      makeUser({ userId: "a", name: "A", wins: 4, losses: 3, questionsPlayed: 7 }),
      makeUser({ userId: "b", name: "B", wins: 4, losses: 1, questionsPlayed: 5 }),
    ];
    const ranked = rankUsers(users);
    expect(ranked[0].userId).toBe("b");
  });

  it("breaks further ties by more questions played", () => {
    const users: UserScore[] = [
      makeUser({ userId: "a", name: "A", wins: 4, losses: 1, questionsPlayed: 5 }),
      makeUser({ userId: "b", name: "B", wins: 4, losses: 1, questionsPlayed: 8 }),
    ];
    const ranked = rankUsers(users);
    expect(ranked[0].userId).toBe("b");
  });

  it("breaks further ties by earlier avg submission time", () => {
    const users: UserScore[] = [
      makeUser({ userId: "a", name: "A", wins: 4, losses: 1, questionsPlayed: 5, avgSubmissionTime: 5000 }),
      makeUser({ userId: "b", name: "B", wins: 4, losses: 1, questionsPlayed: 5, avgSubmissionTime: 1000 }),
    ];
    const ranked = rankUsers(users);
    expect(ranked[0].userId).toBe("b");
  });

  it("does not mutate original array", () => {
    const users: UserScore[] = [
      makeUser({ userId: "a", name: "A", wins: 2, losses: 3, questionsPlayed: 5 }),
      makeUser({ userId: "b", name: "B", wins: 4, losses: 1, questionsPlayed: 5 }),
    ];
    rankUsers(users);
    expect(users[0].userId).toBe("a");
  });
});

describe("findBonusWinner", () => {
  it("returns null for empty map", () => {
    expect(findBonusWinner(new Map())).toBe(null);
  });

  it("returns the user with the highest single-question score", () => {
    const map = new Map<string, { probability: number; outcome: boolean; questionId: string }[]>();
    map.set("a", [
      { probability: 0.9, outcome: true, questionId: "q1" },  // 0.99 points
      { probability: 0.5, outcome: true, questionId: "q2" },  // 0.75 points
    ]);
    map.set("b", [
      { probability: 0.95, outcome: true, questionId: "q1" }, // 0.9975 points
    ]);
    const winner = findBonusWinner(map);
    expect(winner?.userId).toBe("b");
    expect(winner?.questionId).toBe("q1");
  });
});
