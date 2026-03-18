export const CATEGORIES = [
  "SPORTS",
  "CAMPUS",
  "ACADEMICS",
  "GREEK",
  "LAW_SCHOOL",
  "OTHER",
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  SPORTS: "Sports",
  CAMPUS: "Campus",
  ACADEMICS: "Academics",
  GREEK: "Greek Life",
  LAW_SCHOOL: "Law School",
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
  prize1stCents: 35000,
  prize2ndCents: 22500,
  prize3rdCents: 15000,
  prizeBonusCents: 10000,
  minParticipationPct: 70,
};

export const CATEGORY_EMOJI: Record<string, string> = {
  SPORTS: "🏆",
  CAMPUS: "🏛️",
  ACADEMICS: "📚",
  GREEK: "🏛️",
  LAW_SCHOOL: "⚖️",
  OTHER: "❓",
};

const KEYWORD_EMOJI: [RegExp, string][] = [
  // Forecaster / meta
  [/forecaster|forecast(?:ing)?|predict(?:ion)?|brier|leaderboard/i, "📊"],
  // Sports - specific (check before generic "win/beat")
  [/baseball/i, "⚾"],
  [/softball/i, "🥎"],
  [/basket/i, "🏀"],
  [/football|touchdown/i, "🏈"],
  [/soccer/i, "⚽"],
  [/tennis/i, "🎾"],
  [/lacrosse/i, "🥍"],
  [/golf/i, "⛳"],
  [/swim/i, "🏊"],
  [/track|cross.?country|marathon/i, "🏃"],
  [/wrestl/i, "🤼"],
  [/volleyball/i, "🏐"],
  [/hockey/i, "🏒"],
  [/rowing|crew/i, "🚣"],
  [/rugby/i, "🏉"],
  [/boxing|mma|fight/i, "🥊"],
  [/ski|snowboard/i, "⛷️"],
  [/cycling|bike/i, "🚴"],
  [/ncaa|tournament|march madness|playoff|championship/i, "🏆"],
  [/game|season|match|roster/i, "🏅"],
  // Law school
  [/\bbar\b.*passage|bar\s*exam/i, "⚖️"],
  [/moot\s*court/i, "🏛️"],
  [/law\s*review|journal|law\s*rev/i, "📜"],
  [/clerk/i, "👨‍⚖️"],
  [/\b1l\b|\b2l\b|\b3l\b|law\s*school|law\s*student/i, "⚖️"],
  [/sba|student\s*bar/i, "🤝"],
  [/mock\s*trial.*law|thurgood|blsa/i, "⚖️"],
  // Weather / nature
  [/rain|storm|weather|snow|hurricane|flood/i, "🌧️"],
  [/sun(?:ny)?|hot|heat|warm|temperature|\d+\s*[°]?\s*[fF]/i, "☀️"],
  [/cold|freeze|ice/i, "🥶"],
  // Campus life
  [/formal|dance|prom|ball\b/i, "💃"],
  [/party|frat|sorority|greek/i, "🎉"],
  [/concert|music|band|perform/i, "🎵"],
  [/food|dining|meal|coop|cafe|restaurant|eat/i, "🍽️"],
  [/construction|build|renovat/i, "🏗️"],
  [/parking|car|driv/i, "🚗"],
  [/election|vote|president|student.?gov|senate/i, "🗳️"],
  [/speaker|talk|lecture/i, "🎤"],
  [/library/i, "📖"],
  [/gym|fitness|workout/i, "💪"],
  [/movie|film|screen/i, "🎬"],
  [/travel|trip|spring break/i, "✈️"],
  [/club|organization|org\b/i, "🤝"],
  [/dog|pet|animal/i, "🐕"],
  [/email|announce|newsletter/i, "📧"],
  [/snow day|cancel.*class/i, "❄️"],
  // Academics
  [/exam|test|final|midterm/i, "📝"],
  [/grade|gpa|dean/i, "🎓"],
  [/class|course|professor|syllabus/i, "🏫"],
  [/graduat|commencement/i, "🎓"],
  [/research|paper|thesis/i, "🔬"],
  // Money / prizes
  [/money|price|cost|dollar|\$|tuition|fee/i, "💰"],
  [/sell|sold|buy|store|shop/i, "🛒"],
  // General
  [/record|break|streak/i, "🔥"],
  [/cancel/i, "🚫"],
  [/new|launch|open|start/i, "🚀"],
  [/poll|survey/i, "📋"],
  [/app|website|tech|software/i, "💻"],
  [/photo|picture|instagram/i, "📸"],
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
  LAW_SCHOOL: "bg-red-500/15 text-red-500",
  OTHER: "bg-zinc-500/15 text-zinc-400",
};
