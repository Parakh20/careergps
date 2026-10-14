import { describe, expect, it } from "vitest";
import {
  INPUT_LIMITS,
  buildCareerPrompt,
  createFallbackPlan,
  normalizeInput,
  normalizePlan,
  sampleInput,
  validateInput
} from "../src/lib/careerPlan.js";

describe("normalizeInput", () => {
  it("trims strings and fills missing fields with empty strings", () => {
    const input = normalizeInput({ year: "  3rd year  ", skills: " React " });

    expect(input.year).toBe("3rd year");
    expect(input.skills).toBe("React");
    expect(input.targetRole).toBe("");
    expect(input.resumeText).toBe("");
  });

  it("joins experience checks and flattens adaptive answers", () => {
    const input = normalizeInput({
      experienceChecks: ["Built a project", "Did an internship"],
      adaptiveAnswers: { "Preferred pace?": "Slow", "Team or solo?": "Solo" }
    });

    expect(input.experienceChecks).toBe("Built a project, Did an internship");
    expect(input.adaptiveAnswers).toBe("Preferred pace?: Slow; Team or solo?: Solo");
  });

  it("handles a missing body", () => {
    expect(normalizeInput().year).toBe("");
  });
});

describe("validateInput", () => {
  it("accepts the sample input", () => {
    expect(validateInput(normalizeInput(sampleInput))).toEqual([]);
  });

  it("requires year, skills and target role", () => {
    const errors = validateInput(normalizeInput({ hoursPerWeek: "5" }));

    expect(errors).toContain("Current year is required.");
    expect(errors).toContain("Skills are required.");
    expect(errors).toContain("Target role is required.");
  });

  it.each(["0", "41", "abc", ""])("rejects hoursPerWeek=%j", (hours) => {
    const errors = validateInput(normalizeInput({ ...sampleInput, hoursPerWeek: hours }));
    expect(errors).toContain("Time available must be between 1 and 40 hours per week.");
  });

  it("enforces field length limits", () => {
    const tooLong = "x".repeat(INPUT_LIMITS.targetRole + 1);
    const errors = validateInput(normalizeInput({ ...sampleInput, targetRole: tooLong }));

    expect(errors).toContain(`targetRole exceeds the maximum length of ${INPUT_LIMITS.targetRole} characters.`);
  });
});

describe("createFallbackPlan", () => {
  it("returns a complete plan shape", () => {
    const plan = createFallbackPlan(normalizeInput(sampleInput));

    for (const key of [
      "situation_understanding",
      "skill_gap",
      "primary_plan",
      "projects",
      "confidence_analysis",
      "alternative_paths",
      "ethical_layer"
    ]) {
      expect(plan).toHaveProperty(key);
    }
    expect(Array.isArray(plan.skill_gap)).toBe(true);
  });

  it("tailors focus skills to the target role", () => {
    const frontend = JSON.stringify(createFallbackPlan(normalizeInput({ ...sampleInput, targetRole: "Frontend Developer" })));
    const data = JSON.stringify(createFallbackPlan(normalizeInput({ ...sampleInput, targetRole: "Data Scientist" })));

    expect(frontend).toContain("React practice");
    expect(data).toContain("Statistics basics");
  });
});

describe("normalizePlan", () => {
  const input = normalizeInput(sampleInput);

  it("falls back to the demo plan for non-object input", () => {
    expect(normalizePlan(null, input)).toEqual(createFallbackPlan(input));
  });

  it("keeps model fields and fills missing nested sections from the fallback", () => {
    const plan = normalizePlan({ situation_understanding: "Custom", confidence_analysis: { score: 70 } }, input);

    expect(plan.situation_understanding).toBe("Custom");
    expect(plan.confidence_analysis.score).toBe(70);
    expect(plan.confidence_analysis.uncertainty_reasons).toBeTruthy();
    expect(plan.ethical_layer.user_agency).toBeTruthy();
  });

  it("clamps the confidence score to the 55-85 range", () => {
    expect(normalizePlan({ confidence_analysis: { score: 99 } }, input).confidence_analysis.score).toBe(85);
    expect(normalizePlan({ confidence_analysis: { score: 10 } }, input).confidence_analysis.score).toBe(55);
  });
});

describe("buildCareerPrompt", () => {
  it("includes the student's details", () => {
    const prompt = buildCareerPrompt(normalizeInput({ ...sampleInput, targetRole: "Robotics Engineer" }));

    expect(prompt).toContain("Robotics Engineer");
    expect(prompt).toContain(sampleInput.skills);
  });
});
