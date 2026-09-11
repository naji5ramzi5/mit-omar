import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  'https://sdfyfzefoshdbctzkyrs.supabase.co';

const supabaseAnonKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkZnlmemVmb3NoZGJjdHpreXJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjU0MDMwNywiZXhwIjoyMTAyMTE2MzA3fQ.KPphzngGRqkIxSfoqwoIv2JQb3bYdbNI7aQjH9PqXog';

const supabaseServiceKey = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkZnlmemVmb3NoZGJjdHpreXJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjU0MDMwNywiZXhwIjoyMTAyMTE2MzA3fQ.KPphzngGRqkIxSfoqwoIv2JQb3bYdbNI7aQjH9PqXog';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
