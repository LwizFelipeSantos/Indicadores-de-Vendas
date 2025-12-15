import { createClient } from '@supabase/supabase-js';

// Best Practice: Try to use Environment Variables first, fallback to provided keys for immediate testing.
// In production, configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.

const getEnv = (key: string) => {
  // Check for Vite/Standard Process env
  // Cast import.meta to any to avoid TS error if types are missing
  const meta = import.meta as any;
  if (typeof meta !== 'undefined' && meta.env && meta.env[key]) {
    return meta.env[key];
  }
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    // @ts-ignore
    return process.env[key];
  }
  return null;
};

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL') || 'https://mfowrdiyjpkwcnpffmnx.supabase.co';
const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY') || 'sb_publishable_ztunRPpZGYSIXZUwpfb1Rw_eVeXotYr';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);