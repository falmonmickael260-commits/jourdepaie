import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase public (clé anonyme, utilisable dans le navigateur).
 *
 * ⚠️ Non configuré dans cet environnement : aucune variable NEXT_PUBLIC_SUPABASE_*
 * n'est définie. Tant que ce n'est pas fait, `isSupabaseConfigured` reste `false`
 * et aucune fonctionnalité multijoueur réseau ne doit se présenter comme active.
 * Voir supabase/README.md pour la procédure complète.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured ? createClient(url!, anonKey!) : null;
