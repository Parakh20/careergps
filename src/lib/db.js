import { supabase } from "./supabase";

function deriveTitle(formData) {
  const role = formData?.targetRole?.trim() || "Plan";
  const year = formData?.year?.trim();
  return year ? `${role} — ${year}` : role;
}

export async function savePlan(formData, planData, options = {}) {
  if (!supabase) return null;
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user || null;

  const { data, error } = await supabase
    .from("plans")
    .insert({
      form_data: formData,
      plan_data: planData,
      user_id: user?.id || null,
      title: options.title || deriveTitle(formData)
    })
    .select("id, share_token, title")
    .single();
  if (error) throw error;
  return data;
}

export async function updatePlan(id, { formData, planData, title }) {
  if (!supabase) return;
  const patch = { updated_at: new Date().toISOString() };
  if (formData) patch.form_data = formData;
  if (planData) patch.plan_data = planData;
  if (title) patch.title = title;
  const { error } = await supabase.from("plans").update(patch).eq("id", id);
  if (error) throw error;
}

export async function loadPlanByToken(token) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("plans")
    .select("id, plan_data, form_data, progress, share_token, title, user_id, updated_at")
    .eq("share_token", token)
    .single();
  if (error) throw error;
  return data;
}

export async function listMyPlans() {
  if (!supabase) return [];
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user || null;
  if (!user) return [];

  const { data, error } = await supabase
    .from("plans")
    .select("id, share_token, title, form_data, progress, plan_data, created_at, updated_at")
    .eq("user_id", user.id)
    .eq("archived", false)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function deletePlan(id) {
  if (!supabase) return;
  const { error } = await supabase.from("plans").delete().eq("id", id);
  if (error) throw error;
}

export async function updatePlanTitle(id, title) {
  if (!supabase) return;
  await supabase.from("plans").update({ title }).eq("id", id);
}

export async function updateProgress(id, progress) {
  if (!supabase) return;
  await supabase
    .from("plans")
    .update({ progress, updated_at: new Date().toISOString() })
    .eq("id", id);
}

export async function claimPlan(id) {
  if (!supabase) return;
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user || null;
  if (!user) return;
  await supabase.from("plans").update({ user_id: user.id }).eq("id", id).is("user_id", null);
}
