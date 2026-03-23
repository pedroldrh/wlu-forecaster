// Hide the feed via direct DOM manipulation — synchronous, same frame
export function hideFeed() {
  const el = document.getElementById("swipe-feed");
  if (el) el.style.display = "none";
}

export function showFeed() {
  const el = document.getElementById("swipe-feed");
  if (el) el.style.display = "";
}
