# Forecaster — W&L Campus Forecasting Tournament

A campus forecasting tournament web app for Washington and Lee University. Students pay a one-time entry fee, submit probability forecasts on binary campus questions, get scored with Brier scoring, and compete on a leaderboard for end-of-season prizes.

## Tech Stack

- **Framework**: Next.js 16 (App Router), TypeScript
- **UI**: TailwindCSS v4 + shadcn/ui
- **ORM/DB**: Prisma + PostgreSQL (Neon)
- **Auth**: NextAuth.js v5 (Auth.js) with GitHub OAuth
- **Payments**: Stripe Checkout
- **Charts**: Recharts
- **Testing**: Vitest
- **Deploy**: Vercel

## Local Development

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database (free tier)
- A [GitHub OAuth App](https://github.com/settings/developers)
- A [Stripe](https://stripe.com) account (test mode)

### Setup

1. **Clone and install**:
   ```bash
   git clone https://github.com/pedroldrh/wlu-forecaster.git
   cd wlu-forecaster
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Fill in your values:
   - `DATABASE_URL` — Neon connection string
   - `NEXTAUTH_SECRET` — Generate with `openssl rand -base64 32`
   - `GITHUB_ID` / `GITHUB_SECRET` — From your GitHub OAuth App
   - `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` — From Stripe dashboard
   - `STRIPE_WEBHOOK_SECRET` — From Stripe CLI (see below)

3. **Run database migrations**:
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Seed the database** (creates admin user, sample season, and questions):
   ```bash
   npm run db:seed
   ```

5. **Start the dev server**:
   ```bash
   npm run dev
   ```

### Stripe Webhooks (Local)

In a separate terminal, run the Stripe CLI to forward webhooks:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the `whsec_...` secret it prints and add it to `.env` as `STRIPE_WEBHOOK_SECRET`.

**Testing payments**: Use card number `4242 4242 4242 4242` with any future expiry and CVC.

**Apple Pay**: Appears automatically when the browser supports it (Safari on macOS/iOS). In test mode, use the test card flow.

### Prisma Studio

Browse your database visually:

```bash
npm run db:studio
```

## How It Works

### For Students

1. **Sign in** with GitHub (must have @mail.wlu.edu email linked for tournament participation)
2. **Join a season** by paying the entry fee via Stripe
3. **Browse questions** and submit probability forecasts (0-100%)
4. **Update forecasts** before the question closes
5. **Check the leaderboard** to see your ranking
6. **View your profile** for stats and calibration chart

### For Admins

1. **Create seasons** (name, dates, entry fee)
2. **Create questions** (title, description, category, close/resolve times)
3. **Resolve questions** as YES or NO — scores update automatically
4. **Export winners** as CSV when the season ends
5. **Finalize seasons** to lock in final rankings

### Scoring

- **Brier Score** = (probability - outcome)² — lower is better
- **Points** = 1 - Brier Score — higher is better (0-100%)
- **Season Score** = average points across all resolved forecasts
- **Tiebreakers**: more questions answered > earlier entry payment

## Testing

Run the scoring engine unit tests:

```bash
npm test
```

## Deployment (Vercel)

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.example`
4. Set `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to your production URL
5. Deploy

## Alternative: Docker Postgres

If you prefer local Postgres over Neon:

```bash
docker compose up -d
```

Then set `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/wlu-forecaster` in `.env`.

## Project Structure

```
src/
├── app/           # Next.js App Router pages
│   ├── (auth)/    # Sign-in page
│   ├── admin/     # Admin dashboard, season/question management, export
│   ├── api/       # Auth + Stripe webhook routes
│   ├── join/      # Season join + payment flow
│   ├── leaderboard/
│   ├── questions/ # Question list + detail with forecast submission
│   └── u/         # User profiles
├── actions/       # Server actions (forecasts, seasons, questions, stripe, export)
├── components/    # Shared UI components
├── lib/           # Core utilities (auth, prisma, stripe, scoring)
└── types/         # TypeScript type extensions
```
