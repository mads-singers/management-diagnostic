# Management Diagnostic Tool

## Overview
A web-based management diagnostic quiz for **Mads Singers Management**. Managers answer 12 scenario-based questions across 6 categories, capture their email (lead gen), and receive a visual scorecard with a radar chart, color-coded ratings, and actionable tips.

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
    └── questions.json  # All quiz content: questions, options, scores, result descriptions, tips
```

## How to Edit Quiz Content
Edit `data/questions.json` — no code changes needed. Structure:
- `categories[]` — 6 categories, each with `id`, `name`, `icon`
- Each category has `questions[]` (2 per category) with `text` and `options[]` (4 options, each with `text` and `score` 1-4)
- Each category has `results` with `low`/`mid`/`high` tiers containing `range`, `title`, `description`, and `tips[]`
- `config` section has brand name, CTA text/URL, and team size options

## 6 Quiz Categories
1. **Delegation** — bottleneck vs multiplier
2. **1-on-1 Meetings** — structured regular meetings
3. **Time & Priorities** — time management and saying no
4. **Hiring & Team Building** — hiring process and performance management
5. **Feedback & Communication** — giving direct, timely feedback
6. **Goal Setting & Accountability** — clear goals and follow-through

## Go High Level Integration
In `js/diagnostic.js` there's a commented-out `submitToGHL()` function. To connect:
1. Uncomment the function
2. Replace `YOUR_GHL_WEBHOOK_URL` with the actual GHL webhook URL
3. Call `submitToGHL(userData, teamSize, computeScores())` in the email form submit handler (the comment marks where)
The payload includes: name, email, company, teamSize, all category scores, overallScore, completedAt timestamp.

## Branding & Colors
All customizable via CSS variables in `css/styles.css`:
- `--color-bg-primary` / `--color-bg-secondary` — dark background colors
- `--color-accent` / `--color-accent-secondary` — cyan/violet accent colors
- `--gradient-accent` — gradient used for buttons, text highlights, chart
- `--color-red` / `--color-amber` / `--color-green` — result card rating colors
- Brand name appears in nav bars and footer (search "Mads Singers" to update)

## User Flow
1. **Landing page** (`index.html`) → CTA links to `diagnostic.html`
2. **Intro step** — select team size → Start Diagnostic
3. **Questions** — 12 questions, one at a time, auto-advances on click, progress bar, back button
4. **Email capture** — name + email + company (optional) gate before results
5. **Results** — radar chart, overall score, focus areas callout, 6 color-coded category cards with tips, CTA to book a call

## Deployment
- Push to `master` on GitHub → Netlify auto-deploys
- No build command needed (static site)
- `git push` from this directory is all it takes

## What's NOT Included (possible future additions)
- Backend/database (emails need GHL webhook or Formspree)
- PDF export of results
- Analytics tracking
- CRM integration beyond GHL webhook
