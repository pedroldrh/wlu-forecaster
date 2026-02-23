import webPush from "web-push";

let configured = false;

export function getWebPush() {
  if (!configured) {
    webPush.setVapidDetails(
      process.env.VAPID_SUBJECT!,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );
    configured = true;
  }
  return webPush;
}
