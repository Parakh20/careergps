import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import roadmapHandler from "../api/generate-roadmap.js";
import questionsHandler from "../api/generate-questions.js";
import { createMockRequest, createMockResponse, validBody } from "./helpers.js";

// No test talks to the real Anthropic API: keys are blanked, and fetch is
// replaced with a mock that fails loudly unless a test configures it.
beforeEach(() => {
  vi.stubEnv("ANTHROPIC_API_KEY", "");
  vi.stubEnv("CLAUDE_API_KEY", "");
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new Error("Unexpected network call in tests")))
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("request guards (api/_shared.js)", () => {
  it("rejects disallowed origins", async () => {
    const res = createMockResponse();
    await roadmapHandler(createMockRequest({ body: validBody, origin: "https://evil.example" }), res);

    expect(res.statusCode).toBe(403);
  });

  it("answers CORS preflight for allowed origins", async () => {
    const res = createMockResponse();
    await roadmapHandler(createMockRequest({ method: "OPTIONS", origin: "http://localhost:5173" }), res);

    expect(res.statusCode).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
  });

  it("only allows POST", async () => {
    const res = createMockResponse();
    await roadmapHandler(createMockRequest({ method: "GET" }), res);

    expect(res.statusCode).toBe(405);
    expect(res.headers.allow).toBe("POST");
  });

  it("rejects malformed JSON", async () => {
    const res = createMockResponse();
    await roadmapHandler(createMockRequest({ body: "{not json" }), res);

    expect(res.statusCode).toBe(400);
  });

  it("rejects oversized payloads", async () => {
    const res = createMockResponse();
    await roadmapHandler(createMockRequest({ body: { ...validBody, resumeText: "x".repeat(200_001) } }), res);

    expect(res.statusCode).toBe(413);
  });

  it("rate limits repeated requests from one IP", async () => {
    const statuses = [];
    for (let i = 0; i < 9; i += 1) {
      const res = createMockResponse();
      await roadmapHandler(createMockRequest({ body: validBody, ip: "203.0.113.7" }), res);
      statuses.push(res.statusCode);
    }

    expect(statuses.slice(0, 8).every((s) => s === 200)).toBe(true);
    expect(statuses[8]).toBe(429);
  });
});

describe("POST /api/generate-roadmap", () => {
  it("returns 400 with validation errors for incomplete input", async () => {
    const res = createMockResponse();
    await roadmapHandler(createMockRequest({ body: { year: "1st year" } }), res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain("Skills are required.");
  });

  it("uses the demo generator when no API key is configured", async () => {
    const res = createMockResponse();
    await roadmapHandler(createMockRequest({ body: validBody }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.source).toBe("demo-fallback");
    expect(res.body.plan.primary_plan).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns Claude's tool output when the API call succeeds", async () => {
    vi.stubEnv("CLAUDE_API_KEY", "test-key");
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        stop_reason: "tool_use",
        content: [
          { type: "thinking", thinking: "reasoning" },
          { type: "tool_use", name: "create_career_plan", input: { situation_understanding: "From Claude" } }
        ],
        usage: { input_tokens: 1, output_tokens: 1 }
      })
    });

    const res = createMockResponse();
    await roadmapHandler(createMockRequest({ body: validBody }), res);

    expect(res.body.source).toBe("claude");
    expect(res.body.plan.situation_understanding).toBe("From Claude");
    expect(res.body.thinking).toBe("reasoning");
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    expect(options.headers["x-api-key"]).toBe("test-key");
  });

  it("falls back to the demo plan when the Claude API errors", async () => {
    vi.stubEnv("CLAUDE_API_KEY", "test-key");
    fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: { message: "overloaded" } }) });

    const res = createMockResponse();
    await roadmapHandler(createMockRequest({ body: validBody }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.source).toBe("demo-fallback");
    expect(res.body.warning).toContain("overloaded");
  });
});

describe("POST /api/generate-questions", () => {
  it("returns fallback questions when no API key is configured", async () => {
    const res = createMockResponse();
    await questionsHandler(createMockRequest({ body: validBody }), res);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.questions)).toBe(true);
    expect(res.body.questions.length).toBeGreaterThan(0);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns fallback questions instead of a 400 for invalid input", async () => {
    const res = createMockResponse();
    await questionsHandler(createMockRequest({ body: {} }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.questions.length).toBeGreaterThan(0);
  });
});
