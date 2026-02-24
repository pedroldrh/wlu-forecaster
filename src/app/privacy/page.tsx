import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Forecaster",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 text-sm leading-relaxed text-muted-foreground">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Privacy Policy</h1>
        <p className="mt-1">Last updated: February 23, 2026</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">1. Data We Collect</h2>
        <p>When you sign in and use Forecaster, we collect:</p>
        <ul className="list-disc list-inside space-y-1.5 ml-2">
          <li>
            <strong className="text-foreground">Google account info:</strong> your name, email
            address, and profile picture, provided via Google OAuth when you sign in with your
            Google account.
          </li>
          <li>
            <strong className="text-foreground">Forecasting activity:</strong> every forecast you
            submit (probability, timestamp, market), your comments, and your scores.
          </li>
          <li>
            <strong className="text-foreground">Push notification tokens:</strong> if you opt in to
            push notifications, we store the device token needed to send you alerts.
          </li>
          <li>
            <strong className="text-foreground">Basic usage data:</strong> pages visited, referral
            source (e.g. <code>?ref=</code> parameters from shared links).
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">2. How We Use Your Data</h2>
        <ul className="list-disc list-inside space-y-1.5 ml-2">
          <li>Running the game: scoring forecasts, computing leaderboards, awarding prizes</li>
          <li>Displaying your profile and activity to other users (display name, forecasts, comments)</li>
          <li>Sending push notifications you&apos;ve opted in to (new markets, resolutions, prizes)</li>
          <li>Improving the platform and fixing bugs</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">3. Display Name Privacy</h2>
        <p>
          When you first sign in, you are assigned a random anonymous display name. Your real name
          and email are never shown publicly. Other players only see your display name, avatar,
          forecasts, and comments.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">4. Data Storage</h2>
        <p>
          Your data is stored in <strong className="text-foreground">Supabase</strong> (database and
          authentication) and served through <strong className="text-foreground">Vercel</strong> (hosting).
          Both services host data in the United States. We use industry-standard security practices
          including encrypted connections (HTTPS/TLS) and row-level security on our database.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">5. Cookies &amp; Local Storage</h2>
        <p>
          Forecaster uses cookies and browser local storage for:
        </p>
        <ul className="list-disc list-inside space-y-1.5 ml-2">
          <li>
            <strong className="text-foreground">Authentication:</strong> Supabase session cookies to
            keep you signed in
          </li>
        </ul>
        <p>We do not use advertising or tracking cookies.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">6. Third-Party Services</h2>
        <p>We use the following third-party services that may process your data:</p>
        <ul className="list-disc list-inside space-y-1.5 ml-2">
          <li><strong className="text-foreground">Google OAuth</strong> — authentication</li>
          <li><strong className="text-foreground">Supabase</strong> — database, auth, and storage</li>
          <li><strong className="text-foreground">Vercel</strong> — hosting and serverless functions</li>
        </ul>
        <p>
          Each service has its own privacy policy. We do not sell your data to any third party.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">7. Data Retention</h2>
        <p>
          We retain your data for as long as your account is active. Forecast history and scores are
          kept to maintain leaderboard integrity. If you request deletion (see below), we will remove
          your personal data within 30 days, though anonymized aggregate scores may be retained.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">8. Your Rights</h2>
        <p>You can:</p>
        <ul className="list-disc list-inside space-y-1.5 ml-2">
          <li>Change your display name at any time from your profile</li>
          <li>Opt out of push notifications through your browser or device settings</li>
          <li>Request a copy of your data</li>
          <li>Request deletion of your account and personal data</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">9. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy as needed. Continued use of Forecaster after changes are
          posted constitutes acceptance. Material changes will be announced on the platform.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">10. Contact</h2>
        <p>
          A dedicated contact email for Forecaster will be available soon. In the meantime, if you
          need to request data deletion or have privacy questions, reach out through the platform.
        </p>
      </section>
    </div>
  );
}
