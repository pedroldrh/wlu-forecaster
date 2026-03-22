import { redirect } from "next/navigation";

export const metadata = {
  title: "Swipe — Forecaster",
  description: "Swipe through markets and vote YES or NO.",
};

export default function SwipePage() {
  redirect("/");
}
