# Management Diagnostic Tool

## Overview
A web-based management diagnostic quiz for **Mads Singers Management**. Business owners answer 20 Yes/No questions across 4 categories, provide business info, capture their email (lead gen), and receive a visual scorecard with a radar chart, color-coded ratings, and personalized report text.

**Live site:** https://management-diagnostic.netlify.app/
**Repo:** https://github.com/mads-singers/management-diagnostic

## Tech Stack
- Plain HTML + Tailwind CSS (CDN) + Vanilla JavaScript — no build tools, no frameworks
- Chart.js (CDN) for radar chart visualization
- Deployed on Netlify, auto-deploys from GitHub on every push to `master`

## File Structure
```
management-diagnostic/
├── index.html          # Landing page (hero, features, how-it-works, CTAs)
├── diagnostic.html     # Quiz flow — 4-step single page (intro → questions → email → results)
├── css/
│   └── styles.css      # Custom styles on top of Tailwind (CSS variables for branding)
├── js/
│   └── diagnostic.js   # Quiz engine: loads questions, scoring, Chart.js radar, result cards
└── data/
    └── questions.json  # All quiz content: questions, scoring, result descriptions (easy to edit)
```

## How to Edit Quiz Content
Edit `data/questions.json` — no code changes needed. Structure:
- `businessInfo[]` — 4 intro questions (team size, work location, years running, revenue). Revenue is scored (0/5/10) but not shown on results page.
- `categories[]` — 4 scored categories, each with `id`, `name`, `icon`
- Each category has `questions[]` (5 per category) — Yes/No format, Yes = 10 points, No = 0
- Each category has `results` with `low`/`mid`/`high` tiers containing `range`, `title`, and `description`
- Scoring: 0-50 per category (5 questions x 10 points). Red: 0-20, Amber: 21-40, Green: 41-50
- `config` section has brand name, CTA text/URL, scorePerQuestion, maxScorePerCategory

## 4 Quiz Categories (5 questions each)
1. **Team Management** — mission clarity, 1:1s, performance reviews, goals, feedback culture
2. **Delegation** — owner dependency, staff growth, strengths awareness, strategic vs tactical work
3. **Hiring** — job definitions, hiring authority, retention, performance, documented process
4. **Measuring Success** — KPIs/OKRs, CAC/LTV, revenue tracking, conversion rates, employee KPIs

## Business Info (Intro Step, not scored in results)
- Team size (5 or less / 6-15 / 16-50 / 50+)
- Work location (Office / Remote / Mix)
- Years running (Less than 1 year / 1-3 / 3-5 / 5+)
- Revenue level (0-100k / 100k-500k / 500k-2m / 2m+) — scored for GHL but not shown on radar

## Go High Level Integration
In `js/diagnostic.js` there's a commented-out `submitToGHL()` function. To connect:
1. Uncomment the function
2. Replace `YOUR_GHL_WEBHOOK_URL` with the actual GHL webhook URL
3. Call `submitToGHL(userData, businessInfoAnswers, computeScores())` in the email form submit handler
The payload includes: name, email, company, teamSize, workLocation, yearsRunning, revenue, all category scores, overallScore, completedAt timestamp.

## Branding & Colors
All customizable via CSS variables in `css/styles.css`:
- `--color-bg-primary` / `--color-bg-secondary` — dark background colors
- `--color-accent` / `--color-accent-secondary` — cyan/violet accent colors
- `--gradient-accent` — gradient used for buttons, text highlights, chart
- `--color-red` / `--color-amber` / `--color-green` — result card rating colors
- Brand name appears in nav bars and footer (search "Mads Singers" to update)

## User Flow
1. **Landing page** (`index.html`) → CTA links to `diagnostic.html`
2. **Intro step** — answer 4 business info questions (all required) → Start Diagnostic
3. **Questions** — 20 Yes/No questions, one at a time, big Yes/No cards, auto-advances, progress bar, back button
4. **Email capture** — name + email + company (optional) gate before results
5. **Results** — radar chart, overall score out of 200, focus areas callout, 4 color-coded category cards with report text, CTA to book a call

## Deployment
- Push to `master` on GitHub → Netlify auto-deploys
- No build command needed (static site)
- `git push` from this directory is all it takes

## What's NOT Included (possible future additions)
- Backend/database (emails need GHL webhook or Formspree)
- PDF export of results
- Analytics tracking
- CRM integration beyond GHL webhook
