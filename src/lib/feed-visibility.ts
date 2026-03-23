// Global signal to hide the feed instantly during navigation
let listeners: Set<() => void> = new Set();
let hidden = false;

export function hideFeed() {
  hidden = true;
  listeners.forEach((fn) => fn());
}

export function showFeed() {
  hidden = false;
}

export function isFeedHidden() {
  return hidden;
}

export function onFeedVisibilityChange(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
