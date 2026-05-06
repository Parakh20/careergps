import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import roadmapHandler from "./api/generate-roadmap.js";
import questionsHandler from "./api/generate-questions.js";

function loadLocalEnv() {
  if (!fs.existsSync(".env")) return;

  const lines = fs.readFileSync(".env", "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;

    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");

    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function createLocalResponse(res) {
  return {
    setHeader(name, value) {
      res.setHeader(name, value);
      return this;
    },
    status(code) {
      res.statusCode = code;
      return this;
    },
    json(payload) {
      if (!res.headersSent) {
        res.setHeader("Content-Type", "application/json");
      }

      res.end(JSON.stringify(payload));
      return this;
    }
  };
}

function localApiPlugin() {
  return {
    name: "career-gps-local-api",
    configureServer(server) {
      server.middlewares.use("/api/generate-roadmap", async (req, res) => {
        try {
          const rawBody = await readRequestBody(req);
          req.body = rawBody ? JSON.parse(rawBody) : {};
          await roadmapHandler(req, createLocalResponse(res));
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: error.message || "Local API failed."
            })
          );
        }
      });

      server.middlewares.use("/api/generate-questions", async (req, res) => {
        try {
          const rawBody = await readRequestBody(req);
          req.body = rawBody ? JSON.parse(rawBody) : {};
          await questionsHandler(req, createLocalResponse(res));
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: error.message || "Local API failed."
            })
          );
        }
      });
    }
  };
}

loadLocalEnv();

export default defineConfig({
  plugins: [react(), localApiPlugin()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          supabase: ["@supabase/supabase-js"],
          icons: ["lucide-react"]
        }
      }
    }
  }
});
