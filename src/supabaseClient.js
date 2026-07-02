import { createClient } from "@supabase/supabase-js";

// ==========================================
// SUPABASE CONFIGURATION
// Replace these placeholders with your actual project URL and API public key
// ==========================================

// Note: Ensure this is the base URL (usually: https://your-project-id.supabase.co)
// We automatically strip '/rest/v1/' or trailing slashes to guarantee Auth routes correctly!
const RAW_URL = "https://bndqkqrqgoymfnsyusci.supabase.co/rest/v1/";
const SUPABASE_URL = RAW_URL.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");

const SUPABASE_PUBLIC_KEY = "sb_publishable_V1gRIB0n0JgR8l3pIi8IWg_6U5pQWCS";

// Initialize and export the Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);

