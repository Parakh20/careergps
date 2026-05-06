const weekSchema = {
  type: "object",
  additionalProperties: false,
  required: ["focus", "tasks", "why"],
  properties: {
    focus: { type: "string" },
    tasks: {
      type: "array",
      items: { type: "string" }
    },
    why: { type: "string" }
  }
};

export const careerPlanSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "situation_understanding",
    "skill_gap",
    "primary_plan",
    "adaptive_adjustment",
    "projects",
    "reasoning_transparency",
    "confidence_analysis",
    "risk_and_failure_modes",
    "alternative_paths",
    "user_reflection",
    "failure_scenarios",
    "timeline_reality",
    "adaptation_prompt",
    "ethical_layer"
  ],
  properties: {
    situation_understanding: { type: "string" },
    skill_gap: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["skill", "status", "importance", "reason"],
        properties: {
          skill: { type: "string" },
          status: {
            type: "string",
            enum: ["missing", "needs_practice", "strong"]
          },
          importance: {
            type: "string",
            enum: ["high", "medium", "low"]
          },
          reason: { type: "string" }
        }
      }
    },
    primary_plan: {
      type: "object",
      additionalProperties: false,
      required: ["week1", "week2", "week3", "week4"],
      properties: {
        week1: weekSchema,
        week2: weekSchema,
        week3: weekSchema,
        week4: weekSchema
      }
    },
    adaptive_adjustment: {
      type: "object",
      additionalProperties: false,
      required: ["based_on_inputs", "changes_made", "tradeoffs"],
      properties: {
        based_on_inputs: { type: "string" },
        changes_made: {
          type: "array",
          items: { type: "string" }
        },
        tradeoffs: {
          type: "array",
          items: { type: "string" }
        }
      }
    },
    projects: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "why_this_project", "skills_covered"],
        properties: {
          name: { type: "string" },
          why_this_project: { type: "string" },
          skills_covered: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    },
    reasoning_transparency: {
      type: "object",
      additionalProperties: false,
      required: ["why_this_path", "assumptions"],
      properties: {
        why_this_path: { type: "string" },
        assumptions: {
          type: "array",
          items: { type: "string" }
        }
      }
    },
    confidence_analysis: {
      type: "object",
      additionalProperties: false,
      required: ["score", "uncertainty_reasons", "what_would_improve"],
      properties: {
        score: { type: "integer" },
        uncertainty_reasons: { type: "string" },
        what_would_improve: { type: "string" }
      }
    },
    risk_and_failure_modes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["risk", "likelihood", "mitigation"],
        properties: {
          risk: { type: "string" },
          likelihood: {
            type: "string",
            enum: ["low", "medium", "high"]
          },
          mitigation: { type: "string" }
        }
      }
    },
    alternative_paths: {
      type: "array",
      minItems: 2,
      maxItems: 2,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["option", "why_valid", "tradeoffs"],
        properties: {
          option: { type: "string" },
          why_valid: { type: "string" },
          tradeoffs: { type: "string" }
        }
      }
    },
    user_reflection: {
      type: "object",
      additionalProperties: false,
      required: ["decisions_user_must_make", "questions_to_consider"],
      properties: {
        decisions_user_must_make: {
          type: "array",
          items: { type: "string" }
        },
        questions_to_consider: {
          type: "array",
          items: { type: "string" }
        }
      }
    },
    failure_scenarios: {
      type: "array",
      minItems: 2,
      maxItems: 2,
      items: { type: "string" }
    },
    timeline_reality: { type: "string" },
    adaptation_prompt: {
      type: "object",
      additionalProperties: false,
      required: ["message", "options"],
      properties: {
        message: { type: "string" },
        options: {
          type: "array",
          items: { type: "string" }
        }
      }
    },
    ethical_layer: {
      type: "object",
      additionalProperties: false,
      required: ["limitations", "uncertainty", "user_agency", "suggestion"],
      properties: {
        limitations: { type: "string" },
        uncertainty: { type: "string" },
        user_agency: { type: "string" },
        suggestion: { type: "string" }
      }
    }
  }
};

export const sampleInput = {
  year: "2nd year",
  skills: "Python basics, HTML, CSS, Git, simple SQL",
  targetRole: "Machine Learning Engineer",
  hoursPerWeek: "8",
  experienceChecks: ["Worked with datasets"],
  projectDescription: "Built a small marks predictor using pandas and linear regression.",
  learningPreference: "Mix of both",
  immediateGoal: "Internship (3-6 months)",
  domainInterest: "Not sure",
  mainBlocker: "Consistency",
  resumeText: ""
};

export function buildCareerPrompt(input) {
  const adaptationInstruction = input.adaptation
    ? `
The student has reviewed their initial plan and signaled: "${input.adaptation}".
Adjust the plan accordingly:
- "Too hard": Reduce week 1-2 scope by 40%. Switch to a smaller, more achievable project. Keep the same goal but use a beginner-friendly dataset and a simpler model.
- "Too easy": Add a stretch goal to weeks 3-4. Suggest a more advanced technique or require the project to be deployed publicly, such as Hugging Face Spaces or Streamlit Cloud.
- "Not interested": Completely replace the primary plan project with the second project option from the previous plan. Rewrite the week-by-week tasks around the new project.
- "Give alternative": Generate a third path not present in the previous response. Do not repeat the primary plan or either alternative path.
Regenerate the full plan JSON with the adjustment applied. Do not acknowledge the feedback in the output; just produce the adjusted plan.
Previous plan summary, if available: ${input.previousPlanSummary || "not provided"}
`
    : "";

  const resumeInstruction = input.resumeText
    ? `
RESUME ANALYSIS — do all four steps before writing any output:

Step 1 — FULL SKILL EXTRACTION. Extract every skill you can find in the resume, including:
  - Programming languages (Python, JavaScript, C++, Java, R, MATLAB, etc.)
  - ML/AI frameworks and libraries (TensorFlow, PyTorch, scikit-learn, Keras, HuggingFace, LangChain, OpenCV, etc.)
  - Data tools (Pandas, NumPy, Matplotlib, SQL, Spark, Tableau, Power BI, Excel, etc.)
  - Web / software (React, Node.js, FastAPI, Flask, Django, REST APIs, etc.)
  - DevOps / infra (Git, Docker, Linux, AWS, GCP, Azure, CI/CD, etc.)
  - Concepts (machine learning, deep learning, NLP, computer vision, statistics, system design, etc.)
  - Soft skills and roles (team lead, presenter, research, writing, mentoring, etc.)
  - Academic coursework, certifications, or competition results if mentioned
  List every extracted skill mentally — this full list must inform every subsequent field.

Step 2 — PROJECT EVIDENCE AUDIT. For each project in the resume:
  - Identify the specific skills it demonstrates (use extracted list above)
  - Rate complexity: toy / portfolio / production-scale
  - Note if it was deployed, published, open-sourced, or used in a real setting
  - Flag if it directly covers a skill gap the user is asking about

Step 3 — CONFLICT RESOLUTION. Compare resume evidence against the self-reported skills field:
  - If resume shows stronger evidence than self-reported: upgrade that skill's status and lower its importance in the gap list
  - If resume shows weaker evidence than claimed: mark the skill as "needs_practice" and flag in confidence_analysis
  - If resume shows a skill not mentioned in the self-report: add it to your mental skill inventory

Step 4 — PERSONALIZATION MANDATE. Every output field that references skills or projects MUST:
  - Name actual projects from the resume by their exact title
  - Reference actual technologies found in the resume
  - Never produce generic advice that could apply to any student
  - The situation_understanding paragraph must read as if written by someone who studied the resume
`
    : "";

  return `
You are an Adaptive Decision Support AI designed to help users make informed, ethical, and personalized decisions about their growth.

This system is not a recommendation engine. It is a reflective, adaptive, and transparent decision-support system.

${adaptationInstruction}

User context:
- Current year or stage: ${input.year}
- Current state and skills: ${input.skills}
- Goal: ${input.targetRole}
- Time constraints: ${input.hoursPerWeek} hours per week
- Experience check: ${input.experienceChecks || "not answered"}
- Optional project description: ${input.projectDescription || "not provided"}
- Learning preference: ${input.learningPreference || "not answered"}
- Immediate goal: ${input.immediateGoal || "not answered"}
- Main blocker: ${input.mainBlocker || "not answered"}
- Adaptive follow-up answers: ${input.adaptiveAnswers || "not answered"}
- Resume text, if provided: ${input.resumeText || "not provided"}

${resumeInstruction}

Core purpose:
- Help the user understand their current situation.
- Help the user explore multiple paths and evaluate trade-offs.
- Help the user adjust plans dynamically if feedback is given.
- Preserve full user decision-making control.

System behavior:
- Never make decisions for the user.
- Never present one correct path.
- Never give overconfident predictions.
- Show reasoning behind major suggestions.
- Explicitly state uncertainty, limitations, risks, and failure points.
- Include multiple valid paths and tradeoffs.
- Encourage reflection and user choice.
- If no feedback is provided, say the initial plan has not been adjusted yet.

Output rules:
- Return only data matching the JSON schema.
- Include exactly 5 skill_gap items.
- Include exactly 3 tasks per week.
- Include exactly 2 changes_made and 2 adaptive tradeoffs.
- Include exactly 2 project suggestions.
- Include exactly 3 assumptions.
- Include exactly 3 risks.
- Include exactly 2 alternative paths.
- Include exactly 3 user decisions and 3 reflection questions.
- Include exactly 2 failure_scenarios.
- timeline_reality must clearly say a 4-week plan builds foundation, not job readiness, unless the user's goal is explicitly exploration.
- adaptation_prompt.options must be exactly: ["Too hard", "Too easy", "Not interested", "Give alternative"].
- Keep strings specific, actionable, and concise.
- Avoid generic outputs, deterministic claims, and bias toward a single career path.
- Personalize based on the clarification answers. If answers are missing, explicitly state that uncertainty.
- If resume text is provided, complete all 4 resume analysis steps above before generating any output field.

Personalization rules:
1. Every skill gap must reference at least one specific project, skill, experience, or missing evidence from the student's input. No generic advice without grounding it in what they already built or said.
2. The situation_understanding paragraph must feel like it was written by someone who read the context, especially the resume if present. Name real projects when available.
3. Confidence score must be between 55 and 85. Scores below 55 are demoralizing; scores above 85 are overconfident. The uncertainty_reasons must list at least 2 specific unknowns about this student.
4. Never use the words "journey" or "roadmap" in the output.
5. primary_plan.week1.why must answer: "Why start here and not somewhere else?"

For alternative_paths, generate exactly 2 paths that are genuinely different from the primary plan, not minor variations. Each must include:
- A concretely named option, such as "Research ML Scientist track", "Startup founding track", or "Data Engineering pivot".
- Why it is a valid choice for this specific student, referencing their actual background.
- Honest tradeoffs: what they gain and what they sacrifice.
- A different 4-week starting point than the primary plan.
Do not leave this section vague. It must feel like a real advisor surfacing paths the student had not considered.

For failure_scenarios, generate exactly 2 specific, honest failure modes for this student's plan. These are not generic. They must reference the student's actual situation, skills, time constraints, resume, project, blocker, or goal. Each scenario should be 1-2 sentences, concrete, and a little uncomfortable to read because honest signal is more useful than false optimism.

For ethical_layer.limitations, write 2-3 sentences that are specific to this student's plan, not generic disclaimers. Name actual risks, missing data, time pressure, academic pressure, skill evidence gaps, or local hiring uncertainty when relevant.
`.trim();
}

export function normalizeInput(body = {}) {
  return {
    year: String(body.year || "").trim(),
    skills: String(body.skills || "").trim(),
    targetRole: String(body.targetRole || "").trim(),
    hoursPerWeek: String(body.hoursPerWeek || "").trim(),
    experienceChecks: Array.isArray(body.experienceChecks)
      ? body.experienceChecks.join(", ")
      : String(body.experienceChecks || "").trim(),
    projectDescription: String(body.projectDescription || "").trim(),
    learningPreference: String(body.learningPreference || "").trim(),
    immediateGoal: String(body.immediateGoal || "").trim(),
    mainBlocker: String(body.mainBlocker || "").trim(),
    adaptiveAnswers:
      body.adaptiveAnswers && typeof body.adaptiveAnswers === "object"
        ? Object.entries(body.adaptiveAnswers)
            .map(([question, answer]) => `${question}: ${answer}`)
            .join("; ")
        : String(body.adaptiveAnswers || "").trim(),
    resumeText: String(body.resumeText || "").trim(),
    adaptation: String(body.adaptation || "").trim(),
    previousPlanSummary: String(body.previousPlanSummary || "").trim()
  };
}

export function validateInput(input) {
  const errors = [];

  if (!input.year) errors.push("Current year is required.");
  if (!input.skills) errors.push("Skills are required.");
  if (!input.targetRole) errors.push("Target role is required.");

  const hours = Number(input.hoursPerWeek);
  if (!Number.isFinite(hours) || hours < 1 || hours > 40) {
    errors.push("Time available must be between 1 and 40 hours per week.");
  }

  return errors;
}

export function createFallbackPlan(input = sampleInput) {
  const target = input.targetRole || sampleInput.targetRole;
  const skills = (input.skills || sampleInput.skills).toLowerCase();
  const isFrontend = /front|react|ui|web/.test(target.toLowerCase());
  const isData = /data|ml|machine|ai|analytics/.test(target.toLowerCase());

  const focusSkills = isFrontend
    ? ["JavaScript fundamentals", "React practice", "Responsive UI", "API integration"]
    : isData
      ? ["Python for data work", "Statistics basics", "Model evaluation", "Data storytelling"]
      : ["Role fundamentals", "Portfolio evidence", "Problem solving", "Communication"];

  const skillGap = focusSkills.map((skill, index) => ({
    skill,
    status: skills.includes(skill.toLowerCase().split(" ")[0]) ? "needs_practice" : "missing",
    importance: index < 2 ? "high" : "medium",
    reason: `${skill} may matter for ${target}, but expectations vary by organization and role scope.`
  }));

  return {
    situation_understanding: `You appear to be exploring ${target} with some existing skills and about ${input.hoursPerWeek || sampleInput.hoursPerWeek} hours per week.`,
    skill_gap: [
      {
        skill: "Git and GitHub",
        status: skills.includes("git") ? "strong" : "missing",
        importance: "medium",
        reason: "Versioned project evidence helps mentors and reviewers understand your progress."
      },
      ...skillGap
    ].slice(0, 5),
    primary_plan: {
      week1: {
        focus: "Clarify the target and foundations",
        tasks: [
          `Compare three beginner ${target} descriptions and note repeated expectations.`,
          "Revise the two highest-importance skill gaps.",
          "Create a progress repo with notes and weekly evidence."
        ],
        why: "This keeps the plan grounded before you invest heavily in one path."
      },
      week2: {
        focus: "Practice the most uncertain skills",
        tasks: [
          "Complete three small exercises tied to the top gap.",
          "Write down mistakes and what changed after debugging.",
          "Ask one peer or mentor for feedback on the exercises."
        ],
        why: "Short feedback loops reveal whether the plan is too hard, too easy, or misaligned."
      },
      week3: {
        focus: "Build one small proof project",
        tasks: [
          "Choose a project that demonstrates one important role skill.",
          "Build the smallest working version before adding polish.",
          "Document tradeoffs, setup steps, and screenshots."
        ],
        why: "A modest finished project gives better decision evidence than a large unfinished one."
      },
      week4: {
        focus: "Review, compare, and adjust",
        tasks: [
          "Improve the project based on feedback.",
          "Compare this path with two adjacent alternatives.",
          "Choose the next month focus based on interest, difficulty, and evidence."
        ],
        why: "The final week protects user agency by turning the plan into a decision point."
      }
    },
    adaptive_adjustment: {
      based_on_inputs:
        `The plan uses the stated ${input.hoursPerWeek || sampleInput.hoursPerWeek} hours/week, learning preference "${input.learningPreference || "not answered"}", and blocker "${input.mainBlocker || "not answered"}".`,
      changes_made: [
        input.learningPreference
          ? `The learning style leans toward ${input.learningPreference}, so tasks mix practice and explanation.`
          : "Learning preference was not provided, so the plan uses a balanced format.",
        input.mainBlocker
          ? `The plan includes safeguards for the stated blocker: ${input.mainBlocker}.`
          : "No blocker was provided, so overload risk is handled conservatively."
      ],
      tradeoffs: [
        "A smaller plan may feel less ambitious but is easier to complete.",
        "A four-week plan can clarify direction but cannot validate long-term fit alone."
      ]
    },
    projects: [
      isFrontend
        ? {
            name: "Student Habit Dashboard",
            why_this_project:
              "It tests UI, state, responsiveness, and product thinking without needing a backend.",
            skills_covered: ["React", "State management", "Responsive UI", "User feedback"]
          }
        : isData
          ? {
              name: "Student Performance Predictor",
              why_this_project:
                "It tests data cleaning, modeling, evaluation, and careful communication of uncertainty.",
              skills_covered: ["Python", "Pandas", "Model evaluation", "Communication"]
            }
          : {
              name: "Role Starter Portfolio",
              why_this_project:
                "It creates evidence for the target role while leaving room to change direction.",
              skills_covered: ["Research", "Implementation", "Documentation", "Presentation"]
            },
      {
        name: "Learning Decision Log",
        why_this_project:
          "It helps track what worked, what felt difficult, and what should change next.",
        skills_covered: ["Reflection", "Planning", "Documentation"]
      }
    ],
    reasoning_transparency: {
      why_this_path: `The path balances fundamentals, proof of work, feedback, and comparison because ${target} fit is uncertain early on.`,
      assumptions: [
        "The stated weekly time can be protected consistently.",
        "The skill list is accurate but may not reveal depth.",
        "The user is still evaluating fit, not only chasing a title."
      ]
    },
    confidence_analysis: {
      score: 72,
      uncertainty_reasons:
        "Confidence is limited by unknown project depth, resume evidence, local opportunities, and long-term consistency.",
      what_would_improve:
        "A past project, preferred work style, mentor feedback, and examples of enjoyable tasks would improve plan fit."
    },
    risk_and_failure_modes: [
      {
        risk: "Spending too much time consuming tutorials without producing evidence.",
        likelihood: "medium",
        mitigation: "Use weekly deliverables and publish small artifacts."
      },
      {
        risk: "Discovering the target role requires deeper fundamentals than expected.",
        likelihood: "medium",
        mitigation: "Treat week four as a decision point and compare adjacent paths."
      },
      {
        risk: "Choosing a project that is too large for the available time.",
        likelihood: "high",
        mitigation: "Build the smallest demo first and add polish only after it works."
      }
    ],
    alternative_paths: [
      {
        option: isFrontend ? "UI Engineer" : isData ? "Data Analyst" : "Technical Product Intern",
        why_valid:
          "This adjacent path may use current skills sooner while still building useful evidence.",
        tradeoffs:
          "You gain a smoother starting point but may move slightly away from the original goal."
      },
      {
        option: isFrontend ? "Full-Stack Developer" : isData ? "ML Data Engineer" : "Developer Advocate Intern",
        why_valid:
          "This path may suit someone who enjoys connecting technical work with systems or communication.",
        tradeoffs:
          "You gain breadth, but it may take longer to feel strong in one specialty."
      }
    ],
    user_reflection: {
      decisions_user_must_make: [
        "Decide whether the goal still feels interesting after week two practice.",
        "Choose the project that feels useful enough to finish.",
        "Decide whether to deepen this path or test an alternative next month."
      ],
      questions_to_consider: [
        `Do you enjoy the daily work style behind ${target}, not only the title?`,
        "Which tasks felt energizing, and which felt draining?",
        "What feedback would make your next decision more informed?"
      ]
    },
    failure_scenarios: [
      "Most users drop after week 2 if the plan becomes too broad or invisible.",
      "Skipping projects can leave the user with learning activity but weak portfolio evidence."
    ],
    timeline_reality:
      "This 4-week plan builds foundation, not job readiness. A realistic internship-oriented timeline is usually 3-6 months.",
    adaptation_prompt: {
      message: "If this plan feels too hard, too easy, or misaligned, you can adjust it.",
      options: ["Too hard", "Too easy", "Not interested", "Give alternative"]
    },
    ethical_layer: {
      limitations: "This system has uncertainty and may not reflect real hiring conditions.",
      uncertainty: "The plan depends on incomplete self-reported context and changing role expectations.",
      user_agency: "Final decisions must be made by the user.",
      suggestion: "Consult mentors or professionals for validation."
    }
  };
}

function clampConfidence(value, fallbackValue) {
  const score = Number(value);
  return Number.isFinite(score) ? Math.max(55, Math.min(85, Math.round(score))) : fallbackValue;
}

export function normalizePlan(plan, input) {
  if (!plan || typeof plan !== "object") return createFallbackPlan(input);

  const fallback = createFallbackPlan(input);
  const merged = {
    ...fallback,
    ...plan,
    adaptive_adjustment: {
      ...fallback.adaptive_adjustment,
      ...(plan.adaptive_adjustment || {})
    },
    reasoning_transparency: {
      ...fallback.reasoning_transparency,
      ...(plan.reasoning_transparency || {})
    },
    confidence_analysis: {
      ...fallback.confidence_analysis,
      ...(plan.confidence_analysis || {})
    },
    user_reflection: {
      ...fallback.user_reflection,
      ...(plan.user_reflection || {})
    },
    adaptation_prompt: {
      ...fallback.adaptation_prompt,
      ...(plan.adaptation_prompt || {})
    },
    ethical_layer: {
      ...fallback.ethical_layer,
      ...(plan.ethical_layer || {})
    }
  };

  merged.confidence_analysis.score = clampConfidence(
    merged.confidence_analysis.score,
    fallback.confidence_analysis.score
  );

  return merged;
}
