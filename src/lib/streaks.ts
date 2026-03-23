import { TIMEZONE } from "@/lib/constants";

function toETDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: TIMEZONE });
}

function todayET(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: TIMEZONE });
}

function prevDay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export interface StreakInfo {
  current: number;
  longest: number;
  votedToday: boolean;
}

export function computeStreak(submittedDates: string[]): StreakInfo {
  if (submittedDates.length === 0) {
    return { current: 0, longest: 0, votedToday: false };
  }

  const days = new Set(submittedDates.map(toETDate));
  const today = todayET();
  const votedToday = days.has(today);

  // Current streak: walk backward from today (or yesterday if not voted today)
  let current = 0;
  let cursor = votedToday ? today : prevDay(today);

  // If they didn't vote today AND didn't vote yesterday, streak is 0
  if (!votedToday && !days.has(cursor)) {
    current = 0;
  } else {
    while (days.has(cursor)) {
      current++;
      cursor = prevDay(cursor);
    }
  }

  // Longest streak: sort all dates and find max consecutive run
  const sorted = [...days].sort();
  let longest = 0;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const expected = prevDay(sorted[i]);
    if (expected === sorted[i - 1]) {
      run++;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
  }
  if (sorted.length > 0 && run > longest) longest = run;
  if (sorted.length === 1) longest = 1;

  return { current, longest, votedToday };
}
