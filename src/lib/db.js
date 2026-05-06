import { supabase } from "./supabase";

export async function savePlan(formData, planData) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("plans")
    .insert({ form_data: formData, plan_data: planData })
    .select("id, share_token")
    .single();
  if (error) throw error;
  return data;
}

export async function loadPlanByToken(token) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("plans")
    .select("id, plan_data, form_data, progress, share_token")
    .eq("share_token", token)
    .single();
  if (error) throw error;
  return data;
}

export async function updateProgress(id, progress) {
  if (!supabase) return;
  await supabase
    .from("plans")
    .update({ progress, updated_at: new Date().toISOString() })
    .eq("id", id);
}
