import { useState } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import { signIn, signUp } from "../lib/auth";

export default function LoginModal({ onClose, onSuccess }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      if (mode === "signup") {
        const result = await signUp(email, password);
        if (result.session) {
          onSuccess?.(result.user);
          onClose();
        } else {
          setSuccess(
            "Account created. If email confirmation is enabled, check your inbox. Otherwise sign in below."
          );
          setMode("signin");
        }
      } else {
        const result = await signIn(email, password);
        onSuccess?.(result.user);
        onClose();
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-soft"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-950">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {mode === "signin"
                ? "Sign in to access your saved plans, dashboard, and progress."
                : "Save plans, track week-by-week progress, and get auto-adapted updates."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
            type="button"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-800">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-800">Password</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
              placeholder="At least 6 characters"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
            />
          </label>

          {error && (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-950 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError("");
              setSuccess("");
            }}
            className="block w-full text-center text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            {mode === "signin"
              ? "Don't have an account? Create one"
              : "Already have an account? Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
