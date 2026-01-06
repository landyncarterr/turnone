# TurnOne

Free racing performance report generator. Turn raw session data into coach-quality reports in under a minute.

## Features

- **AI-Powered Report Generation**: Uses OpenAI GPT-4 to generate professional 400-700 word reports
- **Structured Analysis**: Follows a strict professional structure with 6 key sections
- **PDF Export**: Download professional PDF reports ready for sharing
- **Clean UI**: Modern, responsive design with Tailwind CSS
- **Production Ready**: Optimized for Vercel deployment
- **Completely Free**: No authentication, no subscriptions, no limits

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **OpenAI API** (GPT-4)
- **jsPDF** (PDF generation)

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
Create a `.env.local` file with:

```bash
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_MOCK_MODE=false
```

**Mock Mode**: Set `NEXT_PUBLIC_MOCK_MODE=true` to test without OpenAI API key (uses sample data).

3. **Run development server:**
```bash
npm run dev
```

4. **Build for production:**
```bash
npm run build
npm start
```

## Deployment to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variable: `OPENAI_API_KEY`
4. Deploy

## Project Structure

```
app/
  ├── api/
  │   ├── generate-report/    # OpenAI report generation
  │   └── generate-pdf/        # PDF export
  ├── components/
  │   ├── SessionForm.tsx      # Input form
  │   └── ReportDisplay.tsx    # Report display
  ├── generate/                # Report generation page
  ├── lib/
  │   ├── prompts.ts           # System prompt
  │   └── mockMode.ts          # Mock data for testing
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

## Environment Variables

### Required
- `OPENAI_API_KEY` - Your OpenAI API key (get one at https://platform.openai.com)

### Optional
- `NEXT_PUBLIC_BASE_URL` - Your app URL (defaults to http://localhost:3000)
- `NEXT_PUBLIC_MOCK_MODE` - Set to `true` to use mock data instead of OpenAI (for testing)

## License

MIT License - Free to use and modify
