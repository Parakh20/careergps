# Career GPS - Adaptive Decision Support for Career Growth

LINK- https://career-gps-ai-roadmap.vercel.app/

Career GPS is a deployable hackathon MVP that helps students think through career and learning decisions without pretending there is one guaranteed path.

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

- Single-page React app
- Clean responsive Tailwind UI
- Loading state during generation
- Clarification modal before final generation
- AI-generated adaptive follow-up questions
- Optional resume text textarea
- Modular Claude prompt and schema logic
- Vercel serverless API route
- Claude Haiku Messages API integration
- Built-in demo fallback if `CLAUDE_API_KEY` is missing
- Ethical layer that preserves user agency
- Clarification-first flow before Claude generation

## Tech Stack

- React with functional components
- Vite
- Tailwind CSS
- Lucide React icons
- Vercel serverless functions
- Anthropic Claude API, abstracted in `api/generate-roadmap.js` and `src/lib/careerPlan.js`

## Run Locally

Install Node.js 20 or newer, then run:

```bash
npm install
cp .env.example .env
npm run dev
```

Add your API key in `.env`:

```bash
CLAUDE_API_KEY=your_claude_api_key_here
CLAUDE_MODEL=claude-haiku-4-5-20251001
```

Open:

```text
http://localhost:5173
```

Plain Vite dev mode includes local middleware for `/api/generate-roadmap`, so `npm run dev` can call Claude directly.

## Deploy on Vercel

1. Push this folder to a GitHub repository.
2. Import the repository in Vercel.
3. Add environment variables in Vercel Project Settings:
   - `CLAUDE_API_KEY`
   - `CLAUDE_MODEL` optional, defaults to `claude-haiku-4-5-20251001`
4. Deploy.

Vercel will build the Vite app and serve the API route from `api/generate-roadmap.js`.

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

The serverless function uses Anthropic's Messages API with Claude Haiku 4.5 and tool-based structured JSON output. The prompt and JSON schema live in `src/lib/careerPlan.js`.

Official docs referenced:

- https://platform.claude.com/docs/en/api/overview
- https://platform.claude.com/docs/en/build-with-claude/working-with-messages
- https://platform.claude.com/docs/en/build-with-claude/structured-outputs
