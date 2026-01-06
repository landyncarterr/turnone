# TurnOne

TurnOne turns raw session data into coach-quality racing performance reports in under a minute. Built for racing performance engineers and driver coaches.

## Features

- **AI-Powered Report Generation**: Uses OpenAI GPT-4 to generate professional 400-700 word reports
- **Structured Analysis**: Follows a strict professional structure with 6 key sections
- **PDF Export**: Download professional PDF reports ready for sharing
- **Stripe Subscriptions**: Two-tier pricing ($29/month for 10 reports, $49/month unlimited)
- **Clean UI**: Modern, responsive design with Tailwind CSS
- **Production Ready**: Optimized for Vercel deployment

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **OpenAI API** (GPT-4)
- **Stripe** (Subscriptions)
- **jsPDF** (PDF generation)

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
Copy `.env.example` to `.env.local` and fill in your keys:
```bash
cp .env.example .env.local
```

Required environment variables:
- `OPENAI_API_KEY` - Your OpenAI API key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Same as above (for client-side)
- `STRIPE_PRICE_ID_BASIC` - Stripe price ID for $29/month plan
- `STRIPE_PRICE_ID_PRO` - Stripe price ID for $49/month plan
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `NEXT_PUBLIC_BASE_URL` - Your app URL (e.g., http://localhost:3000)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID (for authentication)
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `NEXTAUTH_URL` - Your app URL (e.g., http://localhost:3000)
- `NEXTAUTH_SECRET` - Random secret for NextAuth (generate with `openssl rand -base64 32`)
- `FREE_PRO_EMAILS` - Comma-separated list of emails for free Pro access (optional)

**Free Pro Access**: Add emails to `FREE_PRO_EMAILS` (comma-separated) to grant free Pro access.

3. **Set up Stripe:**
   - Create two products in Stripe Dashboard:
     - Basic: $29/month recurring
     - Pro: $49/month recurring
   - Copy the Price IDs to your `.env.local`
   - Set up webhook endpoint: `https://your-domain.com/api/webhook`
   - Copy webhook secret to `.env.local`

4. **Run development server:**
```bash
npm run dev
```

5. **Build for production:**
```bash
npm run build
npm start
```

## Deployment to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add all environment variables in Vercel dashboard
4. Deploy

## Project Structure

```
app/
  ├── api/
  │   ├── generate-report/    # OpenAI report generation
  │   ├── generate-pdf/        # PDF export
  │   ├── create-checkout/     # Stripe checkout
  │   ├── check-subscription/  # Subscription verification
  │   └── webhook/             # Stripe webhooks
  ├── components/
  │   ├── SessionForm.tsx      # Input form
  │   ├── ReportDisplay.tsx    # Report display
  │   └── Pricing.tsx          # Pricing component
  ├── generate/                # Report generation page
  ├── lib/
  │   ├── prompts.ts           # System prompt
  │   └── stripe.ts            # Stripe configuration
  └── page.tsx                 # Landing page
```

## Report Structure

Each generated report includes:
1. Session Overview
2. Performance Summary
3. Key Observations (3-5 bullet points)
4. Time Gain Opportunities
5. Recommendations for Next Session
6. Target Goals for Next Session

## License

Private project - All rights reserved
