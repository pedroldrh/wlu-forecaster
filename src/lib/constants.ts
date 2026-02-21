export const CATEGORIES = [
  "SPORTS",
  "CAMPUS",
  "ACADEMICS",
  "GREEK",
  "OTHER",
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  SPORTS: "Sports",
  CAMPUS: "Campus",
  ACADEMICS: "Academics",
  GREEK: "Greek Life",
  OTHER: "Other",
};

export const SEASON_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  LIVE: "Live",
  ENDED: "Ended",
  PAYOUTS_SENT: "Payouts Sent",
};

export const QUESTION_STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  CLOSED: "Closed",
  RESOLVED: "Resolved",
};

export const TIMEZONE = "America/New_York";

export const PRIZE_TYPE_LABELS: Record<string, string> = {
  "1ST": "1st Place",
  "2ND": "2nd Place",
  "3RD": "3rd Place",
  BONUS: "Single-Question Bonus",
};

export const DEFAULT_PRIZES = {
  prize1stCents: 60000,
  prize2ndCents: 25000,
  prize3rdCents: 15000,
  prizeBonusCents: 5000,
  minParticipationPct: 70,
};

export const CATEGORY_EMOJI: Record<string, string> = {
  SPORTS: "⚾",
  CAMPUS: "🏛️",
  ACADEMICS: "📚",
  GREEK: "🏛️",
  OTHER: "❓",
};

export const CATEGORY_COLORS: Record<string, string> = {
  SPORTS: "bg-blue-500/15 text-blue-500",
  CAMPUS: "bg-purple-500/15 text-purple-500",
  ACADEMICS: "bg-amber-500/15 text-amber-500",
  GREEK: "bg-emerald-500/15 text-emerald-500",
  OTHER: "bg-zinc-500/15 text-zinc-400",
};
