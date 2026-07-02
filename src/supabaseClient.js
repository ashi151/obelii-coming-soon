import { createClient } from "@supabase/supabase-js";

// ==========================================
// SUPABASE CONFIGURATION
// Replace these placeholders with your actual project URL and API public key
// ==========================================

const SUPABASE_URL = "https://bndqkqrqgoymfnsyusci.supabase.co/rest/v1/";
const SUPABASE_PUBLIC_KEY = "sb_publishable_V1gRIB0n0JgR8l3pIi8IWg_6U5pQWCS";

// Initialize and export the Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
