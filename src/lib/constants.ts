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
  SPORTS: "🏆",
  CAMPUS: "🏛️",
  ACADEMICS: "📚",
  GREEK: "🏛️",
  OTHER: "❓",
};

const KEYWORD_EMOJI: [RegExp, string][] = [
  // Sports - specific
  [/baseball/i, "⚾"],
  [/softball/i, "🥎"],
  [/basket/i, "🏀"],
  [/football|touchdown/i, "🏈"],
  [/soccer|goal\s/i, "⚽"],
  [/tennis/i, "🎾"],
  [/lacrosse/i, "🥍"],
  [/golf/i, "⛳"],
  [/swim/i, "🏊"],
  [/track|cross.?country|marathon|run/i, "🏃"],
  [/wrestl/i, "🤼"],
  [/volleyball/i, "🏐"],
  [/hockey/i, "🏒"],
  [/rowing|crew/i, "🚣"],
  [/ncaa|tournament|march madness|playoff/i, "🏆"],
  // Weather / nature
  [/rain|storm|weather|snow|hurricane|flood/i, "🌧️"],
  [/sun|hot|heat|warm/i, "☀️"],
  [/cold|freeze|ice/i, "🥶"],
  // Campus life
  [/formal|dance|prom|ball/i, "💃"],
  [/party|frat|sorority|greek/i, "🎉"],
  [/concert|music|band|show/i, "🎵"],
  [/food|dining|meal|coop|cafe|restaurant/i, "🍽️"],
  [/construction|build|renovate/i, "🏗️"],
  [/park|lot|car/i, "🚗"],
  [/election|vote|president|student.?gov/i, "🗳️"],
  [/speaker|talk|lecture|event/i, "🎤"],
  [/library/i, "📖"],
  [/gym|fitness|workout/i, "💪"],
  // Academics
  [/exam|test|final|midterm/i, "📝"],
  [/grade|gpa|dean/i, "🎓"],
  [/class|course|professor/i, "🏫"],
  [/graduat/i, "🎓"],
  // Money / prizes
  [/money|price|cost|dollar|\$/i, "💰"],
  [/sell|sold|buy/i, "💵"],
  // General
  [/win|beat|defeat/i, "🏅"],
  [/record|break|streak/i, "🔥"],
  [/cancel/i, "🚫"],
  [/open|launch|start/i, "🚀"],
  [/close|end|shut/i, "🔒"],
];

/** Pick an emoji based on the question title, falling back to category emoji */
export function getQuestionEmoji(title: string, category: string): string {
  for (const [pattern, emoji] of KEYWORD_EMOJI) {
    if (pattern.test(title)) return emoji;
  }
  return CATEGORY_EMOJI[category] || "❓";
}

export const CATEGORY_COLORS: Record<string, string> = {
  SPORTS: "bg-blue-500/15 text-blue-500",
  CAMPUS: "bg-purple-500/15 text-purple-500",
  ACADEMICS: "bg-amber-500/15 text-amber-500",
  GREEK: "bg-emerald-500/15 text-emerald-500",
  OTHER: "bg-zinc-500/15 text-zinc-400",
};
