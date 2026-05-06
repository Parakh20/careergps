import { normalizeInput, validateInput } from "../src/lib/careerPlan.js";
import { withGuards } from "./_shared.js";

const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";

const questionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["questions"],
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "question", "options"],
        properties: {
          id: { type: "string" },
          question: { type: "string" },
          options: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    }
  }
};

const fallbackQuestions = [
  {
    id: "math_comfort",
    question: "How comfortable are you with required math?",
    options: ["Low", "Medium", "High"]
  },
  {
    id: "project_scope",
    question: "What project scope feels realistic this month?",
    options: ["Tiny demo", "Portfolio project", "Not sure"]
  }
];

function extractToolInput(response) {
  const toolUse = (response.content || []).find(
    (item) => item.type === "tool_use" && item.name === "create_adaptive_questions"
  );

  return toolUse?.input || null;
}

async function callClaude(input) {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  if (!apiKey) return fallbackQuestions;

  const model = "claude-haiku-4-5-20251001";
  const prompt = `
Based on this user profile and answers, generate 2-3 specific clarification questions that reduce uncertainty. Keep them short and multiple-choice where possible.

User:
- Year: ${input.year}
- Skills: ${input.skills}
- Goal: ${input.targetRole}
- Hours/week: ${input.hoursPerWeek}
- Experience: ${input.experienceChecks || "not answered"}
- Goal type: ${input.immediateGoal || "not answered"}
- Learning style: ${input.learningPreference || "not answered"}
- Constraint: ${input.mainBlocker || "not answered"}
- Project: ${input.projectDescription || "not provided"}
- Resume text: ${input.resumeText ? "provided" : "not provided"}

Rules:
- Return only tool JSON.
- Ask questions not already answered.
- Make options concrete.
- Do not ask more than 3 questions.
`.trim();

  const response = await fetch(ANTHROPIC_MESSAGES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "prompt-caching-2024-07-31"
    },
    body: JSON.stringify({
      model,
      max_tokens: 1200,
      system: [
        {
          type: "text",
          text: "You generate concise adaptive clarification questions for a career decision-support app.",
          cache_control: { type: "ephemeral" }
        }
      ],
      messages: [{ role: "user", content: prompt }],
      tools: [
        {
          name: "create_adaptive_questions",
          description: "Return 2-3 adaptive clarification questions.",
          input_schema: questionSchema,
          cache_control: { type: "ephemeral" }
        }
      ],
      tool_choice: {
        type: "tool",
        name: "create_adaptive_questions"
      }
    })
  });

  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || "Claude request failed.");

  const toolInput = extractToolInput(payload);
  return Array.isArray(toolInput?.questions) ? toolInput.questions : fallbackQuestions;
}

export default async function handler(req, res) {
  return withGuards(req, res, async (body) => {
    const input = normalizeInput(body);
    const errors = validateInput(input);
    if (errors.length > 0) {
      // For adaptive questions, fall back rather than block UX on minor validation
      return res.status(200).json({ questions: fallbackQuestions });
    }
    try {
      const questions = await callClaude(input);
      return res.status(200).json({ questions });
    } catch (error) {
      console.error("Adaptive question API failed:", error);
      return res.status(200).json({ questions: fallbackQuestions });
    }
  });
}
