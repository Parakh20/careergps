import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Cloud,
  Compass,
  Copy,
  FileDown,
  Link,
  Loader2,
  Map,
  Route,
  Share2,
  Sparkles,
  Target,
  TestTube2,
  X
} from "lucide-react";
import { fallbackAdaptiveQuestions, generateAdaptiveQuestions, generateCareerPlan } from "./lib/api";
import { createFallbackPlan, sampleInput } from "./lib/careerPlan";
import { loadPlanByToken, savePlan, updateProgress } from "./lib/db";

const LS_KEY = "cgps_session";

function lsSave(data) {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ ...data, savedAt: Date.now() })); } catch (e) { void e; }
}

function lsLoad() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.savedAt > 86_400_000) return null;
    return parsed;
  } catch (e) { void e; return null; }
}

function lsClear() {
  try { localStorage.removeItem(LS_KEY); } catch (e) { void e; }
}

function contextKey(context) {
  const fields = [
    "year", "skills", "targetRole", "hoursPerWeek",
    "experienceChecks", "projectDescription", "learningPreference",
    "immediateGoal", "mainBlocker", "resumeText"
  ];
  const obj = {};
  for (const f of fields) obj[f] = String(context[f] ?? "").trim();
  // adaptiveAnswers: sort keys so order doesn't matter
  obj.adaptiveAnswers = JSON.stringify(
    Object.fromEntries(Object.entries(context.adaptiveAnswers || {}).sort())
  );
  return JSON.stringify(obj);
}

const initialFormData = {
  year: "",
  skills: "",
  targetRole: "",
  hoursPerWeek: "8"
};

const initialCoreAnswers = {
  experienceChecks: [],
  projectDescription: "",
  learningPreference: "",
  immediateGoal: "",
  mainBlocker: ""
};

const yearOptions = ["1st year", "2nd year", "3rd year", "4th year", "Graduate"];
const experienceOptions = [
  "Built ML project",
  "Used PyTorch/TensorFlow",
  "Deployed a model",
  "Worked with datasets",
  "None"
];
const goalOptions = ["Internship (3-6 months)", "Strong foundation", "Exploration"];
const learningOptions = ["Hands-on", "Theory-first", "Mixed"];
const constraintOptions = ["Time", "Consistency", "Confusion", "Motivation"];
const thinkingSteps = [
  "Reading your background...",
  "Claude is reasoning through your profile...",
  "Identifying skill gaps...",
  "Building your 4-week plan...",
  "Calculating risk modes...",
  "Generating alternative paths...",
  "Adding ethical safeguards..."
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function mergePlan(plan) {
  const fallback = createFallbackPlan(sampleInput);
  return {
    ...fallback,
    ...(plan || {}),
    primary_plan: {
      ...fallback.primary_plan,
      ...(plan?.primary_plan || {})
    },
    adaptive_adjustment: {
      ...fallback.adaptive_adjustment,
      ...(plan?.adaptive_adjustment || {})
    },
    reasoning_transparency: {
      ...fallback.reasoning_transparency,
      ...(plan?.reasoning_transparency || {})
    },
    confidence_analysis: {
      ...fallback.confidence_analysis,
      ...(plan?.confidence_analysis || {})
    },
    user_reflection: {
      ...fallback.user_reflection,
      ...(plan?.user_reflection || {})
    },
    adaptation_prompt: {
      ...fallback.adaptation_prompt,
      ...(plan?.adaptation_prompt || {})
    },
    ethical_layer: {
      ...fallback.ethical_layer,
      ...(plan?.ethical_layer || {})
    }
  };
}

function Badge({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-800",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-rose-100 text-rose-800",
    blue: "bg-sky-100 text-sky-800",
    violet: "bg-violet-100 text-violet-800"
  };

  return (
    <span className={classNames("rounded-md px-2.5 py-1 text-xs font-semibold", tones[tone])}>
      {children}
    </span>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-800">{label}</span>
      {children}
    </label>
  );
}

function OptionButton({ active, children, onClick }) {
  return (
    <button
      className={classNames(
        "min-h-11 rounded-md border px-3 py-2 text-left text-sm font-semibold transition",
        active
          ? "border-slate-950 bg-slate-950 text-white"
          : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
      )}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-soft">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-md bg-emerald-100 text-emerald-800">
        <Compass className="h-7 w-7" aria-hidden="true" />
      </div>
      <h2 className="max-w-md text-2xl font-bold text-slate-950">
        Explore a growth decision without giving away control.
      </h2>
      <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">
        Fill the form, answer quick clarifying questions, and get a same-page plan with risks,
        alternatives, and reflection prompts.
      </p>
    </div>
  );
}

function ThinkingSection({ thinking }) {
  const [expanded, setExpanded] = useState(false);
  if (!thinking) return null;

  const wordCount = thinking.trim().split(/\s+/).length;
  const preview = thinking.length > 400;

  return (
    <section className="rounded-lg border border-violet-800 bg-violet-950 p-5 shadow-soft">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-violet-800 text-violet-200">
            <Brain className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-bold text-white">Extended Thinking</h2>
            <p className="text-xs text-violet-300">
              Claude reasoned through your profile before generating this plan.
            </p>
          </div>
        </div>
        <Badge tone="violet">{wordCount} words of reasoning</Badge>
      </div>
      <div
        className={classNames(
          "whitespace-pre-wrap text-sm leading-7 text-violet-200 transition-all",
          !expanded && preview ? "line-clamp-5" : ""
        )}
      >
        {thinking}
      </div>
      {preview && (
        <button
          className="mt-3 text-xs font-bold text-violet-300 transition hover:text-white"
          type="button"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Show less" : "Read full reasoning →"}
        </button>
      )}
    </section>
  );
}

function ErrorFallback({ message }) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-900 shadow-soft">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <h2 className="font-bold">Something went wrong. Please try again.</h2>
          {message ? <p className="mt-1 text-sm">{message}</p> : null}
        </div>
      </div>
    </div>
  );
}

function LoadingPanel({ adapting, step }) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-8 text-center shadow-soft">
      <Loader2 className="h-12 w-12 animate-spin text-slate-950" aria-hidden="true" />
      <h2 className="mt-5 text-xl font-bold text-slate-950">
        {adapting ? "Adapting your plan..." : "Reasoning through your options"}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">{step}</p>
      <p className="mt-1 text-xs font-semibold text-violet-600">Extended Thinking active</p>
      <div className="mt-5 flex w-full max-w-md gap-1">
        {thinkingSteps.map((item, index) => (
          <div
            className={classNames(
              "h-2 flex-1 rounded-full transition",
              thinkingSteps.indexOf(step) >= index ? "bg-slate-950" : "bg-slate-200"
            )}
            key={item}
          />
        ))}
      </div>
    </div>
  );
}

function TextList({ items, icon: Icon = CheckCircle2 }) {
  const safeItems = safeArray(items);
  if (safeItems.length === 0) {
    return <p className="text-sm text-slate-500">No details available yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm leading-6 text-slate-600">
      {safeItems.map((item) => (
        <li className="flex gap-2" key={String(item)}>
          <Icon className="mt-1 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
          <span>{String(item)}</span>
        </li>
      ))}
    </ul>
  );
}

function SkillGapCard({ gap }) {
  const status = gap?.status || "needs_practice";
  const styles = {
    missing: {
      tone: "red",
      border: "border-l-4 border-l-rose-500"
    },
    needs_practice: {
      tone: "amber",
      border: "border-l-4 border-l-amber-400"
    },
    strong: {
      tone: "green",
      border: "border-l-4 border-l-emerald-500"
    }
  };
  const style = styles[status] || styles.needs_practice;

  return (
    <div className={classNames("rounded-lg border border-slate-200 bg-white p-4 shadow-soft", style.border)}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold text-slate-950">{gap?.skill || "Skill"}</h3>
        <div className="flex gap-2">
          <Badge tone={style.tone}>{status}</Badge>
          <Badge tone="slate">{gap?.importance || "medium"}</Badge>
        </div>
      </div>
      <p className="text-sm leading-6 text-slate-600">{gap?.reason || "Reason unavailable."}</p>
    </div>
  );
}

function WeekCard({ defaultOpen = false, label, onToggleTask, progress = {}, weekKey, week }) {
  const [open, setOpen] = useState(defaultOpen);
  const tasks = safeArray(week?.tasks);
  const doneCount = tasks.filter((_, i) => progress[i]).length;
  const allDone = tasks.length > 0 && doneCount === tasks.length;

  return (
    <div className={classNames(
      "rounded-lg border bg-white p-5 shadow-soft transition",
      allDone ? "border-emerald-400" : "border-slate-200"
    )}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">{label}</p>
            {tasks.length > 0 && (
              <span className={classNames(
                "text-xs font-semibold",
                allDone ? "text-emerald-600" : "text-slate-400"
              )}>
                {doneCount}/{tasks.length}
              </span>
            )}
            {allDone && <Check className="h-3.5 w-3.5 text-emerald-600" />}
          </div>
          <h3 className="mt-1 text-lg font-bold text-slate-950">{week?.focus || "Focus"}</h3>
        </div>
        <button
          className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
          type="button"
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          {open ? "Hide" : `See ${label.toLowerCase()}`}
        </button>
      </div>
      <div className={classNames("space-y-4", open ? "block" : "hidden")}>
        <div>
          <p className="mb-2 text-sm font-bold text-slate-800">Tasks</p>
          <ul className="space-y-2">
            {tasks.map((task, index) => (
              <li className="flex items-start gap-2" key={String(task)}>
                <button
                  className={classNames(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition",
                    progress[index]
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-slate-300 bg-white hover:border-emerald-400"
                  )}
                  type="button"
                  aria-label={progress[index] ? "Mark incomplete" : "Mark complete"}
                  onClick={() => onToggleTask?.(weekKey, index)}
                >
                  {progress[index] && <Check className="h-2.5 w-2.5" />}
                </button>
                <span className={classNames(
                  "text-sm leading-6",
                  progress[index] ? "text-slate-400 line-through" : "text-slate-600"
                )}>
                  {String(task)}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-md bg-slate-50 p-3 text-sm font-semibold text-slate-800">
          Why: {week?.why || "Reasoning unavailable."}
        </div>
      </div>
    </div>
  );
}

function buildProjectChecklist(project, weekOne) {
  const tasks = safeArray(weekOne?.tasks).slice(0, 3);
  const skills = safeArray(project?.skills_covered).slice(0, 2).join(" + ") || "the core skills";

  return [
    `Define the smallest useful version of "${project?.name || "this project"}" in 3-5 bullet points.`,
    tasks[0] || `Set up a repo and collect the first resources needed for ${skills}.`,
    tasks[1] || "Build one visible proof by the end of day three, even if it is rough.",
    `Write a short README explaining what the project proves about ${skills}.`
  ];
}

function ProjectCard({ project, selected, onSelect, weekOne }) {
  return (
    <div
      className={classNames(
        "rounded-lg border bg-white p-5 shadow-soft transition",
        selected ? "border-emerald-500 ring-4 ring-emerald-100" : "border-slate-200"
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold text-slate-950">{project?.name || "Project"}</h3>
        <TestTube2 className="h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
      </div>
      <p className="text-sm leading-6 text-slate-600">
        {project?.why_this_project || "Project reasoning unavailable."}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {safeArray(project?.skills_covered).map((skill) => (
          <Badge key={skill} tone="blue">
            {skill}
          </Badge>
        ))}
      </div>
      <button
        className={classNames(
          "mt-5 inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-bold transition",
          selected
            ? "bg-emerald-600 text-white"
            : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
        )}
        type="button"
        onClick={onSelect}
      >
        {selected ? "Selected" : "I'll build this"}
      </button>
      {selected ? (
        <div className="mt-4 rounded-md bg-emerald-50 p-4">
          <p className="text-sm font-bold text-emerald-950">Great choice. Here is your week 1 checklist:</p>
          <div className="mt-2">
            <TextList items={buildProjectChecklist(project, weekOne)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AlternativeCard({ path }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <h3 className="text-lg font-bold text-slate-950">{path?.option || "Alternative"}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        {path?.why_valid || "Reason unavailable."}
      </p>
      <p className="mt-4 rounded-md bg-sky-50 p-3 text-sm text-sky-950">
        Tradeoff: {path?.tradeoffs || "Tradeoff unavailable."}
      </p>
    </div>
  );
}

function RiskCard({ risk }) {
  const tone = risk?.likelihood === "high" ? "red" : risk?.likelihood === "medium" ? "amber" : "green";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold text-slate-950">{risk?.risk || "Risk"}</h3>
        <Badge tone={tone}>{risk?.likelihood || "low"}</Badge>
      </div>
      <p className="text-sm leading-6 text-slate-600">
        Mitigation: {risk?.mitigation || "Mitigation unavailable."}
      </p>
    </div>
  );
}

function serializePlanAsMarkdown(plan) {
  const weeks = ["week1", "week2", "week3", "week4"]
    .map((key, index) => {
      const week = plan.primary_plan?.[key];
      return `### Week ${index + 1}: ${week?.focus || "Focus"}\n${safeArray(week?.tasks)
        .map((task) => `- ${task}`)
        .join("\n")}\nWhy: ${week?.why || "Reasoning unavailable."}`;
    })
    .join("\n\n");

  return `# Career GPS Plan

## Situation
${plan.situation_understanding}

## Skill Gap
${safeArray(plan.skill_gap)
  .map((gap) => `- ${gap.skill} (${gap.status}, ${gap.importance}): ${gap.reason}`)
  .join("\n")}

## 4-Week Plan
${weeks}

## Projects
${safeArray(plan.projects)
  .map((project) => `- ${project.name}: ${project.why_this_project}`)
  .join("\n")}

## Alternative Paths
${safeArray(plan.alternative_paths)
  .map((path) => `- ${path.option}: ${path.why_valid} Tradeoff: ${path.tradeoffs}`)
  .join("\n")}

## Honest Limitations
${plan.ethical_layer?.limitations || ""}
${plan.ethical_layer?.uncertainty || ""}

This is decision support, not a guarantee.`;
}

function Results({ adaptationFeedback, onAdapt, onShare, onToggleTask, planRef, saveState, shareState, shareToken, taskProgress = {}, result, thinking }) {
  const [selectedProject, setSelectedProject] = useState(null);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const plan = mergePlan(result?.plan);
  const weeks = [
    ["Week 1", plan.primary_plan?.week1, "week1"],
    ["Week 2", plan.primary_plan?.week2, "week2"],
    ["Week 3", plan.primary_plan?.week3, "week3"],
    ["Week 4", plan.primary_plan?.week4, "week4"]
  ];

  const weekKeys = ["week1", "week2", "week3", "week4"];
  const totalTasks = weekKeys.reduce((sum, key) => sum + safeArray(plan.primary_plan?.[key]?.tasks).length, 0);
  const doneTasks = weekKeys.reduce((sum, key) => {
    const wp = taskProgress[key] || {};
    return sum + safeArray(plan.primary_plan?.[key]?.tasks).filter((_, i) => wp[i]).length;
  }, 0);
  const progressPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  if (!result?.plan) return null;

  async function copyPlan() {
    try {
      await navigator.clipboard.writeText(serializePlanAsMarkdown(plan));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      console.error("Copy plan failed:", err);
    }
  }

  async function exportPDF() {
    if (!planRef?.current) return;
    setExporting(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: "career-gps-plan.pdf",
          image: { type: "jpeg", quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
        })
        .from(planRef.current)
        .save();
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      {result.warning ? (
        <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>{result.warning}</p>
        </div>
      ) : null}

      <ThinkingSection thinking={thinking} />

      {totalTasks > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-950">Overall Progress</p>
              <p className="mt-0.5 text-xs text-slate-500">{doneTasks} of {totalTasks} tasks completed</p>
            </div>
            <span className={classNames(
              "text-2xl font-black",
              progressPct === 100 ? "text-emerald-600" : "text-slate-950"
            )}>
              {progressPct}%
            </span>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
            <div
              className={classNames(
                "h-2 rounded-full transition-all duration-500",
                progressPct === 100 ? "bg-emerald-500" : "bg-slate-950"
              )}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <SectionTitle icon={Brain} title="Situation" subtitle="How the system interprets your current state." />
          </div>
          <div className="flex flex-wrap gap-2">
            {saveState === "saving" && (
              <span className="inline-flex h-10 items-center gap-1.5 px-3 text-sm text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
              </span>
            )}
            {saveState === "saved" && (
              <span className="inline-flex h-10 items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700">
                <Cloud className="h-3.5 w-3.5" /> Saved
              </span>
            )}
            {shareToken && (
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
                type="button"
                onClick={onShare}
              >
                {shareState === "copied" ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
                {shareState === "copied" ? "Link copied!" : "Share plan"}
              </button>
            )}
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
              type="button"
              onClick={copyPlan}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy as text"}
            </button>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60"
              type="button"
              disabled={exporting}
              onClick={exportPDF}
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              {exporting ? "Exporting..." : "Export PDF"}
            </button>
          </div>
        </div>
        <p className="text-sm leading-6 text-slate-600">{plan.situation_understanding}</p>
      </section>

      <section>
        <SectionTitle icon={Brain} title="Skill Gap" subtitle="What appears strong, uncertain, or missing." />
        <div className="grid gap-4 sm:grid-cols-2">
          {safeArray(plan.skill_gap).map((gap, index) => (
            <SkillGapCard gap={gap} key={`${gap?.skill || "skill"}-${index}`} />
          ))}
        </div>
      </section>

      <section>
        <SectionTitle icon={Route} title="Primary Plan" subtitle="One possible path, not the only correct path." />
        <div className="grid gap-4 lg:grid-cols-2">
          {weeks.map(([label, week, weekKey], index) => (
            <WeekCard
              defaultOpen={index === 0}
              key={label}
              label={label}
              weekKey={weekKey}
              week={week}
              progress={taskProgress[weekKey] || {}}
              onToggleTask={onToggleTask}
            />
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <SectionTitle icon={Map} title="Adaptive Adjustment" subtitle="How the plan changes based on known constraints." />
        <h3 className="text-sm font-bold text-slate-950">Changes made</h3>
        <div className="mt-2">
          <TextList items={plan.adaptive_adjustment?.changes_made} />
        </div>
        <h3 className="mt-5 text-sm font-bold text-slate-950">Based on inputs</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {plan.adaptive_adjustment?.based_on_inputs || "Input reasoning unavailable."}
        </p>
        <h3 className="mt-5 text-sm font-bold text-slate-950">Tradeoffs</h3>
        <div className="mt-2">
          <TextList items={plan.adaptive_adjustment?.tradeoffs} icon={ArrowRight} />
        </div>
      </section>

      <section>
        <SectionTitle icon={Sparkles} title="Project Options" subtitle="Evidence-building ideas, not guaranteed outcomes." />
        <div className="grid gap-4 lg:grid-cols-2">
          {safeArray(plan.projects).map((project, index) => (
            <ProjectCard
              project={project}
              selected={selectedProject === index}
              weekOne={plan.primary_plan?.week1}
              key={`${project?.name || "project"}-${index}`}
              onSelect={() => setSelectedProject(index)}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="rounded-lg border border-slate-200 bg-slate-950 p-5 text-white shadow-soft">
          <p className="text-sm font-semibold text-slate-300">Confidence</p>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-5xl font-black">{plan.confidence_analysis?.score ?? 0}</span>
            <span className="pb-2 text-lg font-bold text-slate-300">/100</span>
          </div>
          <div className="mt-4 h-2 rounded-full bg-white/15">
            <div
              className="h-2 rounded-full bg-emerald-400"
              style={{ width: `${Math.min(100, Math.max(0, plan.confidence_analysis?.score ?? 0))}%` }}
            />
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            {plan.confidence_analysis?.uncertainty_reasons || "Uncertainty details unavailable."}
          </p>
          <p className="mt-4 rounded-md bg-white/10 p-3 text-sm leading-6 text-slate-200">
            More confidence: {plan.confidence_analysis?.what_would_improve || "More evidence would help."}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-slate-950">Reasoning Transparency</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {plan.reasoning_transparency?.why_this_path || "Reasoning unavailable."}
          </p>
          <h3 className="mt-5 text-sm font-bold text-slate-950">Assumptions</h3>
          <div className="mt-2">
            <TextList items={plan.reasoning_transparency?.assumptions} />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 shadow-soft">
        <SectionTitle
          icon={AlertCircle}
          title="Epistemic Honesty"
          subtitle="What the system knows, what it does not know, and where you should stay skeptical."
        />
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h3 className="text-sm font-bold text-emerald-950">Specific limitations</h3>
            <div className="mt-2 space-y-3 text-sm leading-6 text-emerald-950">
              <p>{plan.ethical_layer?.limitations || "Plan limitations unavailable."}</p>
              <p>{plan.ethical_layer?.uncertainty || "Uncertainty details unavailable."}</p>
              <p>{plan.ethical_layer?.user_agency || "You keep final decision control."}</p>
            </div>
          </div>
          <div className="rounded-md bg-white/70 p-4">
            <h3 className="text-sm font-bold text-emerald-950">What Claude does not know about you</h3>
            <div className="mt-2">
              <TextList
                items={[
                  plan.confidence_analysis?.what_would_improve,
                  ...safeArray(plan.reasoning_transparency?.assumptions).slice(0, 2)
                ].filter(Boolean)}
                icon={AlertCircle}
              />
            </div>
            <p className="mt-3 text-sm leading-6 text-emerald-950">
              {plan.ethical_layer?.suggestion || "Consult mentors or professionals for validation."}
            </p>
          </div>
        </div>
      </section>

      <section>
        <SectionTitle icon={AlertCircle} title="Risk And Failure Modes" subtitle="Places the plan could break, with mitigations." />
        <div className="grid gap-4 lg:grid-cols-3">
          {safeArray(plan.risk_and_failure_modes).map((risk, index) => (
            <RiskCard risk={risk} key={`${risk?.risk || "risk"}-${index}`} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-slate-950">Failure Scenarios</h2>
          <div className="mt-3">
            <TextList items={plan.failure_scenarios} icon={AlertCircle} />
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-slate-950">Timeline Reality</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">{plan.timeline_reality}</p>
        </div>
      </section>

      <section>
        <SectionTitle icon={Compass} title="Alternative Paths" subtitle="Other directions worth comparing." />
        <div className="grid gap-4 lg:grid-cols-2">
          {safeArray(plan.alternative_paths).map((path, index) => (
            <AlternativeCard path={path} key={`${path?.option || "path"}-${index}`} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-slate-950">Decisions You Control</h2>
          <div className="mt-3">
            <TextList items={plan.user_reflection?.decisions_user_must_make} />
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-slate-950">Questions To Consider</h2>
          <div className="mt-3">
            <TextList items={plan.user_reflection?.questions_to_consider} icon={ArrowRight} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-slate-950">Adapt This Plan</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">{plan.adaptation_prompt?.message}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {safeArray(plan.adaptation_prompt?.options).map((option) => (
              <button
                className={classNames(
                  "rounded-md px-3 py-2 text-sm font-bold transition",
                  adaptationFeedback === option
                    ? "bg-slate-950 text-white"
                    : "bg-sky-100 text-sky-900 hover:bg-sky-200"
                )}
                key={option}
                type="button"
                onClick={() => onAdapt(option)}
              >
                {option}
              </button>
            ))}
          </div>
          {adaptationFeedback ? (
            <p className="mt-3 text-xs font-semibold text-slate-500">
              Last adapted for: {adaptationFeedback}
            </p>
          ) : null}
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-slate-950">Share This Plan</h2>
          {shareToken ? (
            <>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Share this plan with a mentor, friend, or future self. The link persists.
              </p>
              <button
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800"
                type="button"
                onClick={onShare}
              >
                {shareState === "copied" ? <Check className="h-4 w-4" /> : <Link className="h-4 w-4" />}
                {shareState === "copied" ? "Link copied to clipboard!" : "Copy shareable link"}
              </button>
            </>
          ) : (
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Generate a plan to get a shareable link. Copy the plan as text or export a PDF to share offline.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function ClarificationModal({
  adaptiveAnswers,
  adaptiveQuestions,
  coreAnswers,
  loading,
  onAdaptiveAnswer,
  onClose,
  onCoreContinue,
  onFinalGenerate,
  onSetCoreAnswer,
  onToggleExperience,
  questionLoading,
  resumeText,
  setResumeText,
  step
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-5 shadow-soft">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-950">Clarify Before Generating</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              These quick answers help reduce uncertainty before the final AI call.
            </p>
          </div>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
            type="button"
            onClick={onClose}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {step === "core" ? (
          <div className="space-y-5">
            <Field label="Which of these have you done?">
              <div className="grid gap-2 sm:grid-cols-2">
                {experienceOptions.map((option) => (
                  <OptionButton
                    active={coreAnswers.experienceChecks.includes(option)}
                    key={option}
                    onClick={() => onToggleExperience(option)}
                  >
                    {option}
                  </OptionButton>
                ))}
              </div>
            </Field>

            <Field label="Goal">
              <div className="grid gap-2 sm:grid-cols-3">
                {goalOptions.map((option) => (
                  <OptionButton
                    active={coreAnswers.immediateGoal === option}
                    key={option}
                    onClick={() => onSetCoreAnswer("immediateGoal", option)}
                  >
                    {option}
                  </OptionButton>
                ))}
              </div>
            </Field>

            <Field label="Learning style">
              <div className="grid gap-2 sm:grid-cols-3">
                {learningOptions.map((option) => (
                  <OptionButton
                    active={coreAnswers.learningPreference === option}
                    key={option}
                    onClick={() => onSetCoreAnswer("learningPreference", option)}
                  >
                    {option}
                  </OptionButton>
                ))}
              </div>
            </Field>

            <Field label="Constraint">
              <div className="grid gap-2 sm:grid-cols-2">
                {constraintOptions.map((option) => (
                  <OptionButton
                    active={coreAnswers.mainBlocker === option}
                    key={option}
                    onClick={() => onSetCoreAnswer("mainBlocker", option)}
                  >
                    {option}
                  </OptionButton>
                ))}
              </div>
            </Field>

            <Field label="Optional project description">
              <textarea
                className="min-h-24 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
                value={coreAnswers.projectDescription}
                onChange={(event) => onSetCoreAnswer("projectDescription", event.target.value)}
                placeholder="Example: Built a marks predictor with pandas and linear regression"
              />
            </Field>

            <Field label="Paste your resume (optional)">
              <textarea
                className="min-h-36 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
                value={resumeText}
                onChange={(event) => setResumeText(event.target.value)}
                placeholder="Paste your resume text here (projects, skills, experience)"
              />
            </Field>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
                type="button"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-70"
                type="button"
                disabled={questionLoading}
                onClick={onCoreContinue}
              >
                {questionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate adaptive questions
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {adaptiveQuestions.map((question) => (
              <Field label={question.question} key={question.id}>
                <div className="grid gap-2 sm:grid-cols-3">
                  {safeArray(question.options).map((option) => (
                    <OptionButton
                      active={adaptiveAnswers[question.id] === option}
                      key={option}
                      onClick={() => onAdaptiveAnswer(question.id, option)}
                    >
                      {option}
                    </OptionButton>
                  ))}
                </div>
              </Field>
            ))}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
                type="button"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-70"
                type="button"
                disabled={loading}
                onClick={onFinalGenerate}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate final plan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function summarizePlanForAdaptation(plan) {
  if (!plan) return "";

  return [
    `Primary week 1: ${plan.primary_plan?.week1?.focus || ""}`,
    `Projects: ${safeArray(plan.projects)
      .map((project) => project?.name)
      .filter(Boolean)
      .join(", ")}`,
    `Alternatives: ${safeArray(plan.alternative_paths)
      .map((path) => path?.option)
      .filter(Boolean)
      .join(", ")}`
  ].join(" | ");
}

export default function App() {
  const [formData, setFormData] = useState(initialFormData);
  const [resumeText, setResumeText] = useState("");
  const [coreAnswers, setCoreAnswers] = useState(initialCoreAnswers);
  const [adaptiveQuestions, setAdaptiveQuestions] = useState([]);
  const [adaptiveAnswers, setAdaptiveAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState("core");
  const [questionLoading, setQuestionLoading] = useState(false);
  const [adaptationFeedback, setAdaptationFeedback] = useState("");
  const [lastGenerationContext, setLastGenerationContext] = useState(null);
  const [loadingStep, setLoadingStep] = useState(thinkingSteps[0]);
  const [planId, setPlanId] = useState(null);
  const [shareToken, setShareToken] = useState(null);
  const [taskProgress, setTaskProgress] = useState({});
  const [saveState, setSaveState] = useState(null); // null | "saving" | "saved" | "error"
  const [shareState, setShareState] = useState("idle"); // "idle" | "copied"
  const resultsRef = useRef(null);
  const planRef = useRef(null);

  useEffect(() => {
    if (!loading) {
      setLoadingStep(thinkingSteps[0]);
      return undefined;
    }

    let index = 0;
    const interval = window.setInterval(() => {
      index = (index + 1) % thinkingSteps.length;
      setLoadingStep(thinkingSteps[index]);
    }, 1200);

    return () => window.clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (result?.plan && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("plan");
    if (token) {
      loadSharedPlan(token);
    } else {
      const session = lsLoad();
      if (session?.result?.plan) {
        setResult(session.result);
        setTaskProgress(session.taskProgress || {});
        setShareToken(session.shareToken || null);
        setPlanId(session.planId || null);
        if (session.shareToken) {
          setSaveState("saved");
          // Restore the plan URL so it's bookmarkable after a refresh
          const url = new URL(window.location.href);
          url.searchParams.set("plan", session.shareToken);
          window.history.replaceState({}, "", url.toString());
        }
      }
    }
  }, []);

  useEffect(() => {
    if (result?.plan) {
      lsSave({ result, taskProgress, shareToken, planId, contextKey: result._contextKey });
    }
  }, [result, taskProgress, shareToken, planId]);

  async function loadSharedPlan(token) {
    setLoading(true);
    setError("");
    try {
      const record = await loadPlanByToken(token);
      if (record?.plan_data) {
        setResult({ plan: record.plan_data, source: "shared" });
        setPlanId(record.id);
        setShareToken(record.share_token);
        setTaskProgress(record.progress || {});
        setSaveState("saved");
      }
    } catch (err) {
      console.error("Failed to load shared plan:", err);
      setError("Could not load the shared plan. It may have been deleted.");
    } finally {
      setLoading(false);
    }
  }

  async function persistPlan(context, payload) {
    setSaveState("saving");
    try {
      const saved = await savePlan(context, payload.plan);
      if (saved) {
        setPlanId(saved.id);
        setShareToken(saved.share_token);
        const url = new URL(window.location.href);
        url.searchParams.set("plan", saved.share_token);
        window.history.replaceState({}, "", url.toString());
        setSaveState("saved");
      }
    } catch (err) {
      console.error("Failed to save plan:", err);
      setSaveState(null);
    }
  }

  function handleToggleTask(weekKey, taskIndex) {
    setTaskProgress((prev) => {
      const weekProg = prev[weekKey] || {};
      const next = {
        ...prev,
        [weekKey]: { ...weekProg, [taskIndex]: !weekProg[taskIndex] }
      };
      if (planId) updateProgress(planId, next).catch(console.error);
      return next;
    });
  }

  async function handleShare() {
    if (!shareToken) return;
    const url = `${window.location.origin}${window.location.pathname}?plan=${shareToken}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareState("copied");
      window.setTimeout(() => setShareState("idle"), 2400);
    } catch {
      setShareState("idle");
    }
  }

  function updateField(field, value) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  function updateCoreAnswer(field, value) {
    setCoreAnswers((current) => ({ ...current, [field]: value }));
  }

  function toggleExperience(option) {
    setCoreAnswers((current) => {
      const hasOption = current.experienceChecks.includes(option);
      const next = hasOption
        ? current.experienceChecks.filter((item) => item !== option)
        : [...current.experienceChecks.filter((item) => item !== "None"), option];

      return {
        ...current,
        experienceChecks: option === "None" && !hasOption ? ["None"] : next
      };
    });
  }

  function loadSample() {
    setFormData({
      year: sampleInput.year,
      skills: sampleInput.skills,
      targetRole: sampleInput.targetRole,
      hoursPerWeek: sampleInput.hoursPerWeek
    });
    setCoreAnswers({
      ...initialCoreAnswers,
      experienceChecks: sampleInput.experienceChecks,
      projectDescription: sampleInput.projectDescription,
      learningPreference: sampleInput.learningPreference,
      immediateGoal: sampleInput.immediateGoal,
      mainBlocker: sampleInput.mainBlocker
    });
    setResumeText(sampleInput.resumeText || "");
    setAdaptiveQuestions(fallbackAdaptiveQuestions);
    setAdaptiveAnswers({});
    setResult({ plan: createFallbackPlan(sampleInput), source: "sample" });
    setError("");
    setAdaptationFeedback("");
    setPlanId(null);
    setShareToken(null);
    setTaskProgress({});
    setSaveState(null);
    setLastGenerationContext({
      ...sampleInput,
      adaptiveAnswers: {}
    });
    setShowModal(false);
    setModalStep("core");
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setResult(null);
    lsClear();
    setModalStep("core");
    setShowModal(true);
  }

  async function handleCoreContinue() {
    setQuestionLoading(true);
    setError("");

    try {
      const questions = await generateAdaptiveQuestions({
        ...formData,
        ...coreAnswers,
        resumeText
      });
      setAdaptiveQuestions(questions);
      setAdaptiveAnswers({});
      setModalStep("adaptive");
    } catch (err) {
      console.error("Adaptive question flow failed:", err);
      setAdaptiveQuestions(fallbackAdaptiveQuestions);
      setModalStep("adaptive");
    } finally {
      setQuestionLoading(false);
    }
  }

  async function handleFinalGenerate() {
    setError("");
    setShowModal(false);
    setAdaptationFeedback("");

    const context = {
      ...formData,
      ...coreAnswers,
      resumeText,
      adaptiveAnswers
    };
    const key = contextKey(context);

    // Return cached plan if inputs are identical
    const session = lsLoad();
    if (session?.contextKey === key && session?.result?.plan) {
      setResult(session.result);
      setTaskProgress(session.taskProgress || {});
      setShareToken(session.shareToken || null);
      setPlanId(session.planId || null);
      if (session.shareToken) setSaveState("saved");
      setLastGenerationContext(context);
      return;
    }

    setLoading(true);
    setPlanId(null);
    setShareToken(null);
    setTaskProgress({});
    setSaveState(null);

    try {
      const payload = await generateCareerPlan(context);

      if (!payload?.plan) {
        throw new Error("The AI response did not include a plan.");
      }

      // Stamp the context key so the cache can match it next time
      payload._contextKey = key;
      setResult(payload);
      setLastGenerationContext(context);
      persistPlan(context, payload);
    } catch (err) {
      console.error("Final generation failed:", err);
      setError("Something went wrong. Please try again.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdaptPlan(option) {
    const context =
      lastGenerationContext || {
        ...formData,
        ...coreAnswers,
        resumeText,
        adaptiveAnswers
      };

    setLoading(true);
    setError("");
    setAdaptationFeedback(option);
    setPlanId(null);
    setShareToken(null);
    setTaskProgress({});
    setSaveState(null);

    try {
      const payload = await generateCareerPlan({
        ...context,
        adaptation: option,
        previousPlanSummary: summarizePlanForAdaptation(result?.plan)
      });

      if (!payload?.plan) {
        throw new Error("The adapted AI response did not include a plan.");
      }

      setResult(payload);
      setLastGenerationContext(context);
      persistPlan({ ...context, adaptation: option, previousPlanSummary: summarizePlanForAdaptation(result?.plan) }, payload);
    } catch (err) {
      console.error("Plan adaptation failed:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f7fb]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-950 text-white">
              <Compass className="h-7 w-7" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">Career GPS</h1>
              <p className="mt-1 text-sm font-medium text-slate-600">
                Adaptive Decision Support for Career Growth
              </p>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-800">
                Built for engineering students in India navigating their first technical internship.
                No career counselor. No paid mentor. Just honest, adaptive guidance.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <Badge tone="violet">extended thinking</Badge>
            <Badge tone="green">clarifying</Badge>
            <Badge tone="blue">risks</Badge>
            <Badge tone="amber">alternatives</Badge>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[390px_1fr] lg:px-8">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <form
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft"
            onSubmit={handleSubmit}
          >
            <div className="mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-100 text-emerald-800">
                  <Target className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-950">Decision Context</h2>
                  <p className="text-sm text-slate-600">Keep it honest and specific.</p>
                </div>
              </div>
              <div className="mt-4 rounded-md border border-sky-100 bg-sky-50 p-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-800">
                  Who this is for
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone="blue">1st-4th year engineering students</Badge>
                  <Badge tone="blue">First technical internship or role switch</Badge>
                  <Badge tone="blue">8-20 hours/week for prep</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Field label="Current year">
                <select
                  className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
                  value={formData.year}
                  onChange={(event) => updateField("year", event.target.value)}
                  required
                >
                  <option value="">Select year</option>
                  {yearOptions.map((year) => (
                    <option value={year} key={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Your current skills">
                <textarea
                  className="min-h-28 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
                  value={formData.skills}
                  onChange={(event) => updateField("skills", event.target.value)}
                  placeholder="Example: Python basics, HTML, CSS, Git"
                  required
                />
              </Field>

              <Field label="Target role">
                <input
                  className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
                  value={formData.targetRole}
                  onChange={(event) => updateField("targetRole", event.target.value)}
                  placeholder="Example: ML Engineer"
                  required
                />
              </Field>

              <Field label="Time available per week">
                <div className="flex items-center gap-3">
                  <Clock3 className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
                  <input
                    className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
                    value={formData.hoursPerWeek}
                    onChange={(event) => updateField("hoursPerWeek", event.target.value)}
                    type="number"
                    min="1"
                    max="40"
                    required
                  />
                </div>
              </Field>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                type="submit"
                disabled={loading}
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Generate
              </button>
              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
                type="button"
                onClick={loadSample}
              >
                <TestTube2 className="h-4 w-4" aria-hidden="true" />
                Try sample
              </button>
            </div>

            {saveState === "saved" && shareToken ? (
              <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 p-3">
                <div className="flex items-center gap-2">
                  <Cloud className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                  <p className="text-xs font-bold text-emerald-800">Plan saved — revisit any time</p>
                </div>
                <p className="mt-1 text-xs text-emerald-700">
                  Bookmark or share this link. It loads your exact plan, progress, and context.
                </p>
                <button
                  className="mt-2 w-full truncate rounded border border-emerald-200 bg-white px-2 py-1.5 text-left font-mono text-xs text-emerald-900 transition hover:bg-emerald-100"
                  type="button"
                  title="Click to copy link"
                  onClick={handleShare}
                >
                  {`${window.location.origin}/?plan=${shareToken}`}
                </button>
                {shareState === "copied" && (
                  <p className="mt-1 text-center text-xs font-semibold text-emerald-700">Copied!</p>
                )}
              </div>
            ) : (
              <p className="mt-5 rounded-md bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                This is decision support, not a guarantee. You stay in control of the final choice.
              </p>
            )}
          </form>
        </aside>

        <div className="min-w-0">
          {loading ? (
            <LoadingPanel adapting={Boolean(adaptationFeedback)} step={loadingStep} />
          ) : error ? (
            <ErrorFallback message={error} />
          ) : result?.plan ? (
            <div ref={resultsRef}>
              <div ref={planRef}>
                <Results
                  adaptationFeedback={adaptationFeedback}
                  planRef={planRef}
                  result={result}
                  thinking={result?.thinking || null}
                  saveState={saveState}
                  shareState={shareState}
                  shareToken={shareToken}
                  taskProgress={taskProgress}
                  onAdapt={handleAdaptPlan}
                  onShare={handleShare}
                  onToggleTask={handleToggleTask}
                />
              </div>
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>

      {showModal ? (
        <ClarificationModal
          adaptiveAnswers={adaptiveAnswers}
          adaptiveQuestions={adaptiveQuestions}
          coreAnswers={coreAnswers}
          loading={loading}
          questionLoading={questionLoading}
          resumeText={resumeText}
          setResumeText={setResumeText}
          step={modalStep}
          onAdaptiveAnswer={(id, value) =>
            setAdaptiveAnswers((current) => ({ ...current, [id]: value }))
          }
          onClose={() => setShowModal(false)}
          onCoreContinue={handleCoreContinue}
          onFinalGenerate={handleFinalGenerate}
          onSetCoreAnswer={updateCoreAnswer}
          onToggleExperience={toggleExperience}
        />
      ) : null}
    </main>
  );
}
