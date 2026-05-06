export const fallbackAdaptiveQuestions = [
  {
    id: "math_comfort",
    question: "How comfortable are you with the math behind this path?",
    options: ["Low", "Medium", "High"]
  },
  {
    id: "portfolio_priority",
    question: "What proof would you rather build first?",
    options: ["Small project", "Strong notes", "Interview practice"]
  }
];

export async function generateCareerPlan(formData) {
  try {
    const response = await fetch("/api/generate-roadmap", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData)
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || "Unable to generate a roadmap right now.");
    }

    return payload;
  } catch (error) {
    console.error("Career plan generation failed:", error);
    throw error;
  }
}

export async function generateAdaptiveQuestions(formData) {
  try {
    const response = await fetch("/api/generate-questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData)
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || "Unable to generate adaptive questions right now.");
    }

    return Array.isArray(payload.questions) && payload.questions.length > 0
      ? payload.questions
      : fallbackAdaptiveQuestions;
  } catch (error) {
    console.error("Adaptive question generation failed:", error);
    return fallbackAdaptiveQuestions;
  }
}
