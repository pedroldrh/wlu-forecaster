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
