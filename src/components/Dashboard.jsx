import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Brain,
  Clock,
  ExternalLink,
  Loader2,
  Plus,
  Sparkles,
  Target,
  Trash2,
  TrendingUp
} from "lucide-react";
import { deletePlan, listMyPlans } from "../lib/db";

function calcProgress(plan, progress) {
  const weeks = ["week1", "week2", "week3", "week4"];
  let total = 0;
  let done = 0;
  for (const key of weeks) {
    const tasks = plan?.primary_plan?.[key]?.tasks || [];
    total += tasks.length;
    const wp = progress?.[key] || {};
    done += tasks.filter((_, index) => wp[index]).length;
  }
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

function formatDate(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now - date) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

export default function Dashboard({ user, onCreate, onOpen }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const data = await listMyPlans();
      setPlans(data);
    } catch (err) {
      console.error("Failed to load plans:", err);
      setError(err.message || "Could not load your plans.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleDelete(id, event) {
    event.stopPropagation();
    if (!window.confirm("Delete this plan permanently? This cannot be undone.")) return;
    try {
      await deletePlan(id);
      setPlans((current) => current.filter((p) => p.id !== id));
    } catch (err) {
      window.alert("Failed to delete: " + (err.message || "unknown error"));
    }
  }

  const totalPlans = plans.length;
  const completedPlans = plans.filter(
    (p) => calcProgress(p.plan_data, p.progress) === 100
  ).length;
  const inProgressPlans = plans.filter((p) => {
    const pct = calcProgress(p.plan_data, p.progress);
    return pct > 0 && pct < 100;
  }).length;
  const avgConfidence = plans.length
    ? Math.round(
        plans.reduce(
          (sum, p) => sum + (p.plan_data?.confidence_analysis?.score ?? 0),
          0
        ) / plans.length
      )
    : 0;

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-lg border border-slate-200 bg-white shadow-soft">
        <Loader2 className="h-8 w-8 animate-spin text-slate-950" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-900 shadow-soft">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">Couldn't load your plans</p>
            <p className="mt-1 text-sm">{error}</p>
            <button
              onClick={refresh}
              className="mt-3 inline-flex h-9 items-center rounded-md bg-rose-900 px-3 text-sm font-bold text-white transition hover:bg-rose-800"
              type="button"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">
            {user?.email?.split("@")[0]
              ? `Welcome, ${user.email.split("@")[0]}`
              : "Your dashboard"}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {totalPlans === 0
              ? "Generate your first 4-week plan in about a minute."
              : `${totalPlans} plan${totalPlans === 1 ? "" : "s"} — auto-saved and revisitable any time.`}
          </p>
        </div>
        <button
          onClick={onCreate}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800"
          type="button"
        >
          <Plus className="h-4 w-4" />
          New plan
        </button>
      </div>

      {totalPlans > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Target} label="Total plans" value={totalPlans} tone="slate" />
          <StatCard icon={TrendingUp} label="In progress" value={inProgressPlans} tone="blue" />
          <StatCard icon={Sparkles} label="Completed" value={completedPlans} tone="green" />
          <StatCard icon={Brain} label="Avg confidence" value={`${avgConfidence}/100`} tone="violet" />
        </div>
      )}

      {totalPlans === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center shadow-soft">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-emerald-100 text-emerald-800">
            <Target className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-950">No plans yet</h2>
          <p className="mt-2 max-w-md mx-auto text-sm leading-6 text-slate-600">
            Generate your first plan with extended thinking. We'll save it here so you
            can revisit, adapt, or regenerate any time.
          </p>
          <button
            onClick={onCreate}
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800"
            type="button"
          >
            <Plus className="h-4 w-4" />
            Create my first plan
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const progress = calcProgress(plan.plan_data, plan.progress);
            const confidence = plan.plan_data?.confidence_analysis?.score ?? 0;
            const role = plan.form_data?.targetRole;
            const week1Focus = plan.plan_data?.primary_plan?.week1?.focus;

            return (
              <button
                key={plan.id}
                onClick={() => onOpen(plan.share_token)}
                className="group rounded-lg border border-slate-200 bg-white p-5 text-left shadow-soft transition hover:border-slate-950 hover:shadow-md"
                type="button"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 font-bold text-slate-950">
                    {plan.title || role || "Untitled plan"}
                  </h3>
                  <button
                    onClick={(event) => handleDelete(plan.id, event)}
                    className="shrink-0 text-slate-400 opacity-0 transition hover:text-rose-600 group-hover:opacity-100"
                    title="Delete plan"
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {week1Focus && (
                  <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                    Week 1: {week1Focus}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {formatDate(plan.updated_at)}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700">Progress</span>
                    <span className={progress === 100 ? "text-emerald-600" : "text-slate-700"}>
                      {progress}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        progress === 100 ? "bg-emerald-500" : "bg-slate-950"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="rounded-md bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-800">
                    Confidence {confidence}/100
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 transition group-hover:text-slate-950">
                    Open <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    blue: "bg-sky-100 text-sky-800",
    green: "bg-emerald-100 text-emerald-800",
    violet: "bg-violet-100 text-violet-800"
  };
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
        <div className={`flex h-7 w-7 items-center justify-center rounded ${tones[tone]}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}
ExternalLink;
