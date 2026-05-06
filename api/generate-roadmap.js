import {
  buildCareerPrompt,
  careerPlanSchema,
  createFallbackPlan,
  normalizeInput,
  normalizePlan,
  validateInput
} from "../src/lib/careerPlan.js";

const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";

const SYSTEM_TEXT =
  "You are an adaptive decision-support system. Use the provided clarification answers, return strict JSON only, preserve user agency, and never guarantee outcomes.";

function extractThinking(response) {
  return (response.content || [])
    .filter((item) => item.type === "thinking" && item.thinking)
    .map((item) => item.thinking)
    .join("\n\n")
    .trim();
}

function extractToolInput(response) {
  const toolUse = (response.content || []).find(
    (item) => item.type === "tool_use" && item.name === "create_career_plan"
  );
  return toolUse?.input || null;
}

function extractTextContent(response) {
  return (response.content || [])
    .filter((item) => item.type === "text" && typeof item.text === "string")
    .map((item) => item.text)
    .join("\n")
    .trim();
}

async function callClaude(input) {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    return {
      plan: createFallbackPlan(input),
      source: "demo-fallback",
      warning:
        "CLAUDE_API_KEY or ANTHROPIC_API_KEY is not configured, so Career GPS used the built-in demo generator."
    };
  }

  // Extended thinking requires a sonnet/opus model — never haiku.
  const model = "claude-sonnet-4-6";

  const response = await fetch(ANTHROPIC_MESSAGES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "interleaved-thinking-2025-05-14,prompt-caching-2024-07-31"
    },
    body: JSON.stringify({
      model,
      max_tokens: 24000,
      thinking: {
        type: "enabled",
        budget_tokens: 8000
      },
      system: [
        {
          type: "text",
          text: SYSTEM_TEXT,
          cache_control: { type: "ephemeral" }
        }
      ],
      messages: [
        {
          role: "user",
          content: buildCareerPrompt(input)
        }
      ],
      tools: [
        {
          name: "create_career_plan",
          description:
            "Return an adaptive decision-support plan with situation understanding, skill gaps, primary plan, adjustments, risks, alternatives, reflection, and ethical safeguards.",
          input_schema: careerPlanSchema,
          cache_control: { type: "ephemeral" }
        }
      ],
      tool_choice: {
        type: "any"
      }
    })
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error?.message || "Claude request failed.");
  }

  if (payload.stop_reason === "refusal") {
    throw new Error("Claude refused to generate this decision-support plan.");
  }

  if (payload.stop_reason === "max_tokens") {
    throw new Error("Claude reached the token limit before completing the decision-support plan.");
  }

  const thinking = extractThinking(payload);
  const toolInput = extractToolInput(payload);

  if (toolInput) {
    return {
      plan: normalizePlan(toolInput, input),
      thinking: thinking || null,
      source: "claude",
      model,
      usage: payload.usage || null
    };
  }

  const outputText = extractTextContent(payload);
  if (!outputText) throw new Error("Claude returned an empty response.");

  return {
    plan: normalizePlan(JSON.parse(outputText), input),
    thinking: thinking || null,
    source: "claude",
    model,
    usage: payload.usage || null
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: "Invalid JSON request body." });
  }

  const input = normalizeInput(body);
  const errors = validateInput(input);

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(" ") });
  }

  try {
    const result = await callClaude(input);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(200).json({
      plan: createFallbackPlan(input),
      source: "demo-fallback",
      warning: `${error.message} Career GPS used the built-in demo generator instead.`
    });
  }
}
