// Shared helpers for serverless API endpoints: CORS, method, JSON body, rate limit.

const ALLOWED_ORIGINS = new Set([
  "https://career-gps-ai-roadmap.vercel.app",
  "https://career-gps-ai-roadmap.parakh-sharmas-projects.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000"
]);

// In-memory rate limiter: per-IP, sliding window. Best-effort across serverless cold starts.
const RATE_LIMIT = {
  windowMs: 60_000,
  maxRequests: 8
};
const requestLog = new Map();

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers["x-real-ip"] || req.socket?.remoteAddress || "unknown";
}

function rateLimit(ip) {
  const now = Date.now();
  const entries = requestLog.get(ip) || [];
  const recent = entries.filter((ts) => now - ts < RATE_LIMIT.windowMs);
  if (recent.length >= RATE_LIMIT.maxRequests) {
    const retryAfter = Math.ceil((RATE_LIMIT.windowMs - (now - recent[0])) / 1000);
    return { allowed: false, retryAfter };
  }
  recent.push(now);
  requestLog.set(ip, recent);
  // Periodic cleanup to prevent unbounded growth
  if (requestLog.size > 5000) {
    for (const [key, values] of requestLog) {
      const stillRecent = values.filter((ts) => now - ts < RATE_LIMIT.windowMs);
      if (stillRecent.length === 0) requestLog.delete(key);
      else requestLog.set(key, stillRecent);
    }
  }
  return { allowed: true };
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  // Allow same-origin requests (no Origin header) and listed origins.
  if (!origin || ALLOWED_ORIGINS.has(origin)) {
    if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Max-Age", "86400");
    return true;
  }
  return false;
}

export async function withGuards(req, res, handler) {
  if (!applyCors(req, res)) {
    return res.status(403).json({ error: "Origin not allowed." });
  }

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const ip = getClientIp(req);
  const rl = rateLimit(ip);
  if (!rl.allowed) {
    res.setHeader("Retry-After", String(rl.retryAfter));
    return res.status(429).json({
      error: `Too many requests. Try again in ${rl.retryAfter}s.`
    });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: "Invalid JSON request body." });
  }

  if (!body || typeof body !== "object") {
    return res.status(400).json({ error: "Request body must be a JSON object." });
  }

  // Reject payloads larger than ~200KB (covers all expected fields with margin)
  const rawLength =
    typeof req.body === "string"
      ? req.body.length
      : JSON.stringify(body).length;
  if (rawLength > 200_000) {
    return res.status(413).json({ error: "Request body too large." });
  }

  return handler(body, { ip });
}
