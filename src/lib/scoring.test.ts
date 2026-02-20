import { describe, it, expect } from "vitest";
import {
  brierScore,
  brierPoints,
  seasonScore,
  rankUsers,
  UserScore,
} from "./scoring";

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

describe("rankUsers", () => {
  it("ranks by score descending", () => {
    const users: UserScore[] = [
      { userId: "a", name: "A", score: 0.5, questionsPlayed: 5, paidAt: new Date("2026-01-01") },
      { userId: "b", name: "B", score: 0.8, questionsPlayed: 5, paidAt: new Date("2026-01-01") },
    ];
    const ranked = rankUsers(users);
    expect(ranked[0].userId).toBe("b");
    expect(ranked[1].userId).toBe("a");
  });

  it("breaks ties by questions played", () => {
    const users: UserScore[] = [
      { userId: "a", name: "A", score: 0.8, questionsPlayed: 3, paidAt: new Date("2026-01-01") },
      { userId: "b", name: "B", score: 0.8, questionsPlayed: 5, paidAt: new Date("2026-01-01") },
    ];
    const ranked = rankUsers(users);
    expect(ranked[0].userId).toBe("b");
  });

  it("breaks further ties by earlier payment", () => {
    const users: UserScore[] = [
      { userId: "a", name: "A", score: 0.8, questionsPlayed: 5, paidAt: new Date("2026-01-15") },
      { userId: "b", name: "B", score: 0.8, questionsPlayed: 5, paidAt: new Date("2026-01-01") },
    ];
    const ranked = rankUsers(users);
    expect(ranked[0].userId).toBe("b");
  });

  it("does not mutate original array", () => {
    const users: UserScore[] = [
      { userId: "a", name: "A", score: 0.5, questionsPlayed: 5, paidAt: new Date() },
      { userId: "b", name: "B", score: 0.8, questionsPlayed: 5, paidAt: new Date() },
    ];
    rankUsers(users);
    expect(users[0].userId).toBe("a");
  });
});
