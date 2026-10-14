# Career GPS - Adaptive Decision Support for Career Growth

[![CI](https://github.com/Parakh20/careergps/actions/workflows/ci.yml/badge.svg)](https://github.com/Parakh20/careergps/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Live demo:** https://career-gps-ai-roadmap.vercel.app/

Career GPS is an AI-assisted web app that helps students think through career and learning decisions without pretending there is one guaranteed path.

## Problem

Students often know a goal they are curious about, but they may not know what skills matter, what risks to watch, which alternatives are valid, or how to adjust if a plan feels wrong.

## Solution

The app first asks for the student's current year, current skills, target role or goal, and weekly time availability. It then asks six quick clarification questions before generating:

- situation understanding
- skill gap analysis
- 4-week primary plan
- adaptive adjustment notes
- project options
- reasoning transparency and assumptions
- confidence analysis and uncertainty
- risks and failure modes
- failure scenarios and timeline reality
- alternative paths and tradeoffs
- user reflection questions
- ethical safeguards

## Features

- Single-page React app with a responsive Tailwind UI
- Clarification-first flow: AI-generated adaptive follow-up questions before the plan is generated
- Optional resume text input
- Structured plan generation with Claude tool use (JSON schema in `src/lib/careerPlan.js`)
- Built-in demo generator when no Claude API key is configured or the API call fails
- Plan adaptation ("Too hard", "Too easy", "Not interested", "Give alternative")
- Week-by-week task checklist with progress tracking
- Copy the plan as Markdown or export it as a PDF (`html2pdf.js`)
- Optional accounts via Supabase Auth: email/password, Google and GitHub OAuth
- Dashboard of saved plans (reopen, delete) for signed-in users
- Shareable read-only links (`?plan=<share_token>`)
- Serverless API guards: origin allow-list (CORS), POST-only, JSON validation, 200 KB body limit and a per-IP rate limit (8 requests/minute, in-memory)
- Ethical layer that preserves user agency

## Tech Stack

- React 19, Vite 7, Tailwind CSS, Lucide React icons
- Vercel serverless functions (`api/`)
- Anthropic Claude Messages API:
  - `api/generate-roadmap.js`: `claude-sonnet-4-6` with extended thinking and prompt caching
  - `api/generate-questions.js`: `claude-haiku-4-5-20251001`
- Supabase (Postgres + Auth) with row-level security, migrations in `supabase/migrations/`
- Vitest for unit and API handler tests, ESLint

## Run Locally

Requires Node.js 20 or newer.

```bash
npm ci
cp .env.example .env   # add your keys; every variable is optional for a demo run
npm run dev            # http://localhost:5173
```

`npm run dev` serves `/api/generate-roadmap` and `/api/generate-questions` through local Vite
middleware (see `vite.config.js`), so the full flow works without the Vercel CLI.

### Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `CLAUDE_API_KEY` (or `ANTHROPIC_API_KEY`) | server | Claude API access. Without it, the built-in demo generator is used. |
| `VITE_SUPABASE_URL` | client | Supabase project URL. Without it, accounts and saved plans are disabled. |
| `VITE_SUPABASE_ANON_KEY` | client | Supabase anon key (public by design; data access is enforced by RLS). |

### Supabase setup (optional)

Apply the SQL files in `supabase/migrations/` in order (e.g. `supabase db push`, or paste them into the SQL editor),
then enable the Email, Google and GitHub providers you want under Authentication.

The `Supabase Migrations` workflow applies migrations on pushes to `main` that touch `supabase/migrations/`,
once a `SUPABASE_DB_URL` repository secret is configured; without the secret it skips with a warning.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server with local API middleware |
| `npm run dev:vercel` | Run through `vercel dev` |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | ESLint |
| `npm test` | Vitest: plan normalization/validation, fallback generator, API guards and handlers |

Tests never call the real Claude API: keys are blanked and `fetch` is mocked, including the
success and error paths of the roadmap endpoint.

## Deploy on Vercel

1. Import the repository in Vercel.
2. Add `CLAUDE_API_KEY`, `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Project Settings.
3. Deploy. Vercel builds the Vite app and serves the functions in `api/`; `vercel.json` rewrites
   all other routes to `index.html`.

If you deploy under a different domain, add it to `ALLOWED_ORIGINS` in `api/_shared.js`.

## Sample Test Input

```json
{
  "year": "2nd year",
  "skills": "Python basics, HTML, CSS, Git, simple SQL",
  "targetRole": "Machine Learning Engineer",
  "hoursPerWeek": "8",
  "experienceChecks": ["Worked with datasets"],
  "projectDescription": "Built a small marks predictor using pandas and linear regression.",
  "learningPreference": "Mix of both",
  "immediateGoal": "Internship (3-6 months)",
  "domainInterest": "Not sure",
  "mainBlocker": "Consistency"
}
```

## Sample Output Shape

```json
{
  "situation_understanding": "You appear to be exploring ML Engineering with some foundations and limited weekly time.",
  "skill_gap": [
    {
      "skill": "Statistics basics",
      "status": "missing",
      "importance": "high",
      "reason": "It helps evaluate models, though depth varies by role."
    }
  ],
  "primary_plan": {
    "week1": {
      "focus": "Clarify the target and foundations",
      "tasks": ["Compare role descriptions", "Revise core fundamentals", "Create a progress repo"],
      "why": "This keeps the plan grounded before deeper investment."
    }
  },
  "adaptive_adjustment": {
    "based_on_inputs": "The plan uses the clarification answers and weekly time constraint.",
    "changes_made": ["No feedback was provided, so this is an initial plan."],
    "tradeoffs": ["A smaller plan is easier to finish but less comprehensive."]
  },
  "projects": [
    {
      "name": "Student Performance Predictor",
      "why_this_project": "It tests data cleaning, modeling, evaluation, and uncertainty communication.",
      "skills_covered": ["Python", "Pandas", "Model evaluation"]
    }
  ],
  "reasoning_transparency": {
    "why_this_path": "The path balances fundamentals, proof of work, feedback, and comparison.",
    "assumptions": ["The stated weekly time can be protected consistently."]
  },
  "confidence_analysis": {
    "score": 72,
    "uncertainty_reasons": "Interests, project depth, and local opportunities are unknown.",
    "what_would_improve": "Mentor feedback and a past project would improve fit."
  },
  "risk_and_failure_modes": [
    {
      "risk": "Tutorials replace building.",
      "likelihood": "medium",
      "mitigation": "Publish small weekly artifacts."
    }
  ],
  "alternative_paths": [
    {
      "option": "Data Analyst",
      "why_valid": "It may use Python and SQL sooner.",
      "tradeoffs": "You gain faster evidence but move slightly away from ML engineering."
    }
  ],
  "user_reflection": {
    "decisions_user_must_make": ["Decide whether the goal still feels interesting."],
    "questions_to_consider": ["Do you enjoy the work style, not only the title?"]
  },
  "failure_scenarios": [
    "Most users drop after week 2 due to overload.",
    "Skipping projects leads to weak portfolio evidence."
  ],
  "timeline_reality": "This 4-week plan builds foundation, not job readiness. Typical timeline is 3-6 months.",
  "adaptation_prompt": {
    "message": "If this plan feels too hard, too easy, or misaligned, you can adjust it.",
    "options": ["Too hard", "Too easy", "Not interested", "Give alternative"]
  },
  "ethical_layer": {
    "limitations": "This system has uncertainty and may not reflect real hiring conditions.",
    "uncertainty": "Outcomes depend on many external factors.",
    "user_agency": "Final decisions must be made by the user.",
    "suggestion": "Consult mentors or professionals for validation."
  }
}
```

## Ethical Considerations

- The app provides decision support, not guaranteed career advice.
- It avoids deterministic claims such as promising jobs or internships.
- It highlights uncertainty, risks, assumptions, and alternatives.
- It keeps final decisions with the user.

## Claude Implementation Notes

The roadmap function calls the Messages API with `claude-sonnet-4-6`, extended thinking and a
`create_career_plan` tool whose input schema enforces the JSON shape above; responses are
normalized by `normalizePlan` so missing sections fall back to safe defaults. The adaptive
questions function uses `claude-haiku-4-5-20251001` with a forced tool call. Prompts and
schemas live in `src/lib/careerPlan.js` and `api/`.

Official docs referenced:

- https://platform.claude.com/docs/en/api/overview
- https://platform.claude.com/docs/en/build-with-claude/working-with-messages
- https://platform.claude.com/docs/en/build-with-claude/structured-outputs

## License

[MIT](LICENSE) © 2026 Parakh Sharma
