import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SUPABASE_URL = "https://zghkaofihchhiziqukvw.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnaGthb2ZpaGNoaGl6aXF1a3Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MzI1NTksImV4cCI6MjA4NzAwODU1OX0.ayM2iVf8j6djVvqamJTy16_D9Eafl7-KQc27HEVzDGg";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
