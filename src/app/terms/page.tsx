import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — Forecaster",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 text-sm leading-relaxed text-muted-foreground">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Terms of Service</h1>
        <p className="mt-1">Last updated: February 23, 2026</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">1. What Forecaster Is</h2>
        <p>
          Forecaster is a free campus forecasting game operated at Washington &amp; Lee University.
          Players assign probabilities to real-world campus events and are scored on the accuracy of
          their predictions using the Brier scoring rule. Top forecasters win cash prizes at the end
          of each biweekly cycle.
        </p>
        <p>
          <strong className="text-foreground">Forecaster is not gambling.</strong> There is no entry
          fee, wager, or purchase required to play. You do not risk any money. Prizes are funded
          entirely by the operator and awarded based on forecasting skill.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">2. Eligibility</h2>
        <p>
          To use Forecaster you must be a current student at Washington &amp; Lee University.
          You can sign in with any Google account (including your personal Gmail). By signing in,
          you confirm that you are a current W&amp;L student.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">3. How Forecasting Works</h2>
        <p>
          Each market poses a yes/no question about a future campus event. You submit a probability
          (0&ndash;100%) representing your confidence that the event will happen. You may update your
          forecast as many times as you like before the market closes. Only your most recent forecast
          counts toward scoring.
        </p>
        <p>
          After a market closes, the operator resolves it as YES or NO based on the stated
          resolution criteria. Your score is calculated using the Brier scoring formula. See the{" "}
          <Link href="/how-it-works" className="text-primary underline underline-offset-2">
            How It Works
          </Link>{" "}
          page for details.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">4. Prizes</h2>
        <p>
          Prizes are awarded to the top forecasters at the end of each biweekly season cycle. Prize
          amounts are displayed on the How It Works page and may change between cycles. To qualify
          for prizes you must forecast on the minimum number of markets required for that cycle
          (currently 5).
        </p>
        <p>
          Prizes are paid via Venmo, Zelle, or another method at the operator&apos;s discretion.
          The operator reserves the right to withhold prizes if a player has violated these Terms.
          Prizes are subject to any applicable tax obligations, which are the recipient&apos;s
          responsibility.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">5. Prohibited Conduct</h2>
        <p>You agree not to:</p>
        <ul className="list-disc list-inside space-y-1.5 ml-2">
          <li>Create or operate multiple accounts</li>
          <li>Use bots, scripts, or automated tools to submit forecasts</li>
          <li>Collude with other players to manipulate scores or outcomes</li>
          <li>Deliberately manipulate real-world events to affect market outcomes</li>
          <li>Harass other users in comments or elsewhere on the platform</li>
          <li>Attempt to exploit bugs or vulnerabilities rather than reporting them</li>
        </ul>
        <p>
          Violation of these rules may result in account suspension, disqualification from prizes,
          or permanent ban at the operator&apos;s sole discretion.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">6. Disputes &amp; Resolutions</h2>
        <p>
          If you believe a market was resolved incorrectly, you may submit a dispute through the
          market page within 48 hours of resolution. The operator will review disputes and make a
          final determination. Resolution decisions are at the operator&apos;s sole discretion.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">7. Disclaimers</h2>
        <p>
          Forecaster is provided &quot;as is&quot; without warranties of any kind. We do not guarantee
          uptime, accuracy of scoring, or availability of prizes. The platform may be modified,
          suspended, or discontinued at any time without notice.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">8. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, the operator of Forecaster shall not be liable for
          any indirect, incidental, or consequential damages arising from your use of the platform.
          Total liability is limited to the amount of any prize you were owed but did not receive.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">9. Changes to These Terms</h2>
        <p>
          We may update these Terms at any time. Continued use of Forecaster after changes are posted
          constitutes acceptance of the updated Terms. Material changes will be announced on the
          platform.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">10. Contact</h2>
        <p>
          A dedicated contact email for Forecaster will be available soon. In the meantime, if you
          have questions about these Terms, reach out through the platform.
        </p>
      </section>
    </div>
  );
}
