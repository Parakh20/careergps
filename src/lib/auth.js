import { supabase } from "./supabase";

export async function signUp(email, password) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: window.location.origin }
  });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getCurrentUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

export function onAuthChange(callback) {
  if (!supabase) return () => {};
  const result = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null, event);
  });
  return () => result?.data?.subscription?.unsubscribe();
}
