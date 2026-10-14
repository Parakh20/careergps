import { vi } from "vitest";

export function createMockResponse() {
  const res = {
    statusCode: 200,
    headers: {},
    body: undefined,
    ended: false,
    status: vi.fn((code) => {
      res.statusCode = code;
      return res;
    }),
    json: vi.fn((payload) => {
      res.body = payload;
      return res;
    }),
    setHeader: vi.fn((name, value) => {
      res.headers[name.toLowerCase()] = value;
    }),
    end: vi.fn(() => {
      res.ended = true;
      return res;
    })
  };
  return res;
}

let ipCounter = 0;

// Each request gets a unique IP so the in-memory rate limiter does not leak between tests.
export function createMockRequest({ method = "POST", body, origin, ip } = {}) {
  ipCounter += 1;
  return {
    method,
    body,
    headers: {
      ...(origin ? { origin } : {}),
      "x-forwarded-for": ip || `10.0.0.${ipCounter}`
    },
    socket: { remoteAddress: "127.0.0.1" }
  };
}

export const validBody = {
  year: "2nd year",
  skills: "Python, SQL",
  targetRole: "Data Analyst",
  hoursPerWeek: "6"
};
